// Shotlist Scheduler - team sync API (Netlify Functions v2 + Netlify Blobs)
//
// Storage layout (one Blobs store, strong consistency). Each project has its own space:
//   projects/<pid>            {id, name, created, archived}
//   p/<pid>/snapshot          {upto, model}  older edits folded together; replaced only with onlyIfMatch
//   p/<pid>/seed              the project as it was created (for "Reset day")
//   p/<pid>/ops/<stamp>       one batch of edits per save; written once with onlyIfNew, never changed
//   p/<pid>/acks/<cid>-<bid>  marks a batch as received, so a retried save isn't stored twice
//   p/<pid>/presence/<cid>    who has the project open
//   img/<id>                  uploaded reference images
//
// Saving an edit never rewrites a shared record, so people saving at the same moment
// can't overwrite each other's work. The per-field merge in model-core decides what
// everyone sees, and every device arrives at the same result.

import { getStore } from "@netlify/blobs";
import * as M from "../../shared/model-core.mjs";
import SEED from "../../shared/seed-data.mjs";

export const config = { path: ["/api/ping", "/api/projects", "/api/sync", "/api/ops", "/api/image", "/api/seed", "/api/activity"] };

const WINDOW_MS = 30_000;        // re-offer batches this recent, to cover saves still in flight
const COMPACT_AT = 250;          // fold old batches into the snapshot once there are this many
const COMPACT_AGE_MS = 120_000;  // only fold batches older than this
const PRESENCE_TTL_MS = 45_000;
const MAX_BODY = 5_500_000;      // Netlify's request limit is ~6 MB
const DEFAULT_PID = SEED.id || "main";

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" }
});
const rand = (n = 6) => Math.random().toString(36).slice(2, 2 + n).padEnd(n, "0");
const newKey = () => M.pad13(Date.now()) + "-" + rand(6);
// Production keeps the real schedule. Deploy previews and branch deploys get their own
// store, so testing a change can never touch the team's data.
let STORE_NAME = "shotlist";
const store = () => getStore({ name: STORE_NAME, consistency: "strong" });
const cleanPid = (s) => String(s || "").replace(/[^a-z0-9-]/gi, "").slice(0, 40);

async function readBody(req){
  const text = await req.text();
  if (text.length > MAX_BODY) throw Object.assign(new Error("That's too large to save in one go"), { status: 413 });
  return text ? JSON.parse(text) : {};
}
async function listKeys(st, prefix){
  const { blobs } = await st.list({ prefix });
  return blobs.map(b => b.key).sort();
}
async function ensureDefaultProject(st){
  const meta = await st.get("projects/" + DEFAULT_PID, { type: "json" });
  if (!meta) await st.setJSON("projects/" + DEFAULT_PID, { id: DEFAULT_PID, name: (SEED.project && SEED.project.name) || "Project", created: Date.now() }, { onlyIfNew: true });
}
async function seedFor(st, pid){
  if (pid === DEFAULT_PID) return SEED;
  return await st.get(`p/${pid}/seed`, { type: "json" });
}
async function getSnapshot(st, pid){
  const key = `p/${pid}/snapshot`;
  let r = await st.getWithMetadata(key, { type: "json" });
  if (!r){
    const seed = await seedFor(st, pid);
    if (!seed) return null;
    await st.setJSON(key, { upto: "", model: M.seedModel(seed) }, { onlyIfNew: true });  // anyone racing just reads the winner's copy
    r = await st.getWithMetadata(key, { type: "json" });
  }
  return { snap: r.data, etag: r.etag };
}
function validOps(ops){
  if (!Array.isArray(ops) || ops.length === 0 || ops.length > 3000) return false;
  return ops.every(o => o && ["doc", "day", "row", "person"].includes(o.e) && typeof o.id === "string" && o.id.length <= 80
    && o.set && typeof o.set === "object" && !Array.isArray(o.set));
}
async function compact(st, pid, snap, etag, keys){
  const cutoff = M.pad13(Date.now() - COMPACT_AGE_MS);
  const base = `p/${pid}/ops/`;
  const old = keys.filter(k => k.slice(base.length) < cutoff);
  if (old.length < 50) return;
  const batches = (await Promise.all(old.map(k => st.get(k, { type: "json" })))).filter(Boolean);
  const model = M.cloneModel(snap.model);
  batches.sort((a, b) => (a.k < b.k ? -1 : 1)).forEach(b => M.foldBatch(model, b));
  const upto = [snap.upto, ...batches.map(b => b.k)].sort().pop();
  const res = await st.setJSON(`p/${pid}/snapshot`, { upto, model }, { onlyIfMatch: etag });
  if (res.modified) await Promise.all(old.map(k => st.delete(k)));   // only the winner of a race deletes
}

