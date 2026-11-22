// Set Sense (formerly Shotlist Scheduler) - team sync API (Netlify Functions v2 + Netlify Blobs)
//
// Storage layout (one Blobs store, strong consistency). Each project has its own space:
//   projects/<pid>            {id, name, created, archived}
//   p/<pid>/snapshot          {upto, model}  older edits folded together; replaced only with onlyIfMatch
//   p/<pid>/seed              the project as it was created (for "Reset day")
//   p/<pid>/ops/<stamp>       one batch of edits per save; written once with onlyIfNew, never changed
//   p/<pid>/acks/<cid>-<bid>  marks a batch as received, so a retried save isn't stored twice
//   p/<pid>/presence/<cid>    who has the project open
//   img/<id>                  uploaded reference images (metadata.pid = the project that owns it)
//   keys/<pid>                {key, ver, set} the project's access key (only ever returned to the admin)
//   imgown/<id>               {pid} owner of an image uploaded before project keys existed
//
// Project keys: when the ADMIN_KEY environment variable is set, every request for a project's data
// (sync, saves, activity, original, images) needs that project's key or the admin key, and the project
// list only shows projects you hold a key for. Without ADMIN_KEY everything works as before.
//
// Saving an edit never rewrites a shared record, so people saving at the same moment
// can't overwrite each other's work. The per-field merge in model-core decides what
// everyone sees, and every device arrives at the same result.

import { getStore } from "@netlify/blobs";
import * as M from "../../shared/model-core.mjs";
import SEED from "../../shared/seed-data.mjs";
import { createHash, timingSafeEqual, randomBytes } from "node:crypto";

const sha = s => createHash("sha256").update(String(s)).digest();
const same = (a, b) => timingSafeEqual(sha(a), sha(b));          // constant-time compare of any lengths
const adminKey = () => process.env.ADMIN_KEY || "";
const locked = () => !!adminKey();
const isAdmin = req => locked() && same(req.headers.get("x-admin-key") || "", adminKey());
function newProjectKey(){                                          // 4 groups of 4 (~80 bits), easy to read out
  const a = "abcdefghjkmnpqrstuvwxyz23456789", b = randomBytes(16);
  return Array.from({ length: 16 }, (_, i) => a[b[i] % a.length]).join("").match(/.{4}/g).join("-");
}
function heldKeys(req){
  const out = {};
  try { const j = JSON.parse(req.headers.get("x-project-keys") || "{}"); for (const [k, v] of Object.entries(j).slice(0, 200)) out[String(k)] = String(v).slice(0, 100); } catch (e) {}
  return out;
}
async function keyRec(st, pid){ return await st.get("keys/" + pid, { type: "json" }); }
async function canOpen(st, req, pid, given){
  if (!locked() || isAdmin(req)) return true;
  const rec = await keyRec(st, pid);
  if (!rec || !rec.key) return false;                              // no key yet: only the admin can open it
  const k = given !== undefined ? given : (req.headers.get("x-project-key") || "");
  return !!k && same(k.trim().toLowerCase(), rec.key);
}
const noKey = () => json({ error: "This project needs its project key.", code: "project-key" }, 403);

export const config = { path: ["/api/ping", "/api/projects", "/api/sync", "/api/ops", "/api/image", "/api/seed", "/api/activity", "/api/feedback", "/api/backups"] };

