// Generated from src/model_core.js by build/assemble.py - edit the source, not this file.
/* ===== Shotlist sync model (shared by browser and server) =====
   The shared document is a set of entities, each a map of fields.
   Every field carries the stamp of the edit that last set it:
     model = { doc:{doc:{title:{v,s}, cfg_stepMin:{v,s}, ...}},
               day:{<id>:{name:{v,s}, pos:{v,s}, _del:{v,s}, ...}},
               row:{<id>:{day:{v,s}, pos:{v,s}, shot:{v,s}, ...}} }
   An edit (op) is {e:"doc"|"day"|"row"|"person", id, set:{field:value,...}}.
   A batch of ops is saved once under a new, never-overwritten key; its
   stamp orders it. Applying a field keeps whichever stamp is later, so
   batches can arrive in any order, twice, or late, and every copy of the
   document still ends up the same ("last writer wins" per field).
   Rows and days are never physically removed: _del:true hides them, which
   is what lets Undo bring them back and stops a late edit resurrecting a
   half-deleted row. Order uses a fractional "pos" per row/day, so a move
   only touches the moved row and concurrent moves/inserts merge. */

const DAY_FIELDS = ["name","kind","dayNo","date","call","wrap","setupPct","shootPct","minSetup","origWrap"];
const ROW_FIELDS = ["type","shot","label","duration","setup","shoot","origStart","origSetup","origShoot",
  "location","description","script","shotType","camera","vfx","director","props","ref1","ref2","done",
  "priority","perfCount","performers","genre","action","body","face","glove","hero","safety","takes","takeLog"];
const PERSON_FIELDS = ["group","name","role","phone","email","notes"];
const COL_FIELDS = ["label","type","options"];   // project-level custom columns; their values live on rows as c_<id>
const isCustomKey = k => typeof k === "string" && k.indexOf("c_") === 0;
const PROJECT_FIELDS = ["name","client","prodId","fps","dates","location","system","lead","notes"];
const ID_PARTS_DEFAULT = [
  { key:"shot", on:true,  prefix:"" }, { key:"take", on:true, prefix:"T" }, { key:"prod", on:true, prefix:"" },
  { key:"day", on:true, prefix:"d" }, { key:"perfCount", on:true, prefix:"a" }, { key:"props", on:true, prefix:"p" },
  { key:"performers", on:true, prefix:"" }, { key:"genre", on:true, prefix:"" }, { key:"action", on:true, prefix:"" },
  { key:"body", on:true, prefix:"yB" }, { key:"face", on:true, prefix:"yF" }, { key:"glove", on:true, prefix:"yG" },
  { key:"hero", on:true, prefix:"" }, { key:"shotType", on:false, prefix:"" }, { key:"location", on:false, prefix:"" } ];
const CFG_DEFAULTS = { stepMin:5, newSetup:15, newShoot:15, breakLabel:"Lunch", breakMin:45,
  newCall:"09:00", newWrap:"18:00", newSetupPct:100, newShootPct:100, newMinSetup:0,
  colLabels:{}, priorityOptions:"HIGH,MID,LOW",
  idParts: ID_PARTS_DEFAULT, idSep:"_", idSpaces:"_", shotPad:3, takePad:1, shotSource:"field" };
const SEED_STAMP = "0000000000000-seed";

function pad13(n){ return String(Math.max(0, Math.floor(n))).padStart(13, "0"); }
function opStamp(batchKey, i){ return batchKey + "." + String(i).padStart(4, "0"); }
function stampTime(s){ return Number(String(s || "").slice(0, 13)) || 0; }
function emptyModel(){ return { doc:{ doc:{} }, day:{}, row:{}, person:{}, col:{} }; }