export default async (req, context) => {
  const ctx = (context && context.deploy && context.deploy.context) || process.env.CONTEXT || "production";
  STORE_NAME = ctx === "production" ? "shotlist" : "shotlist-" + String(ctx).replace(/[^a-z0-9-]/gi, "-");
  const url = new URL(req.url);
  const path = url.pathname;
  // Access: Netlify's site password protects every request, including these functions.
  // TEAM_KEY is an optional second key; when it isn't set, the site password is the only gate.
  const teamKey = process.env.TEAM_KEY || "";
  if (path === "/api/ping") return json({ app: "shotlist-scheduler", ok: true, needsKey: !!teamKey, data: STORE_NAME === "shotlist" ? "live" : "preview" });
  if (teamKey && req.headers.get("x-team-key") !== teamKey) return json({ error: "That team key isn't right." }, 401);

  const st = store();
  const pid = cleanPid(url.searchParams.get("p")) || DEFAULT_PID;
  try {
    if (path === "/api/projects"){
      await ensureDefaultProject(st);
      if (req.method === "POST"){
        const body = await readBody(req);
        if (body.action === "archive" || body.action === "restore"){
          const id = cleanPid(body.id), meta = await st.get("projects/" + id, { type: "json" });
          if (!meta) return json({ error: "No such project" }, 404);
          meta.archived = body.action === "archive";
          await st.setJSON("projects/" + id, meta);
          return json({ ok: true });
        }
        const seed = body.seed;
        if (!seed || !Array.isArray(seed.days)) return json({ error: "Bad project" }, 400);
        const id = (cleanPid(String(body.name || "project").toLowerCase().replace(/\s+/g, "-")) || "project") + "-" + rand(4);
        await st.setJSON(`p/${id}/seed`, seed, { onlyIfNew: true });
        await st.setJSON("projects/" + id, { id, name: String(body.name || "Untitled project").slice(0, 80), created: Date.now() }, { onlyIfNew: true });
        return json({ id });
      }
      const keys = await listKeys(st, "projects/");
      const list = (await Promise.all(keys.map(k => st.get(k, { type: "json" })))).filter(Boolean);
      return json({ projects: list.sort((a, b) => (a.created || 0) - (b.created || 0)) });
    }

    if (path === "/api/sync" && req.method === "POST"){
      const body = await readBody(req);
      const cid = String(body.cid || "").slice(0, 40);
      const since = String(body.since || "");
      const seen = new Set(Array.isArray(body.seen) ? body.seen.slice(0, 5000) : []);
      const got = await getSnapshot(st, pid);
      if (!got) return json({ error: "That project doesn't exist (it may have been removed)." }, 404);
      const { snap, etag } = got;
      const base = `p/${pid}/ops/`;
      const keys = await listKeys(st, base);
      const needSnap = !since || since < snap.upto;
      const threshold = M.pad13(M.stampTime(since) - WINDOW_MS);
      const want = keys.filter(k => {
        const s = k.slice(base.length);
        return !seen.has(s) && (needSnap || s > threshold);
      });
      const batches = (await Promise.all(want.map(k => st.get(k, { type: "json" })))).filter(Boolean);

      let presence = [];
      if (cid){
        const pbase = `p/${pid}/presence/`;
        await st.setJSON(pbase + cid, { cid, name: String(body.name || "").slice(0, 40), day: String(body.day || "").slice(0, 60), at: Date.now() });
        const ps = (await Promise.all((await listKeys(st, pbase)).map(k => st.get(k, { type: "json" })))).filter(Boolean);
        presence = ps.filter(p => Date.now() - p.at < PRESENCE_TTL_MS);
        const stale = ps.filter(p => Date.now() - p.at > 86_400_000);
        if (stale.length) await Promise.all(stale.map(p => st.delete(pbase + p.cid)));
      }
      if (keys.length > COMPACT_AT){ try { await compact(st, pid, snap, etag, keys); } catch (e) { /* the next sync tries again */ } }
      return json({ now: Date.now(), snapshot: needSnap ? snap : null, batches, presence });
    }

    if (path === "/api/ops" && req.method === "POST"){
      const body = await readBody(req);
      const cid = String(body.cid || "").slice(0, 40), bid = String(body.bid || "").slice(0, 40);
      if (!cid || !bid || !validOps(body.ops)) return json({ error: "Bad request" }, 400);
      const ackKey = `p/${pid}/acks/${cid}-${bid}`;
      const prior = await st.get(ackKey, { type: "json" });
      if (prior && prior.k) return json({ k: prior.k, duplicate: true });   // a retry of a save we already have
      const ops = body.ops.map(o => ({ e: o.e, id: o.id, set: o.set }));
      for (let attempt = 0; attempt < 3; attempt++){
        const k = newKey();
        const res = await st.setJSON(`p/${pid}/ops/${k}`, { k, cid, bid, by: String(body.by || "").slice(0, 40), at: Date.now(), ops }, { onlyIfNew: true });
        if (res.modified){
          await st.setJSON(ackKey, { k, at: Date.now() });
          return json({ k });
        }
      }
      return json({ error: "Couldn't save, please retry" }, 503);
    }

    if (path === "/api/activity"){
      const keys = await listKeys(st, `p/${pid}/ops/`);
      const batches = (await Promise.all(keys.slice(-80).map(k => st.get(k, { type: "json" })))).filter(Boolean);
      return json({ batches });
    }

    if (path === "/api/seed"){
      const seed = await seedFor(st, pid);
      return seed ? json(seed) : json({ error: "No original for this project" }, 404);
    }

    if (path === "/api/image"){
      if (req.method === "POST"){
        const body = await readBody(req);
        const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(String(body.data || ""));
        if (!m) return json({ error: "Not an image" }, 400);
        const id = Date.now().toString(36) + rand(8);
        const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
        await st.set("img/" + id, bytes, { metadata: { type: m[1] } });
        return json({ ref: "img:" + id });
      }
      const id = (url.searchParams.get("k") || "").replace(/[^a-z0-9]/gi, "");
      const r = id && await st.getWithMetadata("img/" + id, { type: "arrayBuffer" });
      if (!r) return new Response("Not found", { status: 404 });
      return new Response(r.data, { headers: { "content-type": (r.metadata && r.metadata.type) || "image/jpeg", "cache-control": "private, max-age=31536000, immutable" } });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, (e && e.status) || 500);
  }
};