const WINDOW_MS = 30_000;        // re-offer batches this recent, to cover saves still in flight
const COMPACT_AT = 250;          // fold old batches into the snapshot once there are this many
const COMPACT_AGE_MS = 120_000;  // only fold batches older than this
const PRESENCE_TTL_MS = 45_000;
const MAX_BODY = 5_500_000;      // Netlify's request limit is ~6 MB
const DEFAULT_PID = (SEED && SEED.id) || "main";   // no project data ships with the code: a new site starts empty

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
  if (!SEED) return;
  const meta = await st.get("projects/" + DEFAULT_PID, { type: "json" });
  if (!meta) await st.setJSON("projects/" + DEFAULT_PID, { id: DEFAULT_PID, name: (SEED.project && SEED.project.name) || "Project", created: Date.now() }, { onlyIfNew: true });
}
async function seedFor(st, pid){
  if (SEED && pid === DEFAULT_PID) return SEED;
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
  return ops.every(o => o && ["doc", "day", "row", "person", "col", "cut", "clip"].includes(o.e) && typeof o.id === "string" && o.id.length <= 80
    && o.set && typeof o.set === "object" && !Array.isArray(o.set));
}
// an image may only be read through the project it belongs to
async function imageBelongs(st, pid, id, meta){
  if (meta && meta.pid) return meta.pid === pid;
  const own = await st.get("imgown/" + id, { type: "json" });
  if (own) return own.pid === pid;
  // uploaded before project keys: it belongs to the project whose schedule refers to it
  const needle = "img:" + id;
  const snap = await st.get(`p/${pid}/snapshot`, { type: "text" });
  let found = !!(snap && snap.includes(needle));
  if (!found){ for (const k of await listKeys(st, `p/${pid}/ops/`)){ const t = await st.get(k, { type: "text" }); if (t && t.includes(needle)){ found = true; break; } } }
  if (found) await st.setJSON("imgown/" + id, { pid }, { onlyIfNew: true });
  return found;
}
/* Daily backups: before the first change of each day (UTC), the whole project as it stood is kept at
   p/<pid>/backups/<YYYY-MM-DD>. The last 30 are kept. Anyone who can open the project can list and download them;
   restoring happens in the app as ordinary changes, so it syncs to everyone and Undo works. */