function applyOp(model, op, stamp, force){
  const bucket = model[op.e] || (model[op.e] = {});
  const ent = bucket[op.id] || (bucket[op.id] = {});
  for (const k of Object.keys(op.set || {})){
    const cur = ent[k];
    if (force || !cur || stamp > cur.s) ent[k] = { v: op.set[k], s: stamp };
  }
}
function foldBatch(model, batch){
  (batch.ops || []).forEach((op, i) => applyOp(model, op, opStamp(batch.k, i), false));
  return model;
}
function mergeModels(into, other){
  for (const e of ["doc","day","row","person","col"]){
    const src = other[e] || {};
    for (const id of Object.keys(src)){
      const ent = (into[e] || (into[e] = {}))[id] || (into[e][id] = {});
      for (const k of Object.keys(src[id])){
        const f = src[id][k];
        if (!ent[k] || f.s > ent[k].s) ent[k] = { v: f.v, s: f.s };
      }
    }
  }
  return into;
}
function cloneModel(m){ return JSON.parse(JSON.stringify(m)); }

/* seed: {project:{...}, people:[...], cfg:{...}, days:[{id,...,rows:[...]}]} -> model */
function seedModel(seed){
  const m = emptyModel();
  const set = (e, id, obj) => applyOp(m, { e, id, set: obj }, SEED_STAMP + ".0000", true);
  const cfg = Object.assign({}, CFG_DEFAULTS, seed.cfg || {});
  const docSet = Object.fromEntries(Object.entries(cfg).map(([k, v]) => ["cfg_" + k, v]));
  PROJECT_FIELDS.forEach(k => { docSet["p_" + k] = (seed.project || {})[k] != null ? seed.project[k] : ""; });
  set("doc", "doc", docSet);
  (seed.people || []).forEach((p, i) => {
    const f = { pos: i + 1, _del: false };
    PERSON_FIELDS.forEach(k => { if (p[k] !== undefined) f[k] = p[k]; });
    set("person", p.id, f);
  });
  (seed.cols || []).forEach((c, i) => {
    const f = { pos: i + 1, _del: false };
    COL_FIELDS.forEach(k => { if (c[k] !== undefined) f[k] = c[k]; });
    set("col", c.id, f);
  });
  const days = seed.days || [];
  days.forEach((d, di) => {
    const f = { pos: di + 1, _del: false };
    DAY_FIELDS.forEach(k => { if (d[k] !== undefined) f[k] = d[k]; });
    set("day", d.id, f);
    (d.rows || []).forEach((r, ri) => {
      const rf = { day: d.id, pos: ri + 1, _del: false };
      ROW_FIELDS.forEach(k => { if (r[k] !== undefined) rf[k] = r[k]; });
      Object.keys(r).forEach(k => { if (isCustomKey(k)) rf[k] = r[k]; });
      set("row", r.id, rf);
    });
  });
  return m;
}

/* model -> plain document the UI works on */
function materialize(model){
  const val = (ent, k, dflt) => (ent && ent[k] !== undefined ? ent[k].v : dflt);
  const docE = (model.doc || {}).doc || {};
  const cfg = {}, project = {};
  for (const k of Object.keys(CFG_DEFAULTS)) cfg[k] = val(docE, "cfg_" + k, CFG_DEFAULTS[k]);
  PROJECT_FIELDS.forEach(k => { project[k] = val(docE, "p_" + k, ""); });
  const people = [];
  for (const id of Object.keys(model.person || {})){
    const e = model.person[id];
    if (val(e, "_del", false)) continue;
    const p = { id, pos: val(e, "pos", 0) };
    PERSON_FIELDS.forEach(k => { p[k] = val(e, k, ""); });
    people.push(p);
  }
  const days = [];
  for (const id of Object.keys(model.day || {})){
    const e = model.day[id];
    if (val(e, "_del", false)) continue;
    const d = { id, pos: val(e, "pos", 0), rows: [] };
    DAY_FIELDS.forEach(k => { d[k] = val(e, k, null); });
    days.push(d);
  }
  const byId = Object.fromEntries(days.map(d => [d.id, d]));
  for (const id of Object.keys(model.row || {})){
    const e = model.row[id];
    if (val(e, "_del", false)) continue;
    const d = byId[val(e, "day", null)];
    if (!d) continue;
    const r = { id, pos: val(e, "pos", 0) };
    ROW_FIELDS.forEach(k => { r[k] = val(e, k, null); });
    Object.keys(e).forEach(k => { if (isCustomKey(k)) r[k] = e[k].v; });
    d.rows.push(r);
  }
  const byPos = (a, b) => (a.pos - b.pos) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const cols = [];
  for (const id of Object.keys(model.col || {})){
    const e = model.col[id];
    if (val(e, "_del", false)) continue;
    const c = { id, pos: val(e, "pos", 0) };
    COL_FIELDS.forEach(k => { c[k] = val(e, k, ""); });
    cols.push(c);
  }
  days.sort(byPos); days.forEach(d => d.rows.sort(byPos)); people.sort(byPos); cols.sort(byPos);
  return { project, cfg, people, cols, days };
}