const BACKUP_KEEP = 30;
const BK_DONE = globalThis.__BK_DONE__ ||= new Map();
async function currentModel(st, pid){
  const got = await getSnapshot(st, pid); if (!got) return null;
  const model = M.cloneModel(got.snap.model);
  const keys = await listKeys(st, `p/${pid}/ops/`);
  const batches = (await Promise.all(keys.map(k => st.get(k, { type: "json" })))).filter(Boolean);
  batches.sort((a, b) => (a.k < b.k ? -1 : 1)).forEach(b => M.foldBatch(model, b));
  return model;
}
async function maybeBackup(st, pid){
  const day = new Date().toISOString().slice(0, 10);
  if (BK_DONE.get(pid) === day) return;
  const key = `p/${pid}/backups/${day}`;
  if (await st.get(key, { type: "text" })){ BK_DONE.set(pid, day); return; }
  const model = await currentModel(st, pid); if (!model) return;
  await st.setJSON(key, { day, at: Date.now(), model }, { onlyIfNew: true });
  BK_DONE.set(pid, day);
  const all = await listKeys(st, `p/${pid}/backups/`);
  if (all.length > BACKUP_KEEP) await Promise.all(all.slice(0, all.length - BACKUP_KEEP).map(k => st.delete(k)));
}
// is this day archived right now? (for the delete lock)
async function dayArchived(st, pid, dayId){
  const model = await currentModel(st, pid); if (!model) return false;
  const e = (model.day || {})[dayId]; return !!(e && e.archived && e.archived.v);
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

/* ---------- feedback: bug reports, feature requests and questions ----------
   Kept at feedback/<time>-<id> for the whole site. With ADMIN_KEY set only the admin can read them;
   without it anyone on the team site can. FEEDBACK_WEBHOOK (optional) gets a short notice for each one:
   an ntfy.sh topic URL (phone push), a Slack or Google Chat webhook ({text}) or a Discord webhook ({content}). */
const FB_TYPES = { bug: "Bug report", feature: "Feature request", question: "Question" };
const canReadFeedback = req => !locked() || isAdmin(req);
async function notify(item){
  const hook = process.env.FEEDBACK_WEBHOOK || ""; if (!/^https:\/\//.test(hook)) return false;
  const head = `${FB_TYPES[item.type] || "Feedback"} from ${item.from || "someone"}`;
  const text = `${head}: ${item.title}${item.details ? "\n\n" + item.details.slice(0, 900) : ""}${item.ctx && item.ctx.project ? "\n\nProject: " + item.ctx.project : ""}`;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = /ntfy/i.test(hook)
      ? await fetch(hook, { method: "POST", body: text, headers: { Title: head, Tags: item.type === "bug" ? "bug" : item.type === "feature" ? "bulb" : "question", Priority: item.type === "bug" ? "high" : "default" }, signal: ctl.signal })
      : await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(/discord/i.test(hook) ? { content: text.slice(0, 1900) } : { text }), signal: ctl.signal });
    return r.ok;
  } catch (e) { return false; } finally { clearTimeout(t); }
}
async function feedback(st, req, url){
  try {
    if (req.method === "GET"){
      if (!canReadFeedback(req)) return json({ canRead: false });
      const keys = (await listKeys(st, "feedback/")).sort().reverse();
      if (url.searchParams.get("count")){
        const newest = keys.slice(0, 30); const items = (await Promise.all(newest.map(k => st.get(k, { type: "json" })))).filter(Boolean);
        return json({ canRead: true, total: keys.length, latest: items.map(i => ({ id: i.id, at: i.at, type: i.type, from: i.from, title: i.title, status: i.status })) });
      }
      const items = (await Promise.all(keys.slice(0, 200).map(k => st.get(k, { type: "json" })))).filter(Boolean);
      return json({ canRead: true, items, hook: !!process.env.FEEDBACK_WEBHOOK });
    }
    const body = await readBody(req);
    if (body.action === "status" || body.action === "delete"){
      if (!canReadFeedback(req)) return json({ error: "Only the admin can do that." }, 403);
      const id = String(body.id || "").replace(/[^a-z0-9-]/gi, "").slice(0, 40); const k = "feedback/" + id;
      const item = await st.get(k, { type: "json" }); if (!item) return json({ error: "Not found" }, 404);
      if (body.action === "delete"){ await st.delete(k); return json({ ok: true }); }
      item.status = ["new", "planned", "done"].includes(body.status) ? body.status : "new"; await st.setJSON(k, item); return json({ ok: true, item });
    }
    const type = FB_TYPES[body.type] ? body.type : "bug";
    const title = String(body.title || "").trim().slice(0, 140);
    if (!title) return json({ error: "Add a short title" }, 400);
    const at = Date.now(), id = String(at).padStart(13, "0") + "-" + rand(4);
    const c = body.ctx && typeof body.ctx === "object" ? body.ctx : {};
    const ctx = {}; for (const k of ["version", "project", "day", "browser", "screen", "mode", "view"]) if (c[k]) ctx[k] = String(c[k]).slice(0, 200);
    const item = { id, at, type, title, details: String(body.details || "").slice(0, 5000), from: String(body.from || "").slice(0, 60), contact: String(body.contact || "").slice(0, 120), ctx, status: "new" };
    await st.setJSON("feedback/" + id, item);
    const pushed = await notify(item);
    return json({ ok: true, id, pushed });
  } catch (e) { return json({ error: "Couldn't save that: " + (e && e.message || e) }, 500); }
}