/* give positions to anything new or moved, touching as few items as possible:
   keep the longest run whose existing positions are already in order, slot the rest between */
function assignPositions(items){
  const n = items.length, out = {};
  const p = items.map(x => (typeof x.pos === "number" && isFinite(x.pos) ? x.pos : null));
  // longest strictly increasing subsequence over defined positions
  const tails = [], tailIdx = [], prev = new Array(n).fill(-1);
  for (let i = 0; i < n; i++){
    if (p[i] === null) continue;
    let lo = 0, hi = tails.length;
    while (lo < hi){ const mid = (lo + hi) >> 1; if (tails[mid] < p[i]) lo = mid + 1; else hi = mid; }
    tails[lo] = p[i]; tailIdx[lo] = i; prev[i] = lo > 0 ? tailIdx[lo - 1] : -1;
  }
  const keep = new Set();
  for (let i = tails.length ? tailIdx[tails.length - 1] : -1; i >= 0; i = prev[i]) keep.add(i);
  let i = 0;
  while (i < n){
    if (keep.has(i)){ i++; continue; }
    let j = i; while (j < n && !keep.has(j)) j++;
    const L = i > 0 ? p[i - 1] : null, R = j < n ? p[j] : null, cnt = j - i;
    for (let k = 1; k <= cnt; k++){
      let v;
      if (L !== null && R !== null) v = L + (R - L) * k / (cnt + 1);
      else if (L !== null) v = L + k;
      else if (R !== null) v = R - (cnt + 1 - k);
      else v = k;
      p[i + k - 1] = v;
    }
    i = j;
  }
  // gaps too small to split again: renumber everything
  let tight = false;
  for (let k = 1; k < n; k++) if (!(p[k] > p[k - 1]) || p[k] - p[k - 1] < 1e-7) tight = true;
  if (tight) for (let k = 0; k < n; k++) p[k] = k + 1;
  items.forEach((x, k) => { if (p[k] !== x.pos) out[x.id] = p[k]; });
  return out;
}

const same = (a, b) => (a === b) || (a == null && b == null) || JSON.stringify(a) === JSON.stringify(b);