export default async (req, context) => {
  const ctx = (context && context.deploy && context.deploy.context) || process.env.CONTEXT || "production";
  STORE_NAME = ctx === "production" ? "shotlist" : "shotlist-" + String(ctx).replace(/[^a-z0-9-]/gi, "-");
  const url = new URL(req.url);
  const path = url.pathname;
  // Access: Netlify's site password protects every request, including these functions.
  // TEAM_KEY is an optional second key; when it isn't set, the site password is the only gate.
  const teamKey = process.env.TEAM_KEY || "";
  if (path === "/api/ping") return json({ app: "shotlist-scheduler", ok: true, needsKey: !!teamKey, data: STORE_NAME === "shotlist" ? "live" : "preview", projectKeys: locked(), admin: isAdmin(req) });
  if (teamKey && req.headers.get("x-team-key") !== teamKey) return json({ error: "That team key isn't right." }, 401);

  const st = store();
  const pid = cleanPid(url.searchParams.get("p")) || DEFAULT_PID;
  if (path === "/api/feedback") return feedback(st, req, url);
  try {
    if (path === "/api/projects"){
      await ensureDefaultProject(st);
      if (req.method === "POST"){
        const body = await readBody(req);
        if (body.action === "redeem"){                     // find the project a key belongs to
          const given = String(body.key || "").trim().toLowerCase().slice(0, 100);
          if (!given) return json({ error: "Enter a project key" }, 400);
          for (const k of await listKeys(st, "keys/")){
            const rec = await st.get(k, { type: "json" }); const id = k.slice(5);
            if (rec && rec.key && same(given, rec.key)){ const meta = await st.get("projects/" + id, { type: "json" }); if (meta) return json({ id, name: meta.name, key: rec.key }); }
          }
          return json({ error: "That key doesn't match a project. Check it with whoever sent it." }, 404);
        }
        if (body.action === "setKey" || body.action === "getKeys"){
          if (!isAdmin(req)) return json({ error: "Only the admin can do that." }, 403);
          if (body.action === "getKeys"){
            const out = {}; for (const k of await listKeys(st, "keys/")){ const rec = await st.get(k, { type: "json" }); if (rec) out[k.slice(5)] = rec.key; }
            return json({ keys: out });
          }
          const id = cleanPid(body.id); if (!id || !(await st.get("projects/" + id, { type: "json" }))) return json({ error: "No such project" }, 404);
          const prev = await keyRec(st, id);
          const key = newProjectKey();
          await st.setJSON("keys/" + id, { key, ver: ((prev && prev.ver) || 0) + 1, set: Date.now() });
          return json({ id, key });
        }
        if (body.action === "rename"){                      // keep the project list's name in step with the project
          const id = cleanPid(body.id), meta = await st.get("projects/" + id, { type: "json" });
          if (!meta) return json({ error: "No such project" }, 404);
          if (!(await canOpen(st, req, id, heldKeys(req)[id] || req.headers.get("x-project-key") || ""))) return noKey();
          const name = String(body.name || "").trim().slice(0, 80) || "Untitled project";
          if (meta.name !== name){ meta.name = name; await st.setJSON("projects/" + id, meta); }
          return json({ ok: true, name });
        }
        if (body.action === "archive" || body.action === "restore"){
          const id = cleanPid(body.id), meta = await st.get("projects/" + id, { type: "json" });
          if (!meta) return json({ error: "No such project" }, 404);
          if (!(await canOpen(st, req, id, heldKeys(req)[id] || ""))) return noKey();
          meta.archived = body.action === "archive";
          await st.setJSON("projects/" + id, meta);
          return json({ ok: true });
        }
        const seed = body.seed;
        if (!seed || !Array.isArray(seed.days)) return json({ error: "Bad project" }, 400);
        const id = (cleanPid(String(body.name || "project").toLowerCase().replace(/\s+/g, "-")) || "project") + "-" + rand(4);
        await st.setJSON(`p/${id}/seed`, seed, { onlyIfNew: true });
        await st.setJSON("projects/" + id, { id, name: String(body.name || "Untitled project").slice(0, 80), created: Date.now() }, { onlyIfNew: true });
        if (locked()){ const key = newProjectKey(); await st.setJSON("keys/" + id, { key, ver: 1, set: Date.now() }); return json({ id, key }); }
        return json({ id });
      }
      const keys = await listKeys(st, "projects/");
      let list = (await Promise.all(keys.map(k => st.get(k, { type: "json" })))).filter(Boolean);
      if (locked()){
        const admin = isAdmin(req), held = heldKeys(req), out = [];
        for (const p of list){
          const rec = await keyRec(st, p.id);
          if (admin) out.push(Object.assign({}, p, { hasKey: !!(rec && rec.key) }));
          else if (rec && rec.key && held[p.id] && same(held[p.id].trim().toLowerCase(), rec.key)) out.push(p);
        }
        // any key this device holds that doesn't open a project is reported the same way, whether or not
        // that project exists, so this can't be used to find out which projects are on the site
        if (!admin){ const ok = new Set(out.map(p => p.id)); for (const id of Object.keys(held)) if (!ok.has(id)) out.push({ id, revoked: true }); }
        list = out;
      }
      return json({ projects: list.sort((a, b) => (a.created || 0) - (b.created || 0)) });
    }

    // everything below reads or writes one project's data: it needs that project's key
    if (!(await canOpen(st, req, pid))) return noKey();

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

      let presence = [], recent = [];
      if (cid){
        const pbase = `p/${pid}/presence/`;
        const prev = await st.get(pbase + cid, { type: "json" });
        const since = prev && Date.now() - prev.at < PRESENCE_TTL_MS ? (prev.since || prev.at) : Date.now();
        await st.setJSON(pbase + cid, { cid, name: String(body.name || "").slice(0, 40), day: String(body.day || "").slice(0, 60), dayId: String(body.dayId || "").slice(0, 40),
          row: String(body.row || "").slice(0, 40), dev: String(body.dev || "").slice(0, 20), view: String(body.view || "").slice(0, 20), idle: !!body.idle, at: Date.now(), since });
        const ps = (await Promise.all((await listKeys(st, pbase)).map(k => st.get(k, { type: "json" })))).filter(Boolean);
        presence = ps.filter(p => Date.now() - p.at < PRESENCE_TTL_MS);
        // people seen in the last 12 hours who aren't on now, newest first, once per name
        const onNames = new Set(presence.map(p => p.name)), seenNames = new Set();
        recent = ps.filter(p => Date.now() - p.at >= PRESENCE_TTL_MS && Date.now() - p.at < 12 * 3600_000).sort((a, b) => b.at - a.at)
          .filter(p => { const n = p.name || p.cid; if (onNames.has(p.name) || seenNames.has(n)) return false; seenNames.add(n); return true; })
          .slice(0, 20).map(p => ({ name: p.name, day: p.day, at: p.at, dev: p.dev }));
        const stale = ps.filter(p => Date.now() - p.at > 86_400_000);
        if (stale.length) await Promise.all(stale.map(p => st.delete(pbase + p.cid)));
      }
      if (keys.length > COMPACT_AT){ try { await compact(st, pid, snap, etag, keys); } catch (e) { /* the next sync tries again */ } }
      return json({ now: Date.now(), snapshot: needSnap ? snap : null, batches, presence, recent });
    }

    if (path === "/api/ops" && req.method === "POST"){
      const body = await readBody(req);
      const cid = String(body.cid || "").slice(0, 40), bid = String(body.bid || "").slice(0, 40);
      if (!cid || !bid || !validOps(body.ops)) return json({ error: "Bad request" }, 400);
      const ackKey = `p/${pid}/acks/${cid}-${bid}`;
      const prior = await st.get(ackKey, { type: "json" });
      if (prior && prior.k) return json({ k: prior.k, duplicate: true });   // a retry of a save we already have
      const ops = body.ops.map(o => ({ e: o.e, id: o.id, set: o.set }));
      // deleting an archived day is for the admin only (deleting a day that isn't archived, e.g. undoing Copy day, is fine)
      if (locked() && !isAdmin(req)){
        for (const o of ops) if (o.e === "day" && o.set && o.set._del === true && await dayArchived(st, pid, o.id))
          return json({ error: "Only the admin can delete archived days.", code: "admin-only" }, 403);
      }
      try { await maybeBackup(st, pid); } catch (e) { /* a backup problem never blocks a save */ }
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

    if (path === "/api/backups"){
      const day = String(url.searchParams.get("day") || "").replace(/[^0-9-]/g, "").slice(0, 10);
      if (day){ const b = await st.get(`p/${pid}/backups/${day}`, { type: "json" }); return b ? json(b) : json({ error: "No backup for that day." }, 404); }
      const keys = await listKeys(st, `p/${pid}/backups/`);
      return json({ backups: keys.map(k => k.split("/").pop()).reverse() });
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
        await st.set("img/" + id, bytes, { metadata: { type: m[1], pid } });
        return json({ ref: "img:" + id });
      }
      const id = (url.searchParams.get("k") || "").replace(/[^a-z0-9]/gi, "");
      const r = id && await st.getWithMetadata("img/" + id, { type: "arrayBuffer" });
      if (!r) return new Response("Not found", { status: 404 });
      if (locked() && !isAdmin(req) && !(await imageBelongs(st, pid, id, r.metadata))) return new Response("Not found", { status: 404 });
      return new Response(r.data, { headers: { "content-type": (r.metadata && r.metadata.type) || "image/jpeg", "cache-control": "private, max-age=31536000, immutable" } });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, (e && e.status) || 500);
  }
};