/* old plain doc -> new plain doc: the edits needed, each with the values it replaced (for Undo) */
function diffDocs(a, b){
  const ops = {};
  const put = (e, id, k, v, pv) => {
    const key = e + ":" + id;
    const o = ops[key] || (ops[key] = { e, id, set: {}, prev: {} });
    o.set[k] = v === undefined ? null : v; o.prev[k] = pv === undefined ? null : pv;
  };
  PROJECT_FIELDS.forEach(k => { if (!same((a.project || {})[k], (b.project || {})[k])) put("doc", "doc", "p_" + k, b.project[k], (a.project || {})[k]); });
  const aP = Object.fromEntries((a.people || []).map(p => [p.id, p]));
  const bP = Object.fromEntries((b.people || []).map(p => [p.id, p]));
  const pPos = assignPositions(b.people || []);
  for (const p of b.people || []){
    const o = aP[p.id];
    if (!o){
      put("person", p.id, "_del", false, true); put("person", p.id, "pos", pPos[p.id] !== undefined ? pPos[p.id] : p.pos, null);
      PERSON_FIELDS.forEach(k => put("person", p.id, k, p[k] === undefined ? "" : p[k], null));
    } else {
      PERSON_FIELDS.forEach(k => { if (!same(o[k], p[k])) put("person", p.id, k, p[k], o[k]); });
      if (pPos[p.id] !== undefined) put("person", p.id, "pos", pPos[p.id], o.pos);
    }
  }
  for (const p of a.people || []) if (!bP[p.id]) put("person", p.id, "_del", true, false);
  const aC = Object.fromEntries((a.cols || []).map(c => [c.id, c]));
  const bC = Object.fromEntries((b.cols || []).map(c => [c.id, c]));
  const cPos = assignPositions(b.cols || []);
  for (const c of b.cols || []){
    const o = aC[c.id];
    if (!o){
      put("col", c.id, "_del", false, true); put("col", c.id, "pos", cPos[c.id] !== undefined ? cPos[c.id] : c.pos, null);
      COL_FIELDS.forEach(k => put("col", c.id, k, c[k] === undefined ? "" : c[k], null));
    } else {
      COL_FIELDS.forEach(k => { if (!same(o[k], c[k])) put("col", c.id, k, c[k], o[k]); });
      if (cPos[c.id] !== undefined) put("col", c.id, "pos", cPos[c.id], o.pos);
    }
  }
  for (const c of a.cols || []) if (!bC[c.id]) put("col", c.id, "_del", true, false);
  for (const k of Object.keys(CFG_DEFAULTS))
    if (!same((a.cfg || {})[k], (b.cfg || {})[k])) put("doc", "doc", "cfg_" + k, b.cfg[k], (a.cfg || {})[k]);

  const aDays = Object.fromEntries((a.days || []).map(d => [d.id, d]));
  const bDays = Object.fromEntries((b.days || []).map(d => [d.id, d]));
  const dayPos = assignPositions(b.days || []);
  for (const d of b.days || []){
    const o = aDays[d.id];
    const pos = dayPos[d.id] !== undefined ? dayPos[d.id] : d.pos;
    if (!o){
      put("day", d.id, "_del", false, true);
      put("day", d.id, "pos", pos, null);
      DAY_FIELDS.forEach(k => put("day", d.id, k, d[k] === undefined ? null : d[k], null));
    } else {
      DAY_FIELDS.forEach(k => { if (!same(o[k], d[k])) put("day", d.id, k, d[k], o[k]); });
      if (dayPos[d.id] !== undefined) put("day", d.id, "pos", pos, o.pos);
    }
  }
  for (const d of a.days || []) if (!bDays[d.id]) put("day", d.id, "_del", true, false);

  const aRows = {}, bRows = {};
  (a.days || []).forEach(d => d.rows.forEach(r => { aRows[r.id] = { r, day: d.id }; }));
  (b.days || []).forEach(d => {
    const rp = assignPositions(d.rows);
    d.rows.forEach(r => { bRows[r.id] = { r, day: d.id, pos: rp[r.id] !== undefined ? rp[r.id] : r.pos, moved: rp[r.id] !== undefined }; });
  });
  for (const id of Object.keys(bRows)){
    const { r, day, pos, moved } = bRows[id], o = aRows[id];
    if (!o){
      put("row", id, "_del", false, true);
      put("row", id, "day", day, null);
      put("row", id, "pos", pos, null);
      ROW_FIELDS.forEach(k => put("row", id, k, r[k] === undefined ? null : r[k], null));
      Object.keys(r).forEach(k => { if (isCustomKey(k) && r[k] != null && r[k] !== "") put("row", id, k, r[k], null); });
    } else {
      if (o.day !== day) put("row", id, "day", day, o.day);
      if (moved) put("row", id, "pos", pos, o.r.pos);
      ROW_FIELDS.forEach(k => { if (!same(o.r[k], r[k])) put("row", id, k, r[k] === undefined ? null : r[k], o.r[k]); });
      const ck = new Set([...Object.keys(o.r), ...Object.keys(r)].filter(isCustomKey));
      ck.forEach(k => { if (!same(o.r[k], r[k])) put("row", id, k, r[k] === undefined ? null : r[k], o.r[k]); });
    }
  }
  for (const id of Object.keys(aRows)) if (!bRows[id]) put("row", id, "_del", true, false);
  return Object.values(ops);
}

export { DAY_FIELDS, ROW_FIELDS, PERSON_FIELDS, COL_FIELDS, isCustomKey, PROJECT_FIELDS, CFG_DEFAULTS, SEED_STAMP, pad13, opStamp, stampTime, emptyModel, applyOp, foldBatch, mergeModels, cloneModel, seedModel, materialize, assignPositions, diffDocs };
