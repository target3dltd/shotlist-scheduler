"use strict";
const VERSION = "2.6.1";
const CHANGELOG = [
  ["2.6.1","2026-11-17","Print / PDF squeezes the columns to fit an A4 landscape page (notes columns give way first; your on-screen widths are untouched). The − / + buttons on Setup and Shoot can be switched off in Settings > Display if you prefer to type."],
  ["2.6.0","2026-11-17","Days are archived instead of deleted: Archive day puts the tab away for everyone and the Archived tab restores it. The day settings and filters sit on a coloured banner that joins the open tab. Timeline and banner colours in Settings > Display (or the Timeline colours link under the timeline). Timeline hour labels no longer get cropped. Short text columns (Action, Performer(s), custom text columns such as Runner notes) now wrap. Optional highlight of the rows teammates are working in, in their badge colour, off by default. Wrapped day tabs sit in the right third of the tab bar, and tabs shrink to fit as more days are added (hover for the full name). Tablet and phone friendly: the shot number stays in view while swiping along a row, the day banner folds down to the filters (tap Day settings for the rest), extra toolbar buttons move under More, tabs and summary cards scroll sideways, bigger touch targets, and column widths can be dragged with a finger."],
  ["2.5.1","2026-11-17","New app icon: a clapperboard with schedule bars, for browser tabs, bookmarks and phone home screens (Add to Home Screen opens it like an app)."],
  ["2.5.0","2026-11-17","Drag a column heading to move the column (just for you, on every day); a click still sorts. Reset column order in the Columns menu. Display reset also restores the column order."],
  ["2.4.0","2026-11-17","Day tabs are grouped: Ready to roll first (soonest date first), then Wrapped to the right (most recent first). Each day has a Status: Auto (wrapped once its date has passed or every shot is ticked), Ready to roll or Wrapped. The page opens on the next day ready to roll."],
  ["2.3.0","2026-11-17","Priority filter next to Show (one priority, a priority and higher, or not set; just for you). Priority colours can be set for every option in Settings > Columns, shared with the team, with readable text picked automatically; the .xlsx export uses the same colours."],
  ["2.2.0","2026-11-17","Your own columns: Settings > Columns adds text, long text, number, tick box or dropdown columns to every day for the whole team, reorders and deletes them (Undo restores the data), and can include any of them in shot names. Built-in columns can be renamed for the team. Priority is on every day, colour-coded in its dropdown and down the row's left edge, sorts highest first, and its options are editable. Day kinds are now called Mocap and Live Action. Import can create new columns from unmatched headings; exports carry your columns and renamed headings."],
  ["2.1.0","2026-11-17","Spreadsheet import and export. Import sheet brings in .xlsx or .csv (Google Sheets, Excel, Numbers, the Shotlist Builder or the Shotlist tracker): pick the sheet and header row, map each column, group retakes into take counts, and send them to a new day, one day per Shoot Day, the open day or a new project. Export .xlsx writes the Shotlist Builder tracker: Project tab with cast and crew, Shotlist with one row per take and live Take # and Shot ID formulas driven by an ID Settings tab, optional timecode and frame columns, a Schedule tab and Instructions. Drop a file anywhere to import it. Easier on the eyes: Settings > Display now has colour themes (warm paper, dim, high contrast light and dark, plus light and dark), a highlight colour, readable fonts (Atkinson Hyperlegible, Lexend, serif, rounded, mono), text weight, line and letter spacing, roomy rows, striped rows, reduce motion, and one-click presets. The ◐ button flips between your chosen light and dark themes. Safer updates: open copies show a 'new version' bar and save before refreshing, and test deploys use separate data so they can't touch the live schedule."],
  ["2.0.0","2026-11-17","Team edition and project settings. Runs on Netlify so the whole team edits one live schedule: every change saves as its own small edit and merges field by field, so people working at the same time don't overwrite each other; offline changes queue and send when you reconnect. Activity log and who's-online. Projects you can save, switch, copy and import, with project details, cast and crew in Settings. Capture (mocap / volcap) days with the Shotlist Builder columns and Shot ID builder, plus a DIT names panel that copies shot names with take numbers. Dark mode, text size, row spacing, 12/24h clock and team defaults in Settings. Paste a list of actions. Hyphens instead of dashes throughout. Day 4 - Mocap added."],
  ["1.2.1","2026-11-17","Move handle sits to the left of the Shot tick box."],
  ["1.2.0","2026-11-17","Multi-day tabs for Day 1 and Day 2 VolCap alongside the LV day. Add, copy, rename and delete days. CSV exports every day."],
  ["1.1.0","2026-11-17","Resizable columns, click-to-sort headers, per-column filters, Make this the running order."],
  ["1.0.0","2026-11-17","First version from the LV Timings PDF: live recalculation, buffers, minimum setup, breaks, reorder, done ticks, timeline, undo, CSV/JSON export, print."]
];
const SEED = /*__SEED__*/null;

/* ===================== shared model ===================== */
/*__MODEL_CORE__*/

/* ===================== helpers ===================== */
function $(q,el=document){return el.querySelector(q)}
function $$(q,el=document){return [...el.querySelectorAll(q)]}
function h(tag,attrs={},...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(k==="class")e.className=v;else if(k==="style")e.setAttribute("style",v);else if(k.startsWith("on")&&typeof v==="function")e.addEventListener(k.slice(2),v);else if(v===true)e.setAttribute(k,"");else if(v!==undefined&&v!==null&&v!==false)e.setAttribute(k,v)}for(const k of kids.flat()){if(k==null||k===false)continue;e.append(k.nodeType?k:document.createTextNode(k))}return e}
function toMin(t){if(!t)return 0;const[a,b]=String(t).split(":").map(Number);return (a||0)*60+(b||0)}
function hhmm(m){m=Math.round(m);m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")}
function fmt(m){m=Math.round(m);const d=Math.floor(m/1440);let s;if(P.clock==="12"){const mm=((m%1440)+1440)%1440;const H=Math.floor(mm/60),M_=mm%60;s=((H%12)||12)+":"+String(M_).padStart(2,"0")+(H<12?"am":"pm")}else s=hhmm(m);return s+(d>0?" +"+d+"d":"")}
function dur(m){m=Math.round(m);const s=m<0?"-":"";m=Math.abs(m);const hh=Math.floor(m/60),mm=m%60;return s+(hh?hh+"h"+(mm?" "+String(mm).padStart(2,"0")+"m":""):mm+"m")}
function uid(p="r"){return p+Date.now().toString(36).slice(-4)+Math.random().toString(36).slice(2,7)}
function clone(o){return JSON.parse(JSON.stringify(o))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),2600)}
function autosize(el){el.style.height="auto";el.style.height=(el.scrollHeight+2)+"px"}
function download(name,data,type){const b=new Blob([data],{type});const a=h("a",{href:URL.createObjectURL(b),download:name});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800)}
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
let lsWarned=false;
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){if(!lsWarned){lsWarned=true;toast("This browser won't store more. Use Settings > Projects > Export project file to keep a copy.")}return false}}
function lsDel(k){try{localStorage.removeItem(k)}catch(e){}}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);return true}catch(e){
    const ta=h("textarea",{style:"position:fixed;left:-9999px"});ta.value=text;document.body.append(ta);ta.select();let ok=false;try{ok=document.execCommand("copy")}catch(_){}ta.remove();return ok}
}
function ask(title,text,yes="OK"){return new Promise(res=>{$("#askTitle").textContent=title;$("#askText").textContent=text;$("#askYes").textContent=yes;const m=$("#askModal");m.classList.add("open");const done=v=>{m.classList.remove("open");$("#askYes").onclick=$("#askNo").onclick=null;res(v)};$("#askYes").onclick=()=>done(true);$("#askNo").onclick=()=>done(false)})}
const COLORS=["#c2412d","#2f6f8f","#7a5ea8","#2e7d4f","#b4541a","#8a6d1d","#a33b6b","#3c6e71"];
function colorFor(s){let n=0;for(const c of String(s))n=(n*31+c.charCodeAt(0))>>>0;return COLORS[n%COLORS.length]}
function initials(s){return String(s||"?").trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase()||"?"}

/* ===================== personal prefs (this device only) ===================== */
const PREF_KEY="shotlist2-prefs";
const HIDDEN_DEFAULT={
  schedule:["perfCount","performers","genre","action","body","face","glove","hero","safety","takes"],
  capture:["duration","orig","script","camera","location"]
};
const DISPLAY_DEFAULTS={theme:"auto",accent:"",font:"system",fw:400,ui:13,tbl:13,lh:1.35,ls:0,density:"comfortable",zebra:false,calm:false,clock:"24",band:"",bandMix:10};
const BANDS=[["","Theme default (soft slate)"],["none","None (plain)"],["#2f6fb0","Blue"],["#1f7a7a","Teal"],["#2e7d4f","Green"],["#c8a052","Sand"],["#d0700f","Orange"],["#b3264e","Rose"],["#7a5ea8","Purple"],["custom","Pick my own..."]];
function toHex(c){c=String(c||"").trim();if(/^#[0-9a-f]{6}$/i.test(c))return c;if(/^#[0-9a-f]{3}$/i.test(c))return "#"+c.slice(1).split("").map(x=>x+x).join("");const m=c.match(/\d+(\.\d+)?/g);if(m&&m.length>=3)return "#"+m.slice(0,3).map(x=>Math.round(+x).toString(16).padStart(2,"0")).join("");return "#888888"}
const P=Object.assign({name:"",poll:3,peerRows:false,tl:{},steppers:true},DISPLAY_DEFAULTS,{
  hiddenBy:clone(HIDDEN_DEFAULT),view:"all",widths:{},sort:null,filters:{},activeByProject:{},projectId:null,
  cid:uid("c"),mode:null,teamKey:"",ditShowDone:false},lsGet(PREF_KEY,{}));
if(!P.v22){ for(const k of Object.keys(P.hiddenBy||{})) P.hiddenBy[k]=(P.hiddenBy[k]||[]).filter(x=>x!=="priority"); P.v22=true; }
function savePrefs(){lsSet(PREF_KEY,P)}

/* ===================== columns ===================== */
const BASE_COLS=[
  {key:"handle",label:"",fixed:true},
  {key:"shot",label:"Shot #",fixed:true},
  {key:"priority",label:"Priority",type:"list"},
  {key:"shotId",label:"Shot name (next take)"},
  {key:"duration",label:"Screen dur."},
  {key:"setup",label:"Setup (min)",fixed:true},
  {key:"start",label:"Start",fixed:true},
  {key:"shoot",label:"Shoot (min)",fixed:true},
  {key:"end",label:"End",fixed:true},
  {key:"orig",label:"Orig. start"},
  {key:"takes",label:"Takes",type:"takes"},
  {key:"action",label:"Action",type:"text"},
  {key:"performers",label:"Performer(s)",type:"text"},
  {key:"perfCount",label:"# Perf.",type:"number"},
  {key:"genre",label:"Genre",type:"text"},
  {key:"body",label:"Body",type:"flag"},
  {key:"face",label:"Face",type:"flag"},
  {key:"glove",label:"Glove",type:"flag"},
  {key:"hero",label:"Hero",type:"text"},
  {key:"safety",label:"Safety",type:"text"},
  {key:"location",label:"Location / Setup",type:"note"},
  {key:"description",label:"Description",type:"note"},
  {key:"script",label:"Script / Dialogue",type:"note"},
  {key:"shotType",label:"Shot type",type:"note"},
  {key:"camera",label:"Camera & lighting",type:"note"},
  {key:"vfx",label:"VFX notes",type:"note"},
  {key:"director",label:"Director notes",type:"note"},
  {key:"props",label:"Prop / set notes",type:"note"},
  {key:"refs",label:"Storyboard / refs"},
  {key:"actions",label:"",fixed:true},
];
const CUSTOM_TYPES=[["text","Text"],["note","Long text"],["number","Number"],["flag","Tick box"],["list","Dropdown"]];
function priorityOptions(){ return String(cfg().priorityOptions||"HIGH,MID,LOW").split(",").map(s=>s.trim()).filter(Boolean); }
function optList(s){ return String(s||"").split(",").map(x=>x.trim()).filter(Boolean); }
let _cols=null;
/* the project's columns: built-ins (with any team renames) plus its own columns, which appear on every day */
function cols(){
  if(_cols) return _cols;
  const labels=(S&&S.cfg&&S.cfg.colLabels)||{};
  const out=[];
  for(const c of BASE_COLS){
    if(c.key==="location") for(const k of (S&&S.cols)||[]) out.push({key:"c_"+k.id,label:k.label||"New column",type:k.type||"text",options:k.type==="list"?["",...optList(k.options)]:null,custom:true,colId:k.id});
    const x=Object.assign({},c,{base:c.label}); if(labels[c.key]) x.label=labels[c.key];
    if(c.key==="priority") x.options=["",...priorityOptions()];
    out.push(x);
  }
  return (_cols=applyColOrder(out));
}
/* your own column order (dragged headers). The ⠿ column stays first and the row buttons last;
   columns added later slot in after their usual neighbour */
function applyColOrder(list){
  const order=(P.colOrder||[]).filter(k=>list.some(c=>c.key===k));
  if(!order.length) return list;
  const first=list.filter(c=>c.key==="handle"), last=list.filter(c=>c.key==="actions");
  const mid=list.filter(c=>c.key!=="handle"&&c.key!=="actions");
  const byKey=Object.fromEntries(mid.map(c=>[c.key,c]));
  const res=order.filter(k=>byKey[k]).map(k=>byKey[k]);
  mid.forEach((c,i)=>{ if(order.includes(c.key)) return;
    let j=-1; for(let p=i-1;p>=0;p--){ j=res.indexOf(mid[p]); if(j>=0) break; }
    res.splice(j+1,0,c); });
  return [...first,...res,...last];
}
function moveColumn(key,beforeKey){
  const cur=cols().filter(c=>c.key!=="handle"&&c.key!=="actions").map(c=>c.key);
  const from=cur.indexOf(key); if(from<0||key===beforeKey) return;
  cur.splice(from,1);
  const to=beforeKey==null?cur.length:cur.indexOf(beforeKey);
  cur.splice(to<0?cur.length:to,0,key);
  P.colOrder=cur; savePrefs(); invalidateCols(); renderHead(); renderBody();
}
function colMap(){ return Object.fromEntries(cols().map(c=>[c.key,c])); }
function invalidateCols(){ _cols=null; }
const DEFAULT_WIDTHS={handle:92,shot:92,shotId:230,duration:70,setup:120,start:82,shoot:120,end:82,orig:84,takes:96,action:150,performers:130,perfCount:66,genre:100,body:58,face:58,glove:58,hero:70,safety:70,priority:86,location:130,description:210,script:280,shotType:120,camera:190,vfx:160,director:220,props:180,refs:322,actions:84};
const NO_SORT=["handle","refs","actions"];
function partLabel(key){ if(String(key).startsWith("c_")){const c=colMap()[key];return c?c.label+(c.type==="flag"?" (tag when ticked)":""):null} return ID_PART_LABELS[key]||key; }
const ID_PART_LABELS={shot:"Shot #",take:"Take #",prod:"Production ID",day:"Shoot day #",perfCount:"# Of performers",props:"Prop",performers:"Performer(s)",genre:"Genre",action:"Action",body:"Body (tag when ticked)",face:"Face (tag when ticked)",glove:"Glove (tag when ticked)",hero:"Hero",shotType:"Shot type",location:"Location / Setup"};

/* ===================== sync engine state ===================== */
let MODE="local";            // "local" or "team"
let base=null;               // the agreed document (server-confirmed in team mode)
let cursor="";               // newest batch key seen
let pending=[];              // my changes not yet confirmed: [{bid, ops}]
let seenKeys=new Map();      // recently applied batch keys -> time
let S=null, lastView=null;   // what's on screen, and the copy it was built from
let undoStack=[], redoStack=[];
let presence=[], activity=[];
let lastSyncOk=0, syncTimer=null, flushTimer=null, flushing=false, syncing=false, backoff=0, netErr="";
let projects=[];             // [{id,name,archived}]
let localSeq=0;

const PKEY=(pid,part)=>`shotlist2-p-${pid}-${part}`;
function pid(){return P.projectId}

/* view = agreed document + my unconfirmed changes on top */
function viewModel(){
  const m=cloneModel(base);
  for(const p of pending) for(const op of p.ops) applyOp(m,op,"~",true);
  return materialize(m);
}
function persistLocalState(){
  if(!pid()) return;
  lsSet(PKEY(pid(),"base"),base);
  lsSet(PKEY(pid(),"meta"),{cursor});
  if(MODE==="team") lsSet(PKEY(pid(),"pending"),pending);
}
function strip(ops){return ops.map(o=>({e:o.e,id:o.id,set:o.set}))}
function localStamp(){return pad13(Date.now())+"-L"+String(localSeq++).padStart(6,"0")}

function enqueue(ops){
  if(!ops.length) return;
  if(MODE==="local"){
    foldBatch(base,{k:localStamp(),ops:strip(ops)});
    touchProject();
  }else{
    pending.push({bid:uid("b"),ops:strip(ops)});
    scheduleFlush(250);
  }
  persistLocalState(); updateStatus();
}

/* turn whatever changed on screen into edits */
function commit(){
  if(!S||!lastView) return;
  savePrefs();
  const ops=diffDocs(lastView,S);
  if(!ops.length) return;
  // positions given to new or moved items are written back, so the next save sees them as settled
  for(const o of ops){ if(!("pos" in o.set)) continue;
    const obj=o.e==="day"?S.days.find(d=>d.id===o.id):o.e==="row"?(findRow(o.id)||{}).r:o.e==="person"?S.people.find(p=>p.id===o.id):null;
    if(obj) obj.pos=o.set.pos; }
  undoStack.push(ops); if(undoStack.length>200) undoStack.shift();
  redoStack=[];
  enqueue(ops);
  lastView=clone(S);
  updUndo();
}
function rebuild(force){
  commit();
  const v=viewModel();
  if(!force && JSON.stringify(v)===JSON.stringify(lastView)) return false;
  S=v; lastView=clone(v); invalidateCols();
  ensureActive();
  renderAllKeepFocus();
  return true;
}
function undo(){
  commit();
  const ops=undoStack.pop(); if(!ops) return;
  enqueue(ops.map(o=>({e:o.e,id:o.id,set:o.prev})));
  redoStack.push(ops); rebuild(true); updUndo(); toast("Undone");
}
function redo(){
  commit();
  const ops=redoStack.pop(); if(!ops) return;
  enqueue(ops); undoStack.push(ops); rebuild(true); updUndo();
}
function updUndo(){ $("#undoBtn").disabled=!undoStack.length; $("#redoBtn").disabled=!redoStack.length; }

/* ===================== team networking ===================== */
async function api(path,body,opts={}){
  const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),opts.timeout||15000);
  try{
    const sep=path.includes("?")?"&":"?";
    const url=path+(opts.noProject?"":sep+"p="+encodeURIComponent(pid()||""));
    const r=await fetch(url,{method:body===undefined?"GET":"POST",headers:{"content-type":"application/json","x-team-key":P.teamKey||""},body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal,cache:"no-store"});
    const j=await r.json().catch(()=>({error:"Unexpected reply from the server"}));
    if(!r.ok) throw Object.assign(new Error(j.error||("Error "+r.status)),{status:r.status});
    return j;
  }finally{clearTimeout(t)}
}
function scheduleFlush(ms){clearTimeout(flushTimer);flushTimer=setTimeout(flush,ms)}
async function flush(){
  if(MODE!=="team"||flushing||!pending.length) return;
  flushing=true; updateStatus();
  try{
    while(pending.length){
      const p=pending[0];
      const r=await api("/api/ops",{cid:P.cid,bid:p.bid,by:P.name||"Someone",ops:p.ops});
      foldBatch(base,{k:r.k,ops:p.ops});
      seenKeys.set(r.k,Date.now()); if(r.k>cursor) cursor=r.k;
      activity.push({k:r.k,by:P.name||"You",cid:P.cid,at:Date.now(),ops:p.ops});
      pending=pending.filter(x=>x.bid!==p.bid);
      persistLocalState();
    }
    backoff=0; netErr="";
  }catch(e){
    netErr=e.message; if(e.status===401) return needKey(e.message);
    backoff=Math.min(30000,(backoff||1000)*2); scheduleFlush(backoff);
  }finally{flushing=false; updateStatus();}
  rebuild(false);
}
function scheduleSync(ms){clearTimeout(syncTimer);syncTimer=setTimeout(syncNow,ms)}
async function syncNow(){
  if(MODE!=="team"||syncing) return;
  syncing=true;
  try{
    commit();
    const now=Date.now();
    for(const [k,t] of seenKeys) if(now-t>120000) seenKeys.delete(k);
    const r=await api("/api/sync",{cid:P.cid,name:P.name,day:(D()||{}).name||"",since:cursor,seen:[...seenKeys.keys()],row:focusRow||""});
    if(r.snapshot){
      base=base?mergeModels(base,r.snapshot.model):cloneModel(r.snapshot.model);
      if(r.snapshot.upto>cursor) cursor=r.snapshot.upto;
    }
    const mine=new Set(pending.map(p=>p.bid));
    const remote=[];
    for(const b of (r.batches||[]).sort((a,b)=>a.k<b.k?-1:1)){
      foldBatch(base,b); seenKeys.set(b.k,Date.now()); if(b.k>cursor) cursor=b.k;
      if(b.cid===P.cid&&mine.has(b.bid)) pending=pending.filter(p=>p.bid!==b.bid);
      if(b.cid!==P.cid) remote.push(b);
      activity.push(b);
    }
    if(activity.length>400) activity=activity.slice(-400);
    presence=r.presence||[];
    lastSyncOk=Date.now(); backoff=0; netErr="";
    persistLocalState();
    const changed=rebuild(false);
    if(changed&&remote.length) flashRemote(remote);
    renderPresence(); applyPeerRows();
  }catch(e){
    netErr=e.message; if(e.status===401){syncing=false;return needKey(e.message)}
    backoff=Math.min(30000,(backoff||2000)*2);
  }finally{syncing=false; updateStatus();}
  const every=(document.hidden?15:Math.max(2,Number(P.poll)||3))*1000;
  scheduleSync(backoff||every);
}
let focusRow="";
document.addEventListener("focusin",e=>{const tr=e.target.closest&&e.target.closest("#grid tbody tr");focusRow=tr?tr.dataset.id||"":""});
function applyPeerRows(){
  $$("#grid tr.peer").forEach(tr=>{tr.classList.remove("peer");tr.style.removeProperty("--peer");tr.removeAttribute("title");$$(".peerchip",tr).forEach(x=>x.remove())});
  if(!P.peerRows||MODE!=="team") return;
  for(const p of presence){ if(p.cid===P.cid||!p.row) continue;
    const tr=$(`#grid tbody tr[data-id="${p.row}"]`); if(!tr) continue;
    const col=colorFor(p.name||p.cid); tr.classList.add("peer"); tr.style.setProperty("--peer",col); tr.title=(p.name||"Someone")+" is working in this row";
    const td=tr.firstElementChild; if(td) td.append(h("span",{class:"peerchip",style:`background:${col}`},initials(p.name)));
  }
}
function flashRemote(batches){
  const ids=new Map(); const names=new Set();
  batches.forEach(b=>{names.add(b.by||"Someone");b.ops.forEach(o=>{if(o.e==="row")ids.set(o.id,colorFor(b.by||b.cid))})});
  if(P.peerRows) ids.forEach((col,id)=>{const tr=$(`#grid tbody tr[data-id="${id}"]`);if(tr){tr.style.setProperty("--flash",col);tr.classList.remove("flash");void tr.offsetWidth;tr.classList.add("flash")}});
  const a=$(".act-list"); if($("#actModal").classList.contains("open")) renderActivity();
  if(names.size) toast([...names].join(", ")+" updated the schedule");
}
function updateStatus(){
  const el=$("#status"), label=$("span",el);
  el.className="status noprint";
  if(MODE==="local"){label.textContent="Local - this browser";el.title="Saved in this browser only. Open the team site to work together.";return}
  const n=pending.reduce((a,p)=>a+p.ops.length,0);
  if(netErr&&!navigator.onLine||netErr&&backoff){el.classList.add("off");label.textContent=n?`Offline - ${pending.length} change${pending.length>1?"s":""} waiting`:"Offline - retrying";el.title=netErr+". Changes are kept on this device and sent when the connection is back.";return}
  if(pending.length||flushing){el.classList.add("busy");label.textContent="Saving…";el.title=`${pending.length} change${pending.length>1?"s":""} sending`;return}
  el.classList.add("live");const ago=lastSyncOk?Math.round((Date.now()-lastSyncOk)/1000):0;
  label.textContent="Live";el.title=lastSyncOk?`Synced ${ago}s ago`:"Connecting…";
}
setInterval(()=>{if(MODE==="team")updateStatus()},5000);
function renderPresence(){
  const w=$("#who"); w.innerHTML="";
  if(MODE!=="team") return;
  const others=presence.filter(p=>p.cid!==P.cid);
  const me=h("span",{style:`background:${colorFor(P.name||P.cid)}`,title:`${P.name||"You"} (you)`},initials(P.name||"You"));
  w.append(me,...others.slice(0,6).map(p=>h("span",{style:`background:${colorFor(p.name||p.cid)}`,title:`${p.name||"Someone"}${p.day?" - on "+p.day:""}`},initials(p.name))));
  if(others.length>6) w.append(h("small",{class:"note"},"+"+(others.length-6)));
}

/* ===================== projects ===================== */
function touchProject(){
  if(MODE!=="local") return;
  const list=lsGet("shotlist2-projects",[]); const it=list.find(x=>x.id===pid());
  if(it){it.updated=Date.now(); if(S&&S.project&&S.project.name) it.name=S.project.name; lsSet("shotlist2-projects",list)}
}
async function loadProjects(){
  if(MODE==="team"){const r=await api("/api/projects",undefined,{noProject:true});projects=r.projects||[]}
  else{
    projects=lsGet("shotlist2-projects",[]);
    if(!projects.length&&SEED){projects=[{id:SEED.id||"main",name:SEED.project.name,updated:Date.now()}];lsSet("shotlist2-projects",projects);lsSet(PKEY(SEED.id||"main","seed"),SEED)}
  }
  return projects;
}
function blankSeed(name,from){
  const cfg=from?clone(from.cfg):undefined;
  const project=Object.assign({name,client:"",prodId:"",fps:"",dates:"",location:"",system:"",lead:"",notes:""},from?{client:from.project.client,prodId:from.project.prodId,fps:from.project.fps,system:from.project.system,lead:from.project.lead,location:from.project.location}:{} ,{name});
  const people=from?clone(from.people).map(p=>Object.assign(p,{id:uid("p")})):[];
  const c=cfg||{}; const d={id:uid("d"),name:"Day 1",kind:"schedule",dayNo:1,date:"",call:c.newCall||"09:00",wrap:c.newWrap||"18:00",setupPct:c.newSetupPct||100,shootPct:c.newShootPct||100,minSetup:c.newMinSetup||0,origWrap:null,rows:[]};
  return {project,people,cols:from?clone(from.cols||[]):[],cfg,days:[d]};
}
function docToSeed(doc){return {project:clone(doc.project),people:clone(doc.people),cols:clone(doc.cols||[]),cfg:clone(doc.cfg),days:clone(doc.days)}}
async function createProject(name,seed){
  if(MODE==="team"){const r=await api("/api/projects",{name,seed},{noProject:true});await loadProjects();return r.id}
  const id=(name||"project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24)+"-"+Math.random().toString(36).slice(2,6);
  lsSet(PKEY(id,"seed"),seed); lsSet(PKEY(id,"base"),seedModel(seed));
  const list=lsGet("shotlist2-projects",[]); list.push({id,name,updated:Date.now()}); lsSet("shotlist2-projects",list); projects=list;
  return id;
}
async function openProject(id){
  commit();
  if(MODE==="team"&&pending.length){await flush()}
  P.projectId=id; savePrefs();
  base=lsGet(PKEY(id,"base"),null); cursor=(lsGet(PKEY(id,"meta"),{})||{}).cursor||"";
  pending=MODE==="team"?lsGet(PKEY(id,"pending"),[]):[];
  seenKeys=new Map(); undoStack=[]; redoStack=[]; activity=[]; presence=[];
  if(MODE==="local"&&!base){const seed=lsGet(PKEY(id,"seed"),null)||(SEED&&(SEED.id||"main")===id?SEED:blankSeed("Untitled project"));base=seedModel(seed);persistLocalState()}
  if(MODE==="team"&&!base){base=emptyModel();cursor=""}
  S=viewModel(); lastView=clone(S); ensureActive(); renderAll(); updUndo(); updateStatus();
  if(MODE==="team"){scheduleSync(0); if(pending.length) scheduleFlush(300)}
}
async function getSeed(){
  if(MODE==="team"){try{return await api("/api/seed")}catch(e){return null}}
  return lsGet(PKEY(pid(),"seed"),null)||(SEED&&(SEED.id||"main")===pid()?SEED:null);
}

/* ===================== document helpers ===================== */
function live(){ return S?S.days.filter(d=>!d.archived):[]; }
function D(){ if(!S) return null; const id=P.activeByProject[pid()]; const t=tabOrder(); return live().find(d=>d.id===id)||t.ready[0]||t.wrapped[0]||null; }
/* day status: set by hand, or worked out - wrapped once the date has passed or every shot is ticked */
function todayISO(){ const n=new Date(); return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0"); }
function dayStatus(d){
  if(d.status==="ready"||d.status==="wrapped") return d.status;
  if(d.date&&d.date<todayISO()) return "wrapped";
  const shots=d.rows.filter(r=>r.type!=="break");
  if(shots.length&&shots.every(r=>r.done)) return "wrapped";
  return "ready";
}
/* tab order: Ready to roll (soonest first, undated after), then Wrapped (most recent first); the days' own order is the tie-break */
function tabOrder(){
  const idx=new Map(S.days.map((d,i)=>[d.id,i]));
  const L=live(); const ready=L.filter(d=>dayStatus(d)==="ready"), wrapped=L.filter(d=>dayStatus(d)==="wrapped");
  ready.sort((a,b)=>(a.date&&b.date?(a.date<b.date?-1:a.date>b.date?1:0):a.date?-1:b.date?1:0)||idx.get(a.id)-idx.get(b.id));
  wrapped.sort((a,b)=>(a.date&&b.date?(a.date>b.date?-1:a.date<b.date?1:0):a.date?-1:b.date?1:0)||idx.get(b.id)-idx.get(a.id));
  return {ready,wrapped};
}
function ensureActive(){ const d=D(); if(d) P.activeByProject[pid()]=d.id; }
function findRow(id){ for(const d of S.days){const r=d.rows.find(x=>x.id===id); if(r) return {d,r}} return null; }
function kind(){ return (D()&&D().kind)||"schedule"; }
function hidden(){ const k=kind(); if(!P.hiddenBy[k]) P.hiddenBy[k]=clone(HIDDEN_DEFAULT[k]||[]); return P.hiddenBy[k]; }
function cfg(){ return Object.assign({},CFG_DEFAULTS,(S&&S.cfg)||{}); }
function dayIndex(d){ return S.days.indexOf(d); }

/* ===================== shot names ===================== */
function cleanSeg(s){ return String(s==null?"":s).replace(/\s*[\/&]\s*/g,"+").replace(/[\\:*?"'<>|,;()\[\]{}!]+/g,"").trim(); }
function isOn(v){ return v===true||v===1||/^(1|y|yes|true|x|✓|✔)$/i.test(String(v==null?"":v).trim()); }
function shotNumber(r,d){
  const c=cfg(); const pad=Math.max(1,Number(c.shotPad)||3);
  if(c.shotSource!=="running"&&r.shot&&String(r.shot).trim()){
    const s=String(r.shot).trim(); return /^\d+$/.test(s)?s.padStart(pad,"0"):s;
  }
  const shots=d.rows.filter(x=>x.type!=="break"); return String(shots.indexOf(r)+1).padStart(pad,"0");
}
function shotName(r,d,take){
  if(!r||r.type==="break") return "";
  const c=cfg(); const parts=[];
  if(!String(r.action||"").trim()&&!String(r.shot||"").trim()&&!String(r.description||"").trim()) return "";
  for(const p of (c.idParts||[])){
    if(!p.on) continue; const pre=cleanSeg(p.prefix);
    let v="";
    switch(String(p.key).startsWith("c_")?"__custom":p.key){
      case "shot": v=shotNumber(r,d); break;
      case "take": v=take?pre+String(take).padStart(Math.max(1,Number(c.takePad)||1),"0"):""; break;
      case "prod": v=cleanSeg(S.project.prodId); break;
      case "day": v=(d.dayNo||dayIndex(d)+1)?pre+(d.dayNo||dayIndex(d)+1):""; break;
      case "body": case "face": case "glove": v=isOn(r[p.key])?pre:""; break;
      case "__custom": { const cc=colMap()[p.key]; if(!cc){v="";break} if(cc.type==="flag"){v=isOn(r[p.key])?(pre||cleanSeg(cc.label)):"";break} const s=cleanSeg(r[p.key]); v=(s===""||s==="-")?"":pre+s; break; }
      case "action": { const a=String(r.action||"").trim(); v=a?pre+cleanSeg(a):""; break; }
      default: { const s=cleanSeg(r[p.key]); v=(s===""||s==="-")?"":pre+s; }
    }
    if(p.key==="take"||p.key==="body"||p.key==="face"||p.key==="glove"||p.key==="day"||p.key==="action") { if(v) parts.push(v); continue; }
    if(p.key!=="shot"&&p.key!=="prod") { if(v) parts.push(v); continue; }
    if(v) parts.push(p.key==="shot"?pre+v:pre+v);
  }
  let name=parts.filter(Boolean).join(c.idSep==null?"_":c.idSep);
  const sp=c.idSpaces; if(sp!=="keep") name=name.replace(/\s+/g,sp==null?"_":sp);
  return name;
}
/* takes continue across rows that repeat the same shot and action on a day, like retakes in the Shotlist Builder */
function sameKey(r){ return String(r.shot||"").trim().toLowerCase()+"|"+String(r.action||"").trim().toLowerCase(); }
function takeBase(r,d){ d=d||D(); let n=0; const k=sameKey(r); if(k==="|") return 0;
  for(const x of d.rows){ if(x.id===r.id) break; if(x.type!=="break"&&sameKey(x)===k) n+=Number(x.takes)||0; } return n; }
function lastTake(r,d){ return takeBase(r,d)+(Number(r.takes)||0); }
function nextTake(r,d){ return lastTake(r,d)+1; }

/* ===================== schedule maths ===================== */
function effSetup(r,d){ d=d||D(); if(r.type==="break") return 0; const b=Math.max(Number(r.setup)||0, Number(d.minSetup)||0); return b*(Number(d.setupPct)||100)/100; }
function effShoot(r,d){ d=d||D(); if(r.type==="break") return Number(r.shoot)||0; return (Number(r.shoot)||0)*(Number(d.shootPct)||100)/100; }
function compute(d){
  d=d||D(); let t=toMin(d.call||"09:00"); const out={}; let setupT=0, shootT=0, breakT=0;
  for(const r of d.rows){ const su=effSetup(r,d), sh=effShoot(r,d); const start=t+su, end=start+sh; out[r.id]={setupStart:t,start,end,su,sh};
    if(r.type==="break") breakT+=sh; else {setupT+=su; shootT+=sh;} t=end; }
  return {rows:out, wrap:t, setupT, shootT, breakT};
}

/* ===================== grid rendering ===================== */
function colW(k){if(P.widths&&P.widths[k])return P.widths[k];if(DEFAULT_WIDTHS[k])return DEFAULT_WIDTHS[k];const c=colMap()[k]||{};return c.type==="note"?200:c.type==="flag"?70:c.type==="number"?80:130}
// print: squeeze columns so the table fits an A4 landscape page (about 1060px), notes columns give way first
const PRINT_W={handle:20,shot:36,priority:50,shotId:112,duration:34,setup:36,start:48,shoot:36,end:60,orig:46,takes:34,perfCount:28,body:28,face:28,glove:28,hero:36,safety:36,refs:96,actions:0};
function printWidths(){
  if(!S) return; const hid=hidden(), PAGE=1060; const list=cols().filter(c=>!hid.includes(c.key)&&c.key!=="actions");
  const w={}, flex=[];
  for(const c of list){ if(PRINT_W[c.key]!=null) w[c.key]=PRINT_W[c.key]; else if(c.type==="flag") w[c.key]=28; else if(c.type==="number") w[c.key]=34; else flex.push(c.key); }
  // text and notes columns share what's left, in proportion to their on-screen widths
  const fixed=Object.values(w).reduce((a,b)=>a+b,0); let room=PAGE-fixed;
  // weight by how much text each column holds on this day, so empty columns shrink and busy ones get the room
  const rows=(D()||{rows:[]}).rows, MIN=40;
  const wt={}; flex.forEach(k=>{const n=rows.reduce((a,r)=>a+String(r[k]??"").length,0);wt[k]=n?Math.sqrt(n)+6:0});
  const tw=flex.reduce((a,k)=>a+wt[k],0);
  if(flex.length&&room>=flex.length*MIN){ const spare=room-flex.length*MIN; flex.forEach(k=>{w[k]=MIN+(tw?Math.floor(spare*wt[k]/tw):Math.floor(spare/flex.length))}); }
  else { flex.forEach(k=>w[k]=MIN); const f=PAGE/(fixed+flex.length*MIN); for(const k in w) w[k]=Math.floor(w[k]*f); }
  let total=0; for(const c of cols()){const col=$(`#cols col[data-col="${c.key}"]`);if(!col)continue;const v=(hid.includes(c.key)||c.key==="actions")?0:w[c.key]||0;col.style.width=v+"px";total+=v}
  $("#grid").style.width=total+"px";
}
function applyWidths(){
  let total=0; const hid=hidden();
  for(const c of cols()){const col=$(`#cols col[data-col="${c.key}"]`);if(!col)continue;const hd=hid.includes(c.key);col.style.width=hd?"0px":colW(c.key)+"px";col.style.display=hd?"none":"";if(!hd)total+=colW(c.key);}
  $("#grid").style.width=total+"px";
}
function cellVal(r,key,C){
  const c=C.rows[r.id];
  switch(key){
    case "shot": return r.type==="break"?(r.label||"Break"):(r.shot||"");
    case "shotId": return shotName(r,D(),nextTake(r,D()));
    case "setup": return r.type==="break"?0:c.su;
    case "shoot": return c.sh;
    case "start": return c.start;
    case "end": return c.end;
    case "takes": return Number(r.takes)||0;
    case "perfCount": return r.perfCount===""||r.perfCount==null?null:Number(r.perfCount);
    case "body": case "face": case "glove": return isOn(r[key])?"yes":"";
    case "priority": { const i=priorityOptions().indexOf(r.priority||""); return i<0?(r.priority?99:null):i; }
    case "orig": return r.origStart?toMin(r.origStart.length<5?"0"+r.origStart:r.origStart):null;
    default: { const c=colMap()[key]; if(c&&c.custom&&c.type==="flag") return isOn(r[key])?"yes":""; if(c&&c.custom&&c.type==="number") return r[key]===""||r[key]==null?null:Number(r[key]); return r[key]==null?"":r[key]; }
  }
}
function filterText(r,key,C){
  if(key==="priority") return String(r.priority||"");
  const v=cellVal(r,key,C);
  if(["start","end","orig"].includes(key)) return v==null?"":fmt(v)+" "+hhmm(v);
  if(["setup","shoot"].includes(key)) return String(Math.round(v));
  return String(v==null?"":v);
}
const COLLATE=new Intl.Collator(undefined,{numeric:true,sensitivity:"base"});
function visibleRows(C){
  const d=D(); if(!d) return [];
  const f=P.filters||{}; const hid=hidden(); const keys=Object.keys(f).filter(k=>(f[k]||"").trim()&&!hid.includes(k)&&colMap()[k]);
  let list=d.rows.filter(r=>{
    if(P.view==="todo"&&r.done) return false;
    if(!prioFilterOk(r)) return false;
    return keys.every(k=>{
      const q=f[k].trim().toLowerCase(); const txt=filterText(r,k,C).toLowerCase();
      const m=q.match(/^([<>]=?)\s*(.+)$/);
      if(m&&["setup","shoot","start","end","orig","takes","perfCount"].includes(k)){
        const n=/:/.test(m[2])?toMin(m[2]):Number(m[2]); const v=cellVal(r,k,C); if(v==null||isNaN(n)) return false;
        return m[1]===">"?v>n:m[1]===">="?v>=n:m[1]==="<"?v<n:v<=n;
      }
      return q.startsWith("!")?!txt.includes(q.slice(1)):txt.includes(q);
    });
  });
  if(P.sort&&P.sort.key&&colMap()[P.sort.key]){
    const {key,dir}=P.sort; const mul=dir==="desc"?-1:1;
    list=list.map((r,i)=>({r,i,v:cellVal(r,key,C)})).sort((a,b)=>{
      const av=a.v,bv=b.v; const ae=av==null||av==="", be=bv==null||bv==="";
      if(ae&&be) return a.i-b.i; if(ae) return 1; if(be) return -1;
      const dd=(typeof av==="number"&&typeof bv==="number")?av-bv:COLLATE.compare(String(av),String(bv));
      return dd?dd*mul:a.i-b.i;
    }).map(x=>x.r);
  }
  return list;
}
function setSort(key){
  if(!P.sort||P.sort.key!==key) P.sort={key,dir:"asc"};
  else if(P.sort.dir==="asc") P.sort={key,dir:"desc"};
  else P.sort=null;
  savePrefs(); renderHead(); renderBody();
}
function renderViewbar(shown){
  const vb=$("#viewbar"); vb.innerHTML=""; const d=D();
  const fcount=Object.entries(P.filters||{}).filter(([k,v])=>(v||"").trim()&&!hidden().includes(k)).length;
  const sorted=!!(P.sort&&P.sort.key);
  $("#grid").classList.toggle("sorted",sorted);
  if(!d||(!sorted&&!fcount&&P.view!=="todo"&&!P.prioFilter)){vb.classList.remove("show");return}
  vb.classList.add("show");
  vb.append(h("span",{},`Showing ${shown} of ${d.rows.length} rows`));
  if(sorted){
    const lab=(colMap()[P.sort.key]||{}).label||P.sort.key;
    vb.append(h("span",{},`· sorted by ${lab} ${P.sort.dir==="asc"?"▲":"▼"} - times still follow the running order`));
    vb.append(h("button",{class:"btn small",onclick:()=>{P.sort=null;savePrefs();renderHead();renderBody()}},"Clear sort"));
    vb.append(h("button",{class:"btn small",title:"Reorder the actual schedule to match this sort (filtered-out rows go to the end)",onclick:applySortAsOrder},"Make this the running order"));
  }
  if(P.prioFilter){ const s=$("#prioFilter"); const lab=s&&s.selectedOptions[0]?s.selectedOptions[0].textContent:""; vb.append(h("span",{},"· priority: "+lab),h("button",{class:"btn small",onclick:()=>{P.prioFilter="";savePrefs();renderPrioFilter();renderBody()}},"Show all priorities")); }
  if(fcount) vb.append(h("button",{class:"btn small",onclick:()=>{P.filters={};savePrefs();renderHead();renderBody()}},`Clear ${fcount} filter${fcount>1?"s":""}`));
}
function applySortAsOrder(){
  const d=D(); const C=compute(); const shown=visibleRows(C); const rest=d.rows.filter(r=>!shown.includes(r));
  d.rows=[...shown,...rest]; P.sort=null; commit(); renderHead(); renderBody(); toast("Running order updated - Undo to go back");
}
function renderHead(){
  $("#grid").style.setProperty("--stick-shot",(hidden().includes("handle")?0:colW("handle"))+"px");
  const cg=$("#cols"); cg.innerHTML="";
  for(const c of cols()) cg.append(h("col",{"data-col":c.key}));
  const thead=$("#grid thead"); thead.innerHTML="";
  const tr=h("tr",{class:"labels"}), fr=h("tr",{class:"filters"}); const hid=hidden();
  for(const c of cols()){
    const hc=hid.includes(c.key)?" hide-col":"";
    const sortable=!NO_SORT.includes(c.key);
    const th=h("th",{class:(sortable?"sortable":"")+hc,"data-col":c.key});
    const movable=c.key!=="handle"&&c.key!=="actions";
    const lab=h("div",{class:"thl",title:(sortable?"Click to sort":"")+(movable?" · drag to move":""),draggable:movable?"true":null},c.label);
    if(movable){
      lab.addEventListener("dragstart",e=>{colDrag=c.key;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain","col:"+c.key);th.classList.add("coldrag")});
      lab.addEventListener("dragend",()=>{colDrag=null;$$("#grid th.coldrop-l,#grid th.coldrop-r,#grid th.coldrag").forEach(x=>x.classList.remove("coldrop-l","coldrop-r","coldrag"))});
    }
    if(c.key!=="handle"){
      th.addEventListener("dragover",e=>{if(!colDrag)return;e.preventDefault();const r=th.getBoundingClientRect();const right=c.key==="actions"?false:(e.clientX>r.left+r.width/2);$$("#grid th.coldrop-l,#grid th.coldrop-r").forEach(x=>x.classList.remove("coldrop-l","coldrop-r"));th.classList.add(right?"coldrop-r":"coldrop-l");th.dataset.side=right?"r":"l"});
      th.addEventListener("drop",e=>{if(!colDrag)return;e.preventDefault();const key=colDrag;colDrag=null;const list=cols().filter(x=>x.key!=="handle"&&x.key!=="actions").map(x=>x.key);
        let before=c.key==="actions"?null:(th.dataset.side==="r"?(list[list.indexOf(c.key)+1]??null):c.key);if(before===key)return;moveColumn(key,before)});
    }
    if(P.sort&&P.sort.key===c.key) lab.append(h("span",{class:"arrow"},P.sort.dir==="asc"?"▲":"▼"));
    if(sortable) lab.addEventListener("click",()=>setSort(c.key));
    th.append(lab);
    const grip=h("div",{class:"grip",title:"Drag to resize · double-click to reset"});
    grip.addEventListener("pointerdown",e=>startResize(e,c.key,grip));
    grip.addEventListener("dblclick",()=>{delete P.widths[c.key];applyWidths();reflow();savePrefs()});
    th.append(grip); tr.append(th);
    const fth=h("th",{class:hc.trim(),"data-col":c.key});
    if(sortable){
      const ph=["setup","shoot","takes","perfCount"].includes(c.key)?">10":["start","end","orig"].includes(c.key)?">14:00":"filter…";
      const inp=h("input",{type:"search",placeholder:ph,value:(P.filters||{})[c.key]||"","aria-label":"Filter "+c.label});
      inp.classList.toggle("on",!!inp.value.trim());
      inp.addEventListener("input",()=>{P.filters[c.key]=inp.value;inp.classList.toggle("on",!!inp.value.trim());savePrefs();renderBody()});
      fth.append(inp);
    }
    fr.append(fth);
  }
  thead.append(tr,fr); applyWidths();
  requestAnimationFrame(()=>{$("#grid").style.setProperty("--headH",tr.getBoundingClientRect().height+"px")});
}
function reflow(){ $$("#grid textarea.cell").forEach(autosize); }
function startResize(e,key,grip){
  e.preventDefault(); e.stopPropagation();
  const x0=e.clientX, w0=colW(key); grip.classList.add("active"); document.body.style.cursor="col-resize";
  const mv=ev=>{P.widths[key]=Math.max(40,Math.round(w0+ev.clientX-x0));applyWidths()};
  const up=()=>{document.removeEventListener("pointermove",mv);document.removeEventListener("pointerup",up);document.removeEventListener("pointercancel",up);grip.classList.remove("active");document.body.style.cursor="";reflow();savePrefs()};
  document.addEventListener("pointermove",mv); document.addEventListener("pointerup",up); document.addEventListener("pointercancel",up);
}
/* every editor looks its row up by id at the moment you type, so a refresh from a teammate never strands your edit */
function R(id){ const f=findRow(id); return f?f.r:null; }
let textTimer=null;
function softCommit(){ clearTimeout(textTimer); textTimer=setTimeout(commit,700); }
function minsCtl(r,key){
  const step=()=>Math.max(1,Number(cfg().stepMin)||5);
  const wrap=h("div",{}); const box=h("div",{class:"mins timing"});
  const inp=h("input",{type:"number",min:"0",step:String(step()),value:r[key]??0,"aria-label":key,"data-k":key});
  inp.addEventListener("input",()=>{const x=R(r.id);if(!x)return;x[key]=Math.max(0,Number(inp.value)||0);recalc()});
  inp.addEventListener("change",commit);
  const bump=dir=>{const x=R(r.id);if(!x)return;x[key]=Math.max(0,(Number(x[key])||0)+dir*step());inp.value=x[key];recalc();commit()};
  box.append(h("button",{title:`-${step()} min`,onclick:()=>bump(-1)},"−"),inp,h("button",{title:`+${step()} min`,onclick:()=>bump(1)},"+"));
  wrap.append(box,h("div",{class:"eff","data-eff":key},""));
  return wrap;
}
const NAME_KEYS=["shot","action","performers","perfCount","genre","props","hero","shotType","location"];
function textCell(r,key,multiline=true,extra={}){
  if(!multiline&&!extra.type&&key!=="shot"){
    // single-line text that still wraps to show everything: Enter moves on instead of adding a line
    const t=h("textarea",{class:"cell oneline",rows:"1",spellcheck:"true","data-k":key});
    t.value=r[key]??"";
    t.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.altKey){e.preventDefault();t.blur()}});
    t.addEventListener("input",()=>{const x=R(r.id);if(!x)return;if(/\n/.test(t.value))t.value=t.value.replace(/\s*\n+\s*/g," ");x[key]=t.value;autosize(t);if(NAME_KEYS.includes(key)||String(key).startsWith("c_"))refreshNames(r.id);softCommit()});
    t.addEventListener("change",commit);
    requestAnimationFrame(()=>autosize(t));
    return t;
  }
  if(!multiline){
    const i=h("input",Object.assign({class:"cell"+(key==="shot"?" shotno":"")+(extra.small?" small":""),value:r[key]??"",placeholder:extra.ph||"","data-k":key},extra.type?{type:extra.type}:{}));
    i.addEventListener("input",()=>{const x=R(r.id);if(!x)return;x[key]=extra.type==="number"?(i.value===""?"":Number(i.value)):i.value;if(["shot","action","performers","perfCount","genre","props","hero","shotType","location"].includes(key)||String(key).startsWith("c_"))refreshNames(r.id);if(key==="shot")renderTimeline(compute());softCommit()});
    i.addEventListener("change",commit);
    return i;
  }
  const t=h("textarea",{class:"cell",rows:"1",spellcheck:"true","data-k":key});
  t.value=r[key]??"";
  t.addEventListener("input",()=>{const x=R(r.id);if(!x)return;x[key]=t.value;autosize(t);if(["props","location","shotType"].includes(key)||String(key).startsWith("c_"))refreshNames(r.id);softCommit()});
  t.addEventListener("change",commit);
  requestAnimationFrame(()=>autosize(t));
  return t;
}
function flagCell(r,key){
  const cb=h("input",{type:"checkbox","data-k":key,title:(colMap()[key]||{}).label||key}); cb.checked=isOn(r[key]);
  cb.addEventListener("change",()=>{const x=R(r.id);if(!x)return;x[key]=cb.checked;refreshNames(r.id);commit()});
  return h("div",{class:"flagcell"},cb);
}
/* priority colours: the team's choices from Settings > Columns, else red / amber / grey for the first three */
const PRIO_DEFAULTS=["","#d9a441","#9aa3ab"];   // "" = the highlight colour
function prioColor(v){
  if(!v) return null;
  const set=(cfg().priorityColors||{})[v];
  if(set==="none") return null;
  if(set) return set;
  const i=priorityOptions().indexOf(v);
  if(i===0) return "var(--accent)";
  return i>0&&i<3?PRIO_DEFAULTS[i]:null;
}
function prioHex(v){ const c=prioColor(v); if(!c) return null; if(c.startsWith("var(")){const x=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();return /^#/.test(x)?x:"#c2412d"} return c; }
function inkOn(hex){ if(!hex||!/^#[0-9a-f]{6}$/i.test(hex)) return "#fff"; const n=parseInt(hex.slice(1),16); const r=n>>16,g=(n>>8)&255,b=n&255; return (0.299*r+0.587*g+0.114*b)>150?"#1d1d1f":"#fff"; }
function paintPrio(sel,tr,v){
  const col=prioColor(v);
  if(sel){ if(col){sel.classList.add("prio");sel.style.background=col;sel.style.color=inkOn(prioHex(v))} else {sel.classList.remove("prio");sel.style.background="";sel.style.color=""} }
  if(tr){ if(col){tr.classList.add("prio");tr.style.setProperty("--prio",col)} else {tr.classList.remove("prio");tr.style.removeProperty("--prio")} }
}
/* the Priority filter in the day controls (just for you): "" all, "=X" only X, ">=X" X and higher, "none" not set */
function prioFilterOk(r){
  const f=P.prioFilter||""; if(!f) return true;
  if(r.type==="break") return false;
  const opts=priorityOptions(), v=r.priority||"";
  if(f==="none") return !v||!opts.includes(v);
  if(f.startsWith(">=")){ const lim=opts.indexOf(f.slice(2)), i=opts.indexOf(v); return lim>=0&&i>=0&&i<=lim; }
  if(f.startsWith("=")) return v===f.slice(1);
  return true;
}
function renderPrioFilter(){
  const s=$("#prioFilter"); if(!s) return; const opts=priorityOptions(); s.innerHTML="";
  s.append(h("option",{value:""},"All priorities"));
  opts.forEach((o,i)=>{ s.append(h("option",{value:"="+o},o+" only")); if(i>0) s.append(h("option",{value:">="+o},i===opts.length-1?"Any priority set":o+" and higher")); });
  s.append(h("option",{value:"none"},"No priority set"));
  if(P.prioFilter&&![...s.options].some(o=>o.value===P.prioFilter)) P.prioFilter="";
  s.value=P.prioFilter||""; s.classList.toggle("on",!!P.prioFilter);
}
function listCell(r,key){
  const opts=[...((colMap()[key]||{}).options||[""])]; const cur=r[key]||""; if(cur&&!opts.includes(cur)) opts.push(cur);
  const s=h("select",{class:"cell","data-k":key}); for(const o of opts) s.append(h("option",{value:o},o));
  s.value=cur; if(key==="priority") paintPrio(s,null,cur);
  s.addEventListener("change",()=>{const x=R(r.id);if(!x)return;x[key]=s.value;
    if(key==="priority"){paintPrio(s,s.closest("tr"),s.value);renderTimeline(compute())}
    commit()});
  return s;
}

function takesCell(r){
  const box=h("div",{class:"mins"});
  const out=h("input",{type:"number",min:"0",value:Number(r.takes)||0,"data-k":"takes","aria-label":"Takes"});
  out.addEventListener("input",()=>{const x=R(r.id);if(!x)return;x.takes=Math.max(0,Number(out.value)||0);refreshNames(r.id)});
  out.addEventListener("change",commit);
  const bump=dir=>{const x=R(r.id);if(!x)return;x.takes=Math.max(0,(Number(x.takes)||0)+dir);out.value=x.takes;refreshNames(r.id);commit()};
  box.append(h("button",{title:"One take fewer",onclick:()=>bump(-1)},"−"),out,h("button",{title:"One more take",onclick:()=>bump(1)},"+"));
  return box;
}
const imgCache=new Map();
async function imgSrc(ref){
  if(!ref) return "";
  if(!String(ref).startsWith("img:")) return ref;
  if(imgCache.has(ref)) return imgCache.get(ref);
  const p=(async()=>{try{const r=await fetch("/api/image?k="+encodeURIComponent(ref.slice(4)),{headers:{"x-team-key":P.teamKey||""}});if(!r.ok)return"";return URL.createObjectURL(await r.blob())}catch(e){return""}})();
  imgCache.set(ref,p); return p;
}
let imgTarget=null;
function refBox(r,key){
  const d=h("div",{class:"ref"+(r[key]||r.ref1||r.ref2?"":" empty"),title:r[key]?"Click to enlarge":"Click to add image"});
  if(r[key]){
    const img=h("img",{alt:"reference"}); imgSrc(r[key]).then(s=>{img.src=s}); d.append(img);
    const x=h("button",{class:"x",title:"Remove image"},"✕");
    x.addEventListener("click",ev=>{ev.stopPropagation();const y=R(r.id);if(!y)return;y[key]="";commit();renderBody()});
    d.append(x);
    d.addEventListener("click",async()=>{$("#lightImg").src=await imgSrc(r[key]);$("#lightbox").classList.add("open")});
  }else{
    d.textContent="+ image";
    d.addEventListener("click",()=>{imgTarget={id:r.id,key};$("#imgInput").value="";$("#imgInput").click()});
  }
  return d;
}
function nameCell(r){
  const d=D(); const n=nextTake(r,d); const name=shotName(r,d,n);
  const wrap=h("div",{class:"sid","data-name":r.id});
  if(!name){wrap.append(h("span",{class:"note"},"add an action or shot #"));return wrap}
  const b=h("button",{class:"btn small copy",title:`Copy the name for take ${n}`,onclick:async()=>{const x=R(r.id);const nm=shotName(x,D(),nextTake(x,D()));if(await copyText(nm))toast("Copied "+nm)}},"Copy");
  wrap.append(b,h("span",{},name));
  return wrap;
}
function refreshNames(id){
  const tr=$(`#grid tbody tr[data-id="${id}"]`); const f=findRow(id); if(!tr||!f) return;
  const td=$('td[data-col="shotId"]',tr); if(td){td.innerHTML="";td.append(nameCell(f.r))}
}
function renderBody(){
  const tb=$("#grid tbody"); tb.innerHTML=""; const d=D();
  if(!d){renderViewbar(0);tb.append(h("tr",{},h("td",{colspan:cols().length,class:"empty-day"},"No days yet. Use + Day to add one.")));return}
  const C=compute(); const shown=visibleRows(C); renderViewbar(shown.length); const hid=hidden();
  if(!d.rows.length) tb.append(h("tr",{},h("td",{colspan:cols().length,class:"empty-day"},"Nothing on this day yet. Add a shot, a break or paste a list of actions below.")));
  shown.forEach(r=>{
    const tr=h("tr",{"data-id":r.id,class:r.type==="break"?"break":""});
    const isBreak=r.type==="break";
    for(const c of cols()){
      const td=h("td",{class:hid.includes(c.key)?"hide-col":"","data-col":c.key});
      const k=c.key;
      if(k==="handle"){
        const hd=h("div",{class:"ctl"});
        const g=h("span",{class:"handle",draggable:"true",title:"Drag to reorder"},"⠿");
        g.addEventListener("dragstart",e=>{dragId=r.id;tr.classList.add("dragging");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",r.id)});
        g.addEventListener("dragend",()=>{tr.classList.remove("dragging");$$("tr.dropbefore").forEach(x=>x.classList.remove("dropbefore"))});
        hd.append(g);
        if(!isBreak){const cb=h("input",{type:"checkbox",title:"Mark as shot","data-k":"done"});cb.checked=!!r.done;
          cb.addEventListener("change",()=>{const x=R(r.id);if(!x)return;x.done=cb.checked;tr.classList.toggle("done",x.done);commit();if(P.view==="todo")renderBody();renderStats(compute());renderDayTabs()});
          hd.append(h("label",{class:"chk"},cb,"Shot"))}
        td.append(hd);
      }
      else if(k==="shot"){ td.append(isBreak?textCell(r,"label",false):textCell(r,"shot",false,{ph:"-"})); }
      else if(k==="shotId"){ if(!isBreak) td.append(nameCell(r)); }
      else if(k==="duration"){ td.className+=" num"; if(!isBreak) td.append(textCell(r,"duration",false)); }
      else if(k==="setup"){ td.className+=" num"; if(!isBreak) td.append(minsCtl(r,"setup")); }
      else if(k==="shoot"){ td.className+=" num"; td.append(minsCtl(r,"shoot")); }
      else if(k==="start"){ td.className+=" num"; td.append(h("div",{class:"time","data-t":"start"}),h("div",{class:"orig","data-t":"setupfrom"})); }
      else if(k==="end"){ td.className+=" num"; td.append(h("div",{class:"time end","data-t":"end"})); }
      else if(k==="orig"){ td.className+=" num"; td.append(h("div",{class:"orig"},r.origStart||"-"),h("div",{class:"delta","data-t":"delta"})); }
      else if(k==="refs"){ if(!isBreak){const rf=h("div",{class:"refs"});rf.append(refBox(r,"ref1"),refBox(r,"ref2"));td.append(rf)} }
      else if(k==="takes"){ td.className+=" num"; if(!isBreak) td.append(takesCell(r)); }
      else if(k==="actions"){
        const b=h("div",{class:"rowbtns"});
        b.append(h("button",{class:"mv",title:"Move up",onclick:()=>move(r.id,-1)},"↑"),h("button",{class:"mv",title:"Move down",onclick:()=>move(r.id,1)},"↓"),
          h("button",{title:"Duplicate row",onclick:()=>dup(r.id)},"Dup"),h("button",{title:"Insert a break / move below",onclick:()=>insertBreakAfter(r.id)},"+Brk"),
          h("button",{title:"Delete row",onclick:()=>del(r.id)},"Del"));
        td.append(b);
      }
      else if(!isBreak||k==="description"){
        const t=c.type;
        if(t==="flag") td.append(flagCell(r,k));
        else if(t==="list") td.append(listCell(r,k));
        else if(t==="number"){ td.className+=" num"; td.append(textCell(r,k,false,{type:"number",small:true})); }
        else if(t==="text") td.append(textCell(r,k,false));
        else if(t==="note") td.append(textCell(r,k,true));
      }
      tr.append(td);
    }
    if(r.done) tr.classList.add("done");
    if(r.type!=="break") paintPrio(null,tr,r.priority);
    tr.addEventListener("dragover",e=>{if(!dragId)return;e.preventDefault();$$("tr.dropbefore").forEach(x=>x.classList.remove("dropbefore"));tr.classList.add("dropbefore")});
    tr.addEventListener("drop",e=>{e.preventDefault();if(!dragId)return;const rows=D().rows;const from=rows.findIndex(x=>x.id===dragId);let to=rows.findIndex(x=>x.id===r.id);if(from<0||to<0||from===to){dragId=null;return}const [m]=rows.splice(from,1);if(from<to)to--;rows.splice(to,0,m);dragId=null;commit();renderBody()});
    tb.append(tr);
  });
  recalc(); applyPeerRows();
}
let dragId=null, colDrag=null;
function recalc(){
  const d=D(); if(!d) return; const C=compute(); const wrapT=toMin(d.wrap||"18:00");
  for(const tr of $$("#grid tbody tr[data-id]")){
    const r=d.rows.find(x=>x.id===tr.dataset.id); if(!r) continue; const c=C.rows[r.id];
    $('[data-t="start"]',tr).textContent=fmt(c.start);
    $('[data-t="end"]',tr).textContent="→ "+fmt(c.end);
    const sf=$('[data-t="setupfrom"]',tr); if(sf) sf.textContent=r.type==="break"?"":(c.su?"setup "+fmt(c.setupStart):"");
    const dl=$('[data-t="delta"]',tr);
    if(dl){ if(r.origStart){const o=toMin(r.origStart.length<5?"0"+r.origStart:r.origStart);const dd=c.start-o;dl.textContent=dd===0?"on time":(dd>0?"+":"")+dur(dd);dl.className="delta "+(dd>0?"late":dd<0?"early":"")} else dl.textContent=""; }
    const se=$('.eff[data-eff="setup"]',tr); if(se) se.textContent=(Math.round(c.su)!==Number(r.setup))?"= "+Math.round(c.su)+" min":"";
    const sh=$('.eff[data-eff="shoot"]',tr); if(sh) sh.textContent=(r.type!=="break"&&Math.round(c.sh)!==Number(r.shoot))?"= "+Math.round(c.sh)+" min":"";
    tr.classList.toggle("over",c.end>wrapT&&!r.done);
  }
  renderStats(C); renderTimeline(C); refreshTabLabel(C);
}
function tabSub(d,C){const shots=d.rows.filter(r=>r.type!=="break");const done=shots.filter(r=>r.done).length;
  if(C.shootT>0) return "wrap "+fmt(C.wrap); if(!shots.length) return "empty"; return done===shots.length?"shot":shots.length+" setups";}
function refreshTabLabel(C){const b=$("#dayTabs .daytab.on");if(!b)return;const sm=$("small",b);if(sm)sm.textContent=tabSub(D(),C)}
function renderStats(C){
  const d=D(); const st=$("#stats"); st.innerHTML=""; const w=$("#warnings"); w.innerHTML="";
  if(!d) return;
  const wrapT=toMin(d.wrap||"18:00"), callT=toMin(d.call||"09:00"); const over=C.wrap-wrapT;
  const shots=d.rows.filter(r=>r.type!=="break"); const done=shots.filter(r=>r.done).length;
  const takes=shots.reduce((a,r)=>a+(Number(r.takes)||0),0);
  const card=(k,v,sub,cls="")=>h("div",{class:"stat"},h("div",{class:"k"},k),h("div",{class:"v "+cls},v),sub?h("div",{class:"sub"},sub):null);
  st.append(card("Calculated wrap",fmt(C.wrap),over>0?dur(over)+" over target":dur(-over)+" spare",over>0?"bad":"ok"),
    card("Day length",dur(C.wrap-callT),"call "+fmt(callT)+" → wrap"),
    card("Setup total",dur(C.setupT),Math.round(100*C.setupT/Math.max(1,C.setupT+C.shootT))+"% of working time"),
    card("Shooting total",dur(C.shootT)), card("Breaks / moves",dur(C.breakT)),
    card("Shots",String(shots.length),done?done+" shot, "+(shots.length-done)+" to go":"none marked shot"));
  if(takes||d.kind==="capture") st.append(card("Takes",String(takes),"logged on this day"));
  if(d.origWrap) st.append(card("Original PDF wrap",fmt(toMin(d.origWrap)),"as planned"));
  if(C.shootT>0&&!d.rows.some(r=>r.type==="break"&&/lunch/i.test(r.label||""))) w.append(h("span",{class:"pill"},"No lunch break scheduled - use + Add break / move"));
  const zero=shots.filter(r=>effSetup(r,d)===0).length;
  if(C.shootT===0&&shots.length) w.append(h("span",{class:"pill info"},"No timings logged for this day yet - fill in Setup / Shoot minutes"));
  else if(zero) w.append(h("span",{class:"pill info"},zero+" shot"+(zero>1?"s have":" has")+" 0 min setup"));
  const noShoot=shots.filter(r=>!Number(r.shoot)).length;
  if(noShoot&&C.shootT>0) w.append(h("span",{class:"pill info"},noShoot+" shot"+(noShoot>1?"s have":" has")+" no shoot time"));
  if(d.kind==="capture"){const noAct=shots.filter(r=>!String(r.action||"").trim()).length; if(noAct) w.append(h("span",{class:"pill info"},noAct+" shot"+(noAct>1?"s have":" has")+" no Action, so the name uses the shot # only"))}
  const unnumbered=shots.filter(r=>!String(r.shot||"").trim()).length;
  if(unnumbered&&d.kind!=="capture") w.append(h("span",{class:"pill info"},unnumbered+" shot"+(unnumbered>1?"s":"")+" without a shot number"));
}
function renderTimeline(C){
  const d=D(); const tl=$("#timeline"); tl.innerHTML=""; if(!d) return;
  const start=toMin(d.call||"09:00"), end=Math.max(C.wrap,toMin(d.wrap||"18:00"))+15;
  const span=Math.max(60,end-start); const pct=m=>((m-start)/span*100)+"%";
  const pxHr=(tl.clientWidth||800)/span*60, every=pxHr<26?180:pxHr<46?120:60;
  for(let hr=Math.ceil(start/60)*60;hr<=end;hr+=60){if(hr%every){tl.append(h("div",{class:"tickline",style:"left:"+pct(hr)}));continue}const f=(hr-start)/span;tl.append(h("div",{class:"tickline",style:"left:"+pct(hr)}),h("div",{class:"tick"+(f<0.04?" first":f>0.96?" last":""),style:"left:"+pct(hr)},fmt(hr)))}
  const wrapT=toMin(d.wrap||"18:00");
  for(const r of d.rows){
    const c=C.rows[r.id]; const name=r.type==="break"?(r.label||"Break"):("Shot "+(r.shot||r.action||"-"));
    if(c.su>0){const s=h("div",{class:"seg setup",style:`left:${pct(c.setupStart)};width:${c.su/span*100}%`,title:`${name} - setup ${fmt(c.setupStart)} to ${fmt(c.start)}`});s.onclick=()=>jump(r.id);tl.append(s)}
    if(c.sh>0){const s=h("div",{class:"seg "+(r.type==="break"?"break":"shoot")+(c.end>wrapT?" over":""),style:`left:${pct(c.start)};width:${c.sh/span*100}%;border-left:1px solid var(--panel)`,title:`${name} - ${fmt(c.start)} to ${fmt(c.end)}`});s.onclick=()=>jump(r.id);tl.append(s)}
  }
  tl.append(h("div",{class:"wrapline",style:"left:"+pct(wrapT),title:"Target wrap "+fmt(wrapT)}));
}
function jump(id){const tr=$(`#grid tbody tr[data-id="${id}"]`);if(!tr)return;tr.scrollIntoView({behavior:"smooth",block:"center"});tr.style.outline="2px solid var(--accent)";setTimeout(()=>tr.style.outline="",1200)}
function renderCols(){
  const p=$("#colPop"); p.innerHTML="";
  p.append(h("div",{class:"note"},`Showing columns for ${kind()==="capture"?"Mocap":"Live Action"} days, on this device. Add or rename columns in Settings > Columns.`));
  const hid=hidden();
  for(const c of cols()){ if(c.fixed) continue;
    const cb=h("input",{type:"checkbox"}); cb.checked=!hid.includes(c.key);
    cb.addEventListener("change",()=>{const H=hidden();if(cb.checked)P.hiddenBy[kind()]=H.filter(k=>k!==c.key);else H.push(c.key);savePrefs();renderHead();renderBody()});
    p.append(h("label",{},cb,c.label));
  }
  p.append(h("div",{class:"note",style:"margin-top:.4rem"},"Drag a column heading to move it. Your order is used on every day."));
  p.append(h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:()=>{P.hiddenBy[kind()]=clone(HIDDEN_DEFAULT[kind()]||[]);savePrefs();renderCols();renderHead();renderBody()}},"Reset shown columns"),
    h("button",{class:"btn small",onclick:()=>{P.colOrder=[];savePrefs();invalidateCols();renderCols();renderHead();renderBody();toast("Columns back in their usual order")}},"Reset column order")));
}
function renderDayTabs(){
  const bar=$("#dayTabs"); bar.innerHTML="";
  const {ready,wrapped}=tabOrder(); const cur=D();
  const tab=d=>{
    const st=dayStatus(d), auto=!d.status;
    const b=h("button",{class:"daytab"+(st==="wrapped"?" wrapped":"")+(cur&&d.id===cur.id?" on":""),title:`${d.name||"Day"} · ${d.date||"no date"} · ${d.rows.filter(r=>r.type!=="break").length} setups · ${st==="wrapped"?"Wrapped":"Ready to roll"}${auto?" (auto)":""}`},
      h("span",{class:"kind "+(d.kind==="capture"?"mocap":"la")},d.kind==="capture"?"Mocap":"LA"), d.name||"Day", h("small",{},tabSub(d,compute(d))));
    b.onclick=()=>{if(cur&&cur.id===d.id)return;commit();P.activeByProject[pid()]=d.id;P.sort=null;savePrefs();renderAll()};
    return b;
  };
  // ready days fill the left two thirds, wrapped days sit in the right third; tabs shrink to fit as days are added
  const gR=h("div",{class:"tg ready"}), gW=h("div",{class:"tg wrapped"});
  gR.append(h("span",{class:"tabgroup ready"},"Ready to roll"));
  ready.forEach(d=>gR.append(tab(d)));
  gR.append(h("button",{class:"daytab add",title:"Add an empty day",onclick:addDay},"+ Day"));
  bar.append(gR);
  const arch=S.days.filter(d=>d.archived);
  if(wrapped.length||arch.length){ bar.append(gW); gW.append(h("span",{class:"tabgroup wrapped"},"Wrapped")); wrapped.forEach(d=>gW.append(tab(d))); }
  requestAnimationFrame(fitTabs);
  if(arch.length) gW.append(h("button",{class:"daytab arch",title:"Days put away. Restore them from here",onclick:openArchived},"Archived ("+arch.length+")"));
}
function fitTabs(){
  if(innerWidth<=760){$$("#dayTabs .tg").forEach(g=>g.classList.remove("t1","t2","t3"));const on=$("#dayTabs .daytab.on");if(on)on.scrollIntoView({block:"nearest",inline:"nearest"});return}
  // squeeze in steps so names stay readable: drop the wrap/shot note, then the kind chip, then shrink further, then scroll
  for(const g of $$("#dayTabs .tg")){
    g.classList.remove("t1","t2","t3");
    const tight=()=>g.scrollWidth>g.clientWidth+1||$$(".daytab",g).some(t=>t.scrollWidth>t.clientWidth+1);
    for(const c of ["t1","t2","t3"]){ if(!tight()) break; g.classList.add(c); }
  }
}
window.addEventListener("resize",()=>{clearTimeout(fitTabs._t);fitTabs._t=setTimeout(()=>{fitTabs();if(S&&D())renderTimeline(compute())},120)});
function openArchived(){renderArchived();$("#archModal").classList.add("open")}
function renderArchived(){
  const l=$("#archList"); l.innerHTML=""; const arch=S.days.filter(d=>d.archived);
  if(!arch.length){l.append(h("p",{class:"note"},"Nothing archived."));return}
  for(const d of arch) l.append(h("div",{class:"toolbar"},h("span",{},h("b",{},d.name||"Day")," ",h("span",{class:"note"},`${d.date||"no date"} · ${d.rows.filter(r=>r.type!=="break").length} setups`)),
    h("button",{class:"btn small primary",onclick:()=>{d.archived=null;P.activeByProject[pid()]=d.id;commit();savePrefs();renderAll();renderArchived();if(!S.days.some(x=>x.archived))$("#archModal").classList.remove("open");toast("Restored "+d.name)}},"Restore")));
}
function renderSettingsRow(){
  const d=D(); $("#dayControls").style.display=d?"":"none"; if(!d) return;
  const set=(id,v)=>{const el=$("#"+id);if(document.activeElement!==el)el.value=v??""};
  set("dayName",d.name); set("dayKind",d.kind||"schedule"); set("dayStatus",d.status||"");
  { const o=$("#dayStatus option[value='']"); if(o) o.textContent="Auto ("+(dayStatus(Object.assign({},d,{status:""}))==="wrapped"?"Wrapped":"Ready to roll")+")"; } set("dayNo",d.dayNo||(dayIndex(d)+1)); set("shootDate",d.date);
  set("callTime",d.call); set("wrapTime",d.wrap); set("setupPct",d.setupPct); set("shootPct",d.shootPct); set("minSetup",d.minSetup); set("viewMode",P.view||"all"); renderPrioFilter();
  $("#bandSummary").textContent=`${d.name||"Day"} · call ${fmt(toMin(d.call||"09:00"))} · wrap ${fmt(toMin(d.wrap||"18:00"))}`;
  $("#projTitle").textContent=S.project.name||"Untitled project"; document.title=(S.project.name||"Shotlist")+" - Shotlist Scheduler";
}
function renderAll(){ if(!S) return; invalidateCols(); renderDayTabs(); renderSettingsRow(); renderCols(); renderHead(); renderBody(); }
function renderAllKeepFocus(){
  const a=document.activeElement; let keep=null;
  if(a&&a.closest&&a.closest("#grid tbody")){const tr=a.closest("tr");keep={id:tr&&tr.dataset.id,k:a.dataset.k,s:a.selectionStart,e:a.selectionEnd}}
  const scroller=$(".tablewrap"), top=scroller.scrollTop, left=scroller.scrollLeft;
  renderAll();
  scroller.scrollTop=top; scroller.scrollLeft=left;
  if(keep&&keep.id&&keep.k){const el=$(`#grid tbody tr[data-id="${keep.id}"] [data-k="${keep.k}"]`);if(el){el.focus({preventScroll:true});try{if(keep.s!=null)el.setSelectionRange(keep.s,keep.e)}catch(e){}}}
  if($("#setModal").classList.contains("open")&&!$("#setModal").contains(document.activeElement)) renderSetTab();
  if($("#ditModal").classList.contains("open")) renderDit();
}

/* ===================== row and day operations ===================== */
function newShot(extra={}){
  const c=cfg(); const d=D(); const prev=[...d.rows].reverse().find(r=>r.type!=="break")||{};
  const r={id:uid("r"),type:"shot",shot:"",label:"",duration:"",setup:c.newSetup,shoot:c.newShoot,origStart:"",origSetup:0,origShoot:0,
    location:prev.location||"",description:"",script:"",shotType:"",camera:"",vfx:"",director:"",props:"",ref1:"",ref2:"",done:false,
    priority:"",perfCount:d.kind==="capture"?(prev.perfCount||1):"",performers:d.kind==="capture"?(prev.performers||""):"",genre:"",action:"",body:d.kind==="capture",face:false,glove:false,hero:"",safety:"",takes:0,takeLog:null};
  return Object.assign(r,extra);
}
function addShot(){const d=D();if(!d)return;const r=newShot();d.rows.push(r);commit();renderBody();jump(r.id);const el=$(`#grid tbody tr[data-id="${r.id}"] [data-k="${d.kind==="capture"?"action":"shot"}"]`);if(el)el.focus()}
function insertBreakAt(i){const c=cfg();const d=D();const r={id:uid("r"),type:"break",label:c.breakLabel||"Break",shoot:Number(c.breakMin)||30,setup:0,description:"",origStart:"",done:false,takes:0};d.rows.splice(i,0,r);commit();renderBody();jump(r.id)}
function insertBreakAfter(id){const i=D().rows.findIndex(x=>x.id===id);insertBreakAt(i+1)}
function move(id,dir){const rows=D().rows;const i=rows.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=rows.length)return;[rows[i],rows[j]]=[rows[j],rows[i]];commit();renderBody()}
function dup(id){const rows=D().rows;const i=rows.findIndex(x=>x.id===id);const c=clone(rows[i]);c.id=uid("r");c.origStart="";c.done=false;c.takes=0;if(c.shot)c.shot+=" (copy)";rows.splice(i+1,0,c);commit();renderBody()}
function del(id){const rows=D().rows;const i=rows.findIndex(x=>x.id===id);const r=rows[i];const name=r.type==="break"?(r.label||"break"):("shot "+(r.shot||r.action||"(no number)"));rows.splice(i,1);commit();renderBody();toast("Deleted "+name+" - Undo to restore")}
function addDay(){
  commit(); const c=cfg(); const n=S.days.length+1;
  const d={id:uid("d"),name:"Day "+n,kind:"schedule",dayNo:n,date:"",call:c.newCall,wrap:c.newWrap,setupPct:c.newSetupPct,shootPct:c.newShootPct,minSetup:c.newMinSetup,origWrap:null,rows:[]};
  S.days.push(d); P.activeByProject[pid()]=d.id; commit(); savePrefs(); renderAll();
}

/* ===================== DIT names ===================== */
function ditRows(){const d=D();return d?d.rows.filter(r=>r.type!=="break"&&(P.ditShowDone||!r.done||Number(r.takes)>0)):[]}
function renderDit(){
  const d=D(); const tb=$("#ditRows"); tb.innerHTML=""; $("#ditDay").textContent=d?"· "+d.name:"";
  $("#ditShowDone").checked=!!P.ditShowDone;
  const rows=ditRows();
  if(!rows.length){tb.append(h("tr",{},h("td",{colspan:4,class:"note"},"No shots to name on this day yet.")));return}
  for(const r of rows){
    const n=nextTake(r,d), name=shotName(r,d,n), b0=takeBase(r,d);
    const tk=h("div",{class:"takes"},
      h("button",{class:"btn small",title:"One take fewer",onclick:()=>{const x=R(r.id);x.takes=Math.max(0,(Number(x.takes)||0)-1);commit();renderBody();renderDit()}},"−"),
      h("b",{title:b0?`takes ${b0+1} to ${lastTake(r,d)} (this shot already had ${b0} earlier in the day)`:""},String(Number(r.takes)||0)),
      h("button",{class:"btn small",title:"One more take (without copying)",onclick:()=>{const x=R(r.id);x.takes=(Number(x.takes)||0)+1;commit();renderBody();renderDit()}},"+"));
    const go=h("button",{class:"btn small primary",disabled:!name,title:"Log take "+n+" and copy its name",onclick:async()=>{const x=R(r.id);const t=nextTake(x,D());const nm=shotName(x,D(),t);x.takes=t-takeBase(x,D());commit();renderBody();renderDit();const ok=await copyText(nm);addOut(nm);toast((ok?"Copied ":"Couldn't reach the clipboard - select it below: ")+nm)}},"Next take → copy");
    const all=h("button",{class:"btn small",disabled:!name||!(Number(r.takes)>0),title:"Copy every take name so far",onclick:async()=>{const x=R(r.id);const list=[];const b1=takeBase(x,D());for(let t=b1+1;t<=b1+(Number(x.takes)||0);t++)list.push(shotName(x,D(),t));const txt=list.join("\n");await copyText(txt);addOut(txt,true);toast("Copied "+list.length+" names")}},"Copy all");
    tb.append(h("tr",{},h("td",{},r.shot||"-"),h("td",{class:"name"},name||h("span",{class:"note"},"add an action or shot #")),h("td",{},tk),h("td",{},h("div",{class:"toolbar"},go,all))));
  }
}
function addOut(text,replace){const o=$("#ditOut");o.value=replace?text:(o.value?o.value+"\n":"")+text;o.scrollTop=o.scrollHeight}

/* ===================== settings ===================== */
let setTab="project";
const SET_TABS=[["project","Project"],["people","Cast & crew"],["columns","Columns"],["names","Shot names"],["defaults","Team defaults"],["display","Display"],["projects","Projects"],["team","Team & sync"]];
function openSettings(tab){if(tab)setTab=tab;$("#setModal").classList.add("open");renderSetTabs();renderSetTab()}
function renderSetTabs(){const t=$("#setTabs");t.innerHTML="";for(const [k,l] of SET_TABS)t.append(h("button",{class:setTab===k?"on":"",onclick:()=>{setTab=k;renderSetTabs();renderSetTab()}},l))}
function bindDoc(el,getter,setter,ev="input"){el.addEventListener(ev,()=>{setter(el.type==="checkbox"?el.checked:el.value);if(ev==="input")softCommit();else commit()});el.addEventListener("change",()=>{commit();renderAll()});return el}
function renderSetTab(){
  const b=$("#setBody"); b.innerHTML=""; const c=S.cfg;
  if(setTab==="project"){
    const f=h("div",{class:"form"});
    const fields=[["name","Project name"],["client","Client / production"],["prodId","Shoot / production ID"],["fps","Frame rate (fps)"],["dates","Shoot date(s)"],["location","Location"],["system","Capture system"],["lead","Director / lead"]];
    for(const [k,l] of fields){const i=h("input",{value:S.project[k]||""});bindDoc(i,null,v=>{S.project[k]=v;if(k==="name")$("#projTitle").textContent=v||"Untitled project"});f.append(h("label",{},l,i))}
    const ta=h("textarea",{}); ta.value=S.project.notes||""; bindDoc(ta,null,v=>{S.project.notes=v}); f.append(h("label",{class:"wide"},"Project notes",ta));
    b.append(h("p",{class:"note"},"Shared with everyone on this project. The production ID can go into shot names (see Shot names)."),f);
  }
  else if(setTab==="people"){
    for(const group of ["Cast","Crew"]){
      b.append(h("h3",{},group));
      const t=h("table",{class:"plain"}); t.append(h("thead",{},h("tr",{},...["Name",group==="Cast"?"Character / role":"Role","Phone","Email","Notes",""].map(x=>h("th",{},x)))));
      const tb=h("tbody",{});
      S.people.filter(p=>(p.group||"Crew")===group).forEach(p=>{
        const cell=(k)=>{const i=h("input",{value:p[k]||""});bindDoc(i,null,v=>{const q=S.people.find(x=>x.id===p.id);if(q)q[k]=v});return h("td",{},i)};
        tb.append(h("tr",{},cell("name"),cell("role"),cell("phone"),cell("email"),cell("notes"),h("td",{},h("button",{class:"btn small danger",title:"Remove",onclick:()=>{S.people=S.people.filter(x=>x.id!==p.id);commit();renderSetTab();toast("Removed - Undo to restore")}},"✕"))));
      });
      t.append(tb); b.append(t);
      b.append(h("button",{class:"btn small",style:"margin-top:.5rem",onclick:()=>{S.people.push({id:uid("p"),group,name:"",role:"",phone:"",email:"",notes:""});commit();renderSetTab();const ins=$$("#setBody table.plain")[group==="Cast"?0:1];const last=ins&&$$("tbody tr",ins).pop();if(last)$("input",last).focus()}},"+ Add "+group.toLowerCase()));
    }
    b.append(h("div",{class:"toolbar",style:"margin-top:1rem"},h("button",{class:"btn small",onclick:exportPeople},"Export cast & crew (CSV)")));
  }
  else if(setTab==="columns"){
    b.append(h("p",{class:"note"},"Shared with everyone on this project. New columns appear on every day. Each person can still show or hide columns for themselves with the Columns menu."));
    b.append(h("h3",{},"Your columns"));
    const t2=h("table",{class:"plain"}); t2.append(h("thead",{},h("tr",{},...["","Name","Type","Dropdown options (comma separated)","In shot name",""].map(x=>h("th",{},x)))));
    const tb2=h("tbody",{});
    S.cols.forEach((col,i)=>{
      const C=()=>S.cols.find(x=>x.id===col.id)||{};   // look the column up each time: a teammate's change may have refreshed S
      const nm=h("input",{value:col.label||""}); nm.addEventListener("input",()=>{C().label=nm.value;invalidateCols();softCommit()}); nm.addEventListener("change",()=>{commit();renderAll()});
      const ty=h("select",{}); CUSTOM_TYPES.forEach(([v,l])=>ty.append(h("option",{value:v},l))); ty.value=col.type||"text";
      ty.addEventListener("change",()=>{const c=C();c.type=ty.value;if(c.type==="list"&&!c.options)c.options="A,B,C";commit();renderAll();renderSetTab()});
      const op=h("input",{value:col.options||"",placeholder:"A,B,C",disabled:col.type!=="list"}); op.addEventListener("change",()=>{C().options=op.value;commit();renderAll()});
      const key="c_"+col.id; const part=(S.cfg.idParts||[]).find(p=>p.key===key);
      const inId=h("input",{type:"checkbox"}); inId.checked=!!(part&&part.on);
      inId.addEventListener("change",()=>{const parts=S.cfg.idParts;const pp=parts.find(p=>p.key===key);if(pp)pp.on=inId.checked;else if(inId.checked)parts.push({key,on:true,prefix:""});commit();renderAll();toast(inId.checked?"Added to shot names - set its prefix and position in Shot names":"Removed from shot names")});
      const mv=dir=>{const i2=S.cols.findIndex(x=>x.id===col.id),j=i2+dir;if(i2<0||j<0||j>=S.cols.length)return;[S.cols[i2],S.cols[j]]=[S.cols[j],S.cols[i2]];commit();renderAll();renderSetTab()};
      const del=h("button",{class:"btn small danger",title:"Delete column",onclick:async()=>{if(!(await ask("Delete "+(col.label||"this column")+"?","It disappears from every day for everyone. The values are kept behind the scenes, so Undo brings it back with its data.","Delete")))return;S.cols=S.cols.filter(x=>x.id!==col.id);commit();renderAll();renderSetTab();toast("Deleted - Undo to restore")}},"✕");
      tb2.append(h("tr",{},h("td",{style:"white-space:nowrap"},h("button",{class:"btn small",disabled:i===0,onclick:()=>mv(-1)},"↑"),h("button",{class:"btn small",disabled:i===S.cols.length-1,onclick:()=>mv(1)},"↓")),h("td",{},nm),h("td",{},ty),h("td",{},op),h("td",{style:"text-align:center"},inId),h("td",{},del)));
    });
    if(!S.cols.length) tb2.append(h("tr",{},h("td",{colspan:6,class:"note"},"No extra columns yet.")));
    t2.append(tb2); b.append(t2);
    b.append(h("div",{class:"toolbar",style:"margin-top:.5rem"},h("button",{class:"btn small primary",id:"addColBtn",onclick:()=>{const id=uid("k").replace(/[^a-z0-9]/gi,"");S.cols.push({id,label:"New column",type:"text",options:""});commit();renderAll();renderSetTab();const ins=$$("#setBody table.plain")[0];const last=ins&&$$("tbody tr",ins).pop();if(last){const i=$("input",last);i.focus();i.select()}}},"+ Add column")));
    b.append(h("h3",{},"Priority"));
    const po=h("input",{value:S.cfg.priorityOptions||"HIGH,MID,LOW"}); po.addEventListener("change",()=>{S.cfg.priorityOptions=po.value;commit();renderAll();renderSetTab()});
    b.append(h("div",{class:"form"},h("label",{class:"wide"},"Priority options, highest first, separated by commas. Priority sorts and filters in this order.",po)));
    const pt=h("table",{class:"plain",style:"margin-top:.6rem;max-width:34rem"}); pt.append(h("thead",{},h("tr",{},h("th",{},"Priority"),h("th",{},"Colour"),h("th",{},""),h("th",{},"Looks like"))));
    const ptb=h("tbody",{});
    priorityOptions().forEach(o=>{
      const cur=(S.cfg.priorityColors||{})[o];
      const hex=cur&&cur!=="none"?cur:(prioHex(o)||"#9aa3ab");
      const pick=h("input",{type:"color",value:/^#[0-9a-f]{6}$/i.test(hex)?hex:"#9aa3ab",style:"width:3rem;height:2rem;padding:0;border:none;background:none"});
      const sample=h("span",{class:"chip",style:"font-weight:700;padding:.15rem .6rem"},o);
      const show=()=>{const c=prioColor(o);sample.style.background=c||"transparent";sample.style.color=c?inkOn(prioHex(o)):"var(--ink)"};
      const setC=v=>{const m=Object.assign({},S.cfg.priorityColors||{});if(v==null)delete m[o];else m[o]=v;S.cfg.priorityColors=m;invalidateCols();show()};
      pick.addEventListener("input",()=>{setC(pick.value)}); pick.addEventListener("change",()=>{commit();renderAll()});
      const none=h("button",{class:"btn small",title:"No colour for this priority",onclick:()=>{setC("none");commit();renderAll()}},"No colour");
      const reset=h("button",{class:"btn small",title:"Back to the default colour",onclick:()=>{setC(null);commit();renderAll();renderSetTab()}},"Default");
      show();
      ptb.append(h("tr",{},h("td",{},h("b",{},o)),h("td",{},pick),h("td",{style:"white-space:nowrap"},none,reset),h("td",{},sample)));
    });
    pt.append(ptb); b.append(pt,h("p",{class:"note"},"Colours are shared with the team. The default is the highlight colour for the first option, then amber and grey; anything after the third has no colour until you pick one."));
    b.append(h("h3",{},"Rename built-in columns"));
    const t3=h("table",{class:"plain"}); t3.append(h("thead",{},h("tr",{},h("th",{},"Column"),h("th",{},"Shown as"))));
    const tb3=h("tbody",{});
    for(const c0 of BASE_COLS){ if(!c0.label) continue;
      const inp=h("input",{value:(S.cfg.colLabels||{})[c0.key]||"",placeholder:c0.label});
      inp.addEventListener("change",()=>{const m=Object.assign({},S.cfg.colLabels||{});if(inp.value.trim())m[c0.key]=inp.value.trim();else delete m[c0.key];S.cfg.colLabels=m;commit();renderAll()});
      tb3.append(h("tr",{},h("td",{},c0.label),h("td",{},inp)));
    }
    t3.append(tb3); b.append(t3);
  }
  else if(setTab==="names"){
    b.append(h("p",{class:"note"},"Choose which parts make up each shot name and in what order. Parts that are blank or '-' are skipped, so there are no double separators. Body / Face / Glove add their tag only when ticked. Shared with everyone on this project."));
    const t=h("table",{class:"plain"}); t.append(h("thead",{},h("tr",{},h("th",{},""),h("th",{},"Use"),h("th",{},"Part"),h("th",{},"Prefix / tag"))));
    const tb=h("tbody",{});
    (c.idParts||[]).forEach((p,i)=>{
      const on=h("input",{type:"checkbox"}); on.checked=!!p.on; on.addEventListener("change",()=>{const q=S.cfg.idParts.find(x=>x.key===p.key);if(q)q.on=on.checked;commit();renderPrev();renderBody()});
      const pre=h("input",{value:p.prefix||"",style:"width:6rem"}); pre.addEventListener("input",()=>{const q=S.cfg.idParts.find(x=>x.key===p.key);if(q)q.prefix=pre.value;renderPrev();softCommit()}); pre.addEventListener("change",()=>{commit();renderBody()});
      const mv=(dir)=>{const a=S.cfg.idParts;const j=i+dir;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];commit();renderSetTab();renderBody()};
      tb.append(h("tr",{},h("td",{style:"white-space:nowrap"},h("button",{class:"btn small",disabled:i===0,onclick:()=>mv(-1)},"↑"),h("button",{class:"btn small",disabled:i===c.idParts.length-1,onclick:()=>mv(1)},"↓")),h("td",{},on),h("td",{},partLabel(p.key)||"(deleted column)"),h("td",{},pre)));
    });
    t.append(tb); b.append(t);
    const f=h("div",{class:"form",style:"margin-top:1rem"});
    const sel=(label,key,opts)=>{const s=h("select",{});for(const [v,l] of opts)s.append(h("option",{value:v},l));s.value=String(c[key]);s.addEventListener("change",()=>{S.cfg[key]=typeof CFG_DEFAULTS[key]==="number"?Number(s.value):s.value;commit();renderPrev();renderBody()});f.append(h("label",{},label,s))};
    sel("Join parts with","idSep",[["_","underscore  _"],["-","hyphen  -"],[".","dot  ."],["","nothing"]]);
    sel("Spaces inside a part","idSpaces",[["_","become _"],["-","become -"],["","are removed"],["keep","are kept"]]);
    sel("Shot # comes from","shotSource",[["field","the row's Shot # (running number if blank)"],["running","a running number on the day"]]);
    sel("Shot # digits","shotPad",[["1","1"],["2","2 (01)"],["3","3 (001)"],["4","4 (0001)"]]);
    sel("Take # digits","takePad",[["1","1 (T3)"],["2","2 (T03)"],["3","3 (T003)"]]);
    b.append(f,h("div",{class:"preview",id:"namePrev"}));
    renderPrev();
  }
  else if(setTab==="defaults"){
    b.append(h("p",{class:"note"},"Used for new shots, breaks and days. Shared with everyone on this project."));
    const f=h("div",{class:"form"});
    const num=(label,key,step=5)=>{const i=h("input",{type:"number",step:String(step),value:c[key]});bindDoc(i,null,v=>{S.cfg[key]=Number(v)||0},"change");f.append(h("label",{},label,i))};
    const txt=(label,key,type="text")=>{const i=h("input",{type,value:c[key]});bindDoc(i,null,v=>{S.cfg[key]=v},"change");f.append(h("label",{},label,i))};
    num("− / + step (min)","stepMin",1); num("New shot: setup (min)","newSetup"); num("New shot: shoot (min)","newShoot");
    txt("Break name","breakLabel"); num("Break length (min)","breakMin");
    txt("New day: call","newCall","time"); txt("New day: target wrap","newWrap","time");
    num("New day: setup buffer %","newSetupPct"); num("New day: shoot buffer %","newShootPct"); num("New day: minimum setup (min)","newMinSetup");
    b.append(f);
  }
  else if(setTab==="display"){
    b.append(h("p",{class:"note"},"Just for you, on this device. Try a preset, then fine-tune."));
    const presets={
      "Easy on the eyes":{theme:"warm",accent:"",font:"atkinson",fw:400,ui:14,tbl:15,lh:1.6,ls:0.01,density:"roomy",zebra:true,calm:true},
      "Night / dark set":{theme:"dim",accent:"",font:"atkinson",fw:400,ui:14,tbl:14,lh:1.55,ls:0.01,density:"comfortable",zebra:true,calm:true},
      "High contrast":{theme:"hc",accent:"",font:"atkinson",fw:500,ui:15,tbl:16,lh:1.55,ls:0.02,density:"roomy",zebra:true,calm:true},
      "Compact (fit more)":{theme:P.theme,font:"system",fw:400,ui:12,tbl:12,lh:1.3,ls:0,density:"compact",zebra:true},
      "Default":Object.assign({},DISPLAY_DEFAULTS)};
    b.append(h("div",{class:"toolbar",style:"margin-bottom:1rem"},...Object.entries(presets).map(([n,v])=>h("button",{class:"btn small",onclick:()=>{Object.assign(P,v);savePrefs();applyDisplay();renderAll();renderSetTab();toast(n)}},n))));
    const f=h("div",{class:"form"});
    const sel=(label,key,opts,after,num)=>{const s=h("select",{});for(const [v,l] of opts)s.append(h("option",{value:v},l));s.value=String(P[key]);s.addEventListener("change",()=>{P[key]=num?Number(s.value):s.value;savePrefs();applyDisplay();after&&after()});f.append(h("label",{},label,s))};
    const range=(label,key,min,max,step,unit,after)=>{const show=v=>unit==="px"?v+"px":unit==="x"?Number(v).toFixed(2):unit==="em"?(Number(v)===0?"normal":"+"+Math.round(Number(v)*100)+"%"):v;const out=h("span",{},show(P[key]));const i=h("input",{type:"range",min:String(min),max:String(max),step:String(step),value:String(P[key])});i.addEventListener("input",()=>{P[key]=Number(i.value);out.textContent=show(i.value);applyDisplay()});i.addEventListener("change",()=>{savePrefs();reflow();after&&after()});f.append(h("label",{},h("span",{},label," ",out),i))};
    const tog=(label,key)=>{const c=h("input",{type:"checkbox"});c.checked=!!P[key];c.addEventListener("change",()=>{P[key]=c.checked;savePrefs();applyDisplay()});f.append(h("label",{class:"inline"},c,label))};
    sel("Colour theme","theme",[["auto","Match my device (light / dark)"],["light","Light"],["warm","Warm paper (softer, less glare)"],["dim","Dim (soft dark grey)"],["dark","Dark"],["hc","High contrast"],["hcdark","High contrast dark"]]);
    sel("Highlight colour","accent",[["","Theme default"],["#c2412d","Red"],["#d0700f","Orange"],["#2e7d4f","Green"],["#1f7a7a","Teal"],["#2f6fb0","Blue"],["#7a5ea8","Purple"],["#a33b6b","Magenta"]]);
    sel("Font","font",[["system","System (default)"],["atkinson","Atkinson Hyperlegible (made for easier reading)"],["lexend","Lexend (wider, calmer letters)"],["serif","Serif"],["rounded","Rounded"],["mono","Monospace"]],()=>setTimeout(reflow,300));
    sel("Text weight","fw",[["400","Regular"],["500","Medium"],["600","Semi-bold"]],null,true);
    range("Interface text size","ui",11,20,1,"px"); range("Table text size","tbl",10,22,1,"px");
    range("Line spacing","lh",1.2,2,0.05,"x"); range("Letter spacing","ls",0,0.08,0.01,"em");
    sel("Row spacing","density",[["compact","Compact"],["comfortable","Comfortable"],["roomy","Roomy"]],()=>reflow());
    sel("Clock","clock",[["24","24-hour (14:30)"],["12","12-hour (2:30pm)"]],()=>renderAll());
    tog("Stripe alternate rows (easier to follow a row across)","zebra");
    tog("Reduce motion (no flashing or fades)","calm");
    tog("Show − / + buttons on Setup and Shoot times (untick to just type)","steppers");
    tog("Highlight rows the team are working in, in each person's badge colour","peerRows");
    const f2=h("div",{class:"form",id:"colourForm"});
    const pick=(label,key,cssVar)=>{const cur=()=>(P.tl||{})[key]||getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()||"#888888";
      const i=h("input",{type:"color",value:toHex(cur())});const def=h("button",{class:"btn small",title:"Back to the theme's colour"},"Theme default");
      i.addEventListener("input",()=>{P.tl=Object.assign({},P.tl,{[key]:i.value});applyDisplay()});i.addEventListener("change",savePrefs);
      def.onclick=()=>{P.tl=Object.assign({},P.tl,{[key]:""});savePrefs();applyDisplay();i.value=toHex(cur())};
      f2.append(h("label",{},label,h("span",{class:"toolbar"},i,def)))};
    pick("Timeline: setup","setup","--setup"); pick("Timeline: shooting","shoot","--shoot"); pick("Timeline: break / move","break","--break"); pick("Timeline: target wrap line","wrap","--bad");
    const bandSel=h("select",{});for(const [v,l] of BANDS)bandSel.append(h("option",{value:v},l));bandSel.value=BANDS.some(x=>x[0]===P.band)?P.band:"custom";
    const bandPick=h("input",{type:"color",value:/^#/.test(P.band||"")?P.band:"#2f4858"});
    const showPick=()=>{bandPick.style.display=bandSel.value==="custom"?"":"none"};showPick();
    bandSel.addEventListener("change",()=>{P.band=bandSel.value==="custom"?bandPick.value:bandSel.value;showPick();savePrefs();applyDisplay()});
    bandPick.addEventListener("input",()=>{P.band=bandPick.value;applyDisplay()});bandPick.addEventListener("change",savePrefs);
    f2.append(h("label",{},"Day banner colour (behind the day settings and filters)",h("span",{class:"toolbar"},bandSel,bandPick)));
    { const out=h("span",{},Math.round(P.bandMix)+"%");const i=h("input",{type:"range",min:"4",max:"40",step:"1",value:String(P.bandMix)});i.addEventListener("input",()=>{P.bandMix=Number(i.value);out.textContent=i.value+"%";applyDisplay()});i.addEventListener("change",savePrefs);f2.append(h("label",{},h("span",{},"Banner strength ",out),i)); }
    b.append(f,h("h3",{style:"margin-top:1.2rem"},"Timeline and banner colours"),h("p",{class:"note"},"Also just for you. They follow your colour theme until you pick your own."),f2,h("div",{class:"toolbar",style:"margin-top:1rem"},h("button",{class:"btn small",onclick:()=>{Object.assign(P,DISPLAY_DEFAULTS,{widths:{},colOrder:[],tl:{}});invalidateCols();savePrefs();applyDisplay();renderAll();renderSetTab()}},"Reset display")));
  }
  else if(setTab==="projects") renderProjectsTab(b);
  else if(setTab==="team"){
    if(MODE==="local"){
      b.append(h("p",{},"You're working on your own: everything is saved in this browser."),
        h("p",{class:"note"},"To work as a team, deploy this tool to Netlify (see Help > Working as a team), then open the team site and enter the team key. Projects you made here can be brought across with Settings > Projects > Export project file and Import into a new project."));
    }else{
      const f=h("div",{class:"form"});
      const nm=h("input",{value:P.name}); nm.addEventListener("change",()=>{P.name=nm.value.trim();savePrefs();renderPresence()});
      const poll=h("select",{}); for(const s of [2,3,5,10,20]) poll.append(h("option",{value:s},"every "+s+" seconds")); poll.value=String(P.poll);
      poll.addEventListener("change",()=>{P.poll=Number(poll.value);savePrefs()});
      f.append(h("label",{},"Your name (shown to the team)",nm),h("label",{},"Check for teammates' changes",poll));
      b.append(f,
        h("p",{class:"note",style:"margin-top:1rem"},`Status: ${$("#status").title||$("#status").textContent}. ${pending.length?pending.length+" change(s) waiting to send.":"Nothing waiting to send."}`),
        h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:()=>{syncNow();flush();toast("Checking now")}},"Sync now"),
          h("button",{class:"btn small danger",onclick:async()=>{if(pending.length&&!(await ask("Forget the team key?",`${pending.length} change(s) haven't reached the server yet. They stay on this device and send when you sign in again.`,"Forget key")))return;P.teamKey="";savePrefs();location.reload()}},"Forget team key on this device")));
    }
  }
}
function renderPrev(){
  const el=$("#namePrev"); if(!el) return;
  const d=D(); const r=d&&(d.rows.find(x=>x.type!=="break"&&(x.action||x.shot))||d.rows.find(x=>x.type!=="break"));
  el.textContent=r?("Example (take "+nextTake(r,d)+"): "+(shotName(r,d,nextTake(r,d))||"(every part is switched off)")):"Add a shot to this day to see an example name.";
}
async function renderProjectsTab(b){
  b.append(h("p",{class:"note"},MODE==="team"?"Projects on the team site. Everyone with the team key can open them.":"Projects saved in this browser."));
  const t=h("table",{class:"plain"}); t.append(h("thead",{},h("tr",{},h("th",{},"Project"),h("th",{},""),h("th",{},""))));
  const tb=h("tbody",{}); t.append(tb); b.append(t);
  try{await loadProjects()}catch(e){tb.append(h("tr",{},h("td",{colspan:3,class:"err"},"Couldn't load projects: "+e.message)))}
  const list=projects.filter(p=>!p.archived);
  for(const p of list){
    const cur=p.id===pid();
    tb.append(h("tr",{},h("td",{},h("b",{},p.name||p.id),cur?h("span",{class:"note"}," (open)"):null),
      h("td",{},cur?"":h("button",{class:"btn small",onclick:async()=>{await openProject(p.id);$("#setModal").classList.remove("open");toast("Opened "+(p.name||p.id))}},"Open")),
      h("td",{},cur?"":h("button",{class:"btn small danger",onclick:async()=>{if(!(await ask("Remove "+(p.name||p.id)+"?",MODE==="team"?"It's hidden for everyone, not erased: it can be restored from the archived list below.":"This deletes it from this browser. Export it first if you want a copy.","Remove")))return;
        if(MODE==="team"){await api("/api/projects",{action:"archive",id:p.id},{noProject:true})}else{const l=lsGet("shotlist2-projects",[]).filter(x=>x.id!==p.id);lsSet("shotlist2-projects",l);["base","seed","meta","pending"].forEach(k=>lsDel(PKEY(p.id,k)))}
        renderSetTab()}},"Remove"))));
  }
  const arch=projects.filter(p=>p.archived);
  if(arch.length){b.append(h("h3",{},"Archived"));for(const p of arch)b.append(h("div",{class:"toolbar"},h("span",{},p.name||p.id),h("button",{class:"btn small",onclick:async()=>{await api("/api/projects",{action:"restore",id:p.id},{noProject:true});renderSetTab()}},"Restore")))}
  b.append(h("h3",{},"New project"));
  const nm=h("input",{placeholder:"Project name",style:"max-width:18rem"});
  const make=async(from)=>{const name=nm.value.trim()||"Untitled project";commit();const seed=from==="copy"?Object.assign(docToSeed(S),{project:Object.assign(clone(S.project),{name})}):blankSeed(name,from==="settings"?S:null);
    seed.days.forEach(d=>{if(from==="copy"){d.id=uid("d");d.rows.forEach(r=>{r.id=uid("r")})}});(seed.people||[]).forEach(p=>{if(from==="copy")p.id=uid("p")});
    try{const id=await createProject(name,seed);await openProject(id);$("#setModal").classList.remove("open");toast("Created "+name)}catch(e){toast("Couldn't create it: "+e.message)}};
  b.append(h("div",{class:"toolbar"},nm,h("button",{class:"btn small primary",onclick:()=>make("blank")},"Blank"),h("button",{class:"btn small",title:"Keep project details, cast & crew, shot-name and default settings; no days",onclick:()=>make("settings")},"Same settings, no shots"),h("button",{class:"btn small",title:"Full copy of the open project",onclick:()=>make("copy")},"Copy of this project")));
  b.append(h("h3",{},"Files"));
  b.append(h("p",{class:"note"},"A project file holds everything: details, cast and crew, settings and every day. Use it as a backup, to move a project between browsers, or into the team site. Shotlist Builder project files and older Scheduler files can be imported too."));
  b.append(h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:saveFile},"Export project file"),h("button",{class:"btn small",onclick:()=>{importMode="new";$("#fileInput").value="";$("#fileInput").click()}},"Import as a new project"),h("button",{class:"btn small",onclick:()=>{importMode="replace";$("#fileInput").value="";$("#fileInput").click()}},"Import into this project (replace)")));
}

/* ===================== import / export ===================== */
let importMode="new";
function fileBase(){return (S.project.name||"Shotlist").replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"_")+"_"+new Date().toISOString().slice(0,10)}
function saveFile(){commit();download(fileBase()+".shotlist.json",JSON.stringify({app:"shotlist-scheduler",version:VERSION,saved:new Date().toISOString(),doc:S}),"application/json");toast("Exported "+fileBase()+".shotlist.json")}
function csvEsc(v){v=v==null?"":String(v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function exportCSV(){
  commit();
  const head=["Day","Kind","Date","Order","Type","Shot #","Shot name (last take)","Takes","Screen duration","Setup (min)","Setup from","Start","Shoot (min)","End","Original start","Action","Performer(s)","# Performers","Genre","Body","Face","Glove","Hero","Safety","Priority","Location / Setup","Description","Script / Dialogue","Shot type","Camera & lighting","VFX notes","Director notes","Prop / set notes","Shot (done)"];
  const customs=cols().filter(c=>c.custom); head.push(...customs.map(c=>c.label));
  const lines=[head.map(csvEsc).join(",")];
  for(const d of live()){const C=compute(d);d.rows.forEach((r,i)=>{const c=C.rows[r.id];const br=r.type==="break";const t=br?0:lastTake(r,d);
    lines.push([d.name,d.kind==="capture"?"Mocap":"Live Action",d.date||"",i+1,br?"Break/Move":"Shot",br?(r.label||"Break"):r.shot,br?"":shotName(r,d,t||null),br?"":(Number(r.takes)||0),br?"":r.duration,br?"":Math.round(c.su),br?"":hhmm(c.setupStart),hhmm(c.start),Math.round(c.sh),hhmm(c.end),r.origStart||"",
      br?"":r.action,br?"":r.performers,br?"":r.perfCount,br?"":r.genre,br?"":(isOn(r.body)?"Y":""),br?"":(isOn(r.face)?"Y":""),br?"":(isOn(r.glove)?"Y":""),br?"":r.hero,br?"":r.safety,br?"":r.priority,
      br?"":r.location,r.description||"",br?"":r.script,br?"":r.shotType,br?"":r.camera,br?"":r.vfx,br?"":r.director,br?"":r.props,br?"":(r.done?"Yes":""),...customs.map(cc=>br?"":(cc.type==="flag"?(isOn(r[cc.key])?"Y":""):(r[cc.key]??"")))].map(csvEsc).join(","))})}
  download(fileBase()+".csv","﻿"+lines.join("\r\n"),"text/csv");
}
function exportPeople(){const lines=[["Group","Name","Role","Phone","Email","Notes"].join(",")];for(const p of S.people)lines.push([p.group,p.name,p.role,p.phone,p.email,p.notes].map(csvEsc).join(","));download(fileBase()+"_cast_crew.csv","﻿"+lines.join("\r\n"),"text/csv")}
const ROW_BLANK={type:"shot",shot:"",label:"",duration:"",setup:0,shoot:0,origStart:"",origSetup:0,origShoot:0,location:"",description:"",script:"",shotType:"",camera:"",vfx:"",director:"",props:"",ref1:"",ref2:"",done:false,priority:"",perfCount:"",performers:"",genre:"",action:"",body:false,face:false,glove:false,hero:"",safety:"",takes:0,takeLog:null};
const DAY_BLANK={kind:"schedule",status:"",dayNo:null,date:"",call:"09:00",wrap:"18:00",setupPct:100,shootPct:100,minSetup:0,origWrap:null};
function normDoc(doc){
  const out={project:Object.assign({name:"",client:"",prodId:"",fps:"",dates:"",location:"",system:"",lead:"",notes:""},doc.project||{}),cfg:Object.assign({},CFG_DEFAULTS,doc.cfg||{}),people:(doc.people||[]).map(p=>Object.assign({id:uid("p"),group:"Crew",name:"",role:"",phone:"",email:"",notes:""},p)),cols:(doc.cols||[]).map(c=>Object.assign({id:uid("k").replace(/[^a-z0-9]/gi,""),label:"Column",type:"text",options:""},c)),days:[]};
  (doc.days||[]).forEach((d,i)=>out.days.push(Object.assign({},DAY_BLANK,d,{id:d.id||uid("d"),name:d.name||("Day "+(i+1)),rows:(d.rows||[]).map(r=>Object.assign({},ROW_BLANK,r,{id:r.id||uid("r")}))})));
  out.days.forEach(d=>{delete d.pos;d.rows.forEach(r=>delete r.pos)}); out.people.forEach(p=>delete p.pos); out.cols.forEach(c=>delete c.pos);
  return out;
}
function fromBuilder(j){
  const by=l=>(j.fields||[]).find(f=>String(f.label).toLowerCase()===l);
  const g=(r,l)=>{const f=by(l);return f?r.v&&r.v[f.id]!==undefined?r.v[f.id]:r[f.id]:undefined};
  const takeCount={}; const rows=[];
  for(const r of j.rows||[]){
    const action=String(g(r,"action")||"").trim(); if(!action&&!Object.keys(r.v||{}).length) continue;
    const key=action.toLowerCase(); takeCount[key]=(takeCount[key]||0)+1;
    const existing=rows.find(x=>x.action.toLowerCase()===key&&key);
    if(existing){existing.takes++;continue}
    const notes=["technical notes","capture notes","other notes","notes"].map(l=>g(r,l)).filter(Boolean).join("\n");
    rows.push(Object.assign({},ROW_BLANK,{id:uid("r"),action,performers:g(r,"performer(s)")||"",perfCount:g(r,"# of performers")||"",props:g(r,"prop")||"",genre:g(r,"genre")||"",
      body:isOn(g(r,"body")),face:isOn(g(r,"face")),glove:isOn(g(r,"glove")),hero:g(r,"hero")||"",safety:g(r,"safety")||"",priority:g(r,"priority")||"",director:notes,takes:0,setup:cfg().newSetup,shoot:cfg().newShoot}));
  }
  const pr=j.project||{};
  return normDoc({project:{name:pr.name||"Imported project",client:pr.client||"",prodId:pr.prodId||"",fps:pr.fps||"",dates:pr.date||"",location:pr.location||"",system:pr.system||"",lead:pr.lead||"",notes:pr.notes||""},
    days:[{id:uid("d"),name:"Mocap day",kind:"capture",dayNo:1,rows}]});
}
function parseProjectFile(j){
  if(j&&j.app==="shotlist-builder") return fromBuilder(j);
  if(j&&j.doc&&Array.isArray(j.doc.days)) return normDoc(j.doc);
  const st=j&&(j.state||j);
  if(st&&Array.isArray(st.days)) return normDoc({project:{name:st.title||"Imported project"},days:st.days});
  if(st&&Array.isArray(st.rows)) return normDoc({project:{name:st.title||"Imported project"},days:[{name:"Imported day",date:st.date,call:st.call,wrap:st.wrap,setupPct:st.setupPct,shootPct:st.shootPct,minSetup:st.minSetup,rows:st.rows}]});
  return null;
}
async function importFile(file){
  let doc=null;
  try{doc=parseProjectFile(JSON.parse(await file.text()))}catch(e){}
  if(!doc){toast("That isn't a project file this tool can read");return}
  if(importMode==="replace"){
    if(!(await ask("Replace this project?",MODE==="team"?"Everything in "+(S.project.name||"this project")+" is replaced for the whole team. You can Undo straight afterwards.":"Everything in "+(S.project.name||"this project")+" is replaced. You can Undo straight afterwards.","Replace")))return;
    commit(); S.project=doc.project; S.cfg=doc.cfg; S.people=doc.people; S.cols=doc.cols; S.days=doc.days; commit(); P.activeByProject[pid()]=S.days[0]&&S.days[0].id; renderAll(); toast("Imported into this project");
  }else{
    const name=doc.project.name||file.name.replace(/\..*$/,"");
    try{const id=await createProject(name,docToSeed(doc));await openProject(id);$("#setModal").classList.remove("open");toast("Imported "+name)}catch(e){toast("Couldn't import: "+e.message)}
  }
}

/* ===================== activity ===================== */
function describe(op){
  const val=(e,id,k)=>{const x=(base[e]||{})[id];return x&&x[k]?x[k].v:undefined};
  const keys=Object.keys(op.set||{});
  if(op.e==="doc"){const ks=keys.map(k=>k.replace(/^p_/,"project ").replace(/^cfg_/,"setting "));return "changed "+ks.join(", ")}
  if(op.e==="person"){const n=val("person",op.id,"name")||"someone";if(op.set._del===true)return "removed "+n+" from cast & crew";if(op.set._del===false&&keys.includes("name"))return "added "+(op.set.name||"a person")+" to cast & crew";return "updated "+n+" in cast & crew"}
  if(op.e==="day"){const n=val("day",op.id,"name")||"a day";if(op.set._del===true)return "deleted day "+n;if(op.set._del===false&&keys.includes("name"))return "added day "+(op.set.name||n);return n+": "+keys.filter(k=>k!=="pos").map(k=>({setupPct:"setup buffer",shootPct:"shoot buffer",minSetup:"min setup",dayNo:"day #"})[k]||k).join(", ")+(keys.includes("pos")?" (moved)":"")}
  const dayN=val("day",val("row",op.id,"day"),"name")||""; const lbl=val("row",op.id,"type")==="break"?(val("row",op.id,"label")||"break"):("shot "+(val("row",op.id,"shot")||val("row",op.id,"action")||"(unnamed)"));
  if(op.set._del===true) return `deleted ${lbl}${dayN?" on "+dayN:""}`;
  if(op.set._del===false&&keys.includes("type")) return `added ${lbl}${dayN?" on "+dayN:""}`;
  if(op.set._del===false) return `restored ${lbl}`;
  const parts=keys.filter(k=>k!=="pos").map(k=>{const v=op.set[k];const L=(colMap()[k]||{}).label||k;if(typeof v==="number"||typeof v==="boolean")return L+" "+(v===true?"ticked":v===false?"unticked":v);return L});
  if(keys.includes("pos")) parts.push("moved");
  return `${lbl}${dayN?" ("+dayN+")":""}: ${parts.join(", ")}`;
}
async function renderActivity(){
  const ul=$("#actList"); ul.innerHTML="";
  if(MODE!=="team"){$("#actNote").textContent="The activity log records who changed what on the team site. Working on your own, use Undo / Redo to step through your changes.";return}
  $("#actNote").textContent="Recent changes on this project, newest first. If two people change the same field, the later save is what everyone sees, and both show here.";
  let list=activity;
  try{const r=await api("/api/activity");const m=new Map(list.map(b=>[b.k,b]));(r.batches||[]).forEach(b=>m.set(b.k,b));list=[...m.values()]}catch(e){}
  list.sort((a,b)=>a.k<b.k?1:-1);
  for(const b of list.slice(0,120)){
    const when=new Date(b.at||Number(String(b.k).slice(0,13)));
    ul.append(h("li",{},h("div",{class:"meta"},`${b.by||"Someone"} · ${when.toLocaleString(undefined,{weekday:"short",hour:"2-digit",minute:"2-digit"})}`),...b.ops.slice(0,6).map(o=>h("div",{},describe(o))),b.ops.length>6?h("div",{class:"note"},`and ${b.ops.length-6} more`):null));
  }
  if(!list.length) ul.append(h("li",{class:"note"},"No changes yet."));
}

/* ===================== display ===================== */
const mq=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;
const FONTS={system:'-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  atkinson:'"Atkinson Hyperlegible", -apple-system, "Segoe UI", Arial, sans-serif', lexend:'"Lexend", -apple-system, "Segoe UI", Arial, sans-serif',
  serif:'Charter, "Iowan Old Style", Georgia, Cambria, "Times New Roman", serif', rounded:'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", Arial, sans-serif',
  mono:'ui-monospace, "SF Mono", Menlo, Consolas, monospace'};
const DARK_THEMES=["dark","dim","hcdark"];
function effTheme(){ return P.theme==="auto"?((mq&&mq.matches)?"dark":"light"):(P.theme||"light"); }
function applyDisplay(){
  const th=effTheme(), dark=DARK_THEMES.includes(th), root=document.documentElement;
  root.dataset.theme=th;
  root.style.setProperty("--ui",(Number(P.ui)||13)+"px");
  root.style.setProperty("--tbl",(Number(P.tbl)||13)+"px");
  root.style.setProperty("--lh",String(Number(P.lh)||1.35));
  root.style.setProperty("--ls",(Number(P.ls)||0)+"em");
  root.style.setProperty("--fw",String(Number(P.fw)||400));
  root.style.setProperty("--font",FONTS[P.font]||FONTS.system);
  if(P.accent){root.style.setProperty("--accent",P.accent);root.style.setProperty("--accent-soft",`color-mix(in srgb, ${P.accent} ${dark?28:14}%, var(--panel))`)}
  else{root.style.removeProperty("--accent");root.style.removeProperty("--accent-soft")}
  document.body.classList.toggle("compact",P.density==="compact");
  document.body.classList.toggle("roomy",P.density==="roomy");
  document.body.classList.toggle("zebra",!!P.zebra);
  document.body.classList.toggle("calm",!!P.calm);
  document.body.classList.toggle("nosteps",P.steppers===false);
  const tl=P.tl||{}; [["setup","--setup"],["shoot","--shoot"],["break","--break"],["wrap","--wrapc"]].forEach(([k,v])=>{if(tl[k])root.style.setProperty(v,tl[k]);else root.style.removeProperty(v)});
  const mix=Math.max(4,Math.min(40,Number(P.bandMix)||10));
  if(P.band==="none"){root.style.setProperty("--band","var(--bg)");root.style.setProperty("--band-line","var(--line)")}
  else{const hue=P.band||"var(--shoot)";const m=dark?Math.round(mix*1.5):mix;root.style.setProperty("--band",`color-mix(in srgb, ${hue} ${m}%, var(--bg))`);root.style.setProperty("--band-line",`color-mix(in srgb, ${hue} ${Math.min(60,m*2+6)}%, var(--line))`)}
  try{applyPeerRows()}catch(e){}
  $("#themeBtn").textContent=dark?"☀":"☾"; $("#themeBtn").title=dark?"Switch to a light theme":"Switch to a dark theme";
}
if(mq&&mq.addEventListener) mq.addEventListener("change",applyDisplay);

/*__XLSX__*/

/* ===================== start-up ===================== */
let NEEDS_KEY=false;
async function detectTeam(){
  if(!/^https?:$/.test(location.protocol)) return "local";
  try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),4000);const r=await fetch("/api/ping",{signal:ctl.signal,cache:"no-store"});clearTimeout(t);
    if(r.ok){const j=await r.json().catch(()=>null);if(j&&j.app==="shotlist-scheduler"){NEEDS_KEY=!!j.needsKey;P.needsKey=NEEDS_KEY;return "team"}return "local"}
    return P.wasTeam?"unreachable":"local";
  }catch(e){return P.wasTeam?"unreachable":"local"}
}
function needKey(msg){
  clearTimeout(syncTimer); clearTimeout(flushTimer);
  $("#joinName").value=P.name||""; $("#joinKey").value=""; $("#joinErr").textContent=msg||"";
  $("#joinKeyRow").style.display=NEEDS_KEY?"":"none"; $("#joinKeyNote").style.display=NEEDS_KEY?"":"none";
  $("#joinModal").classList.add("open"); updateStatus();
}
async function startTeam(){
  try{
    await loadProjects();
    const ok=projects.filter(p=>!p.archived);
    if(!P.projectId||!ok.some(p=>p.id===P.projectId)) P.projectId=(ok[0]||{}).id;
    $("#joinModal").classList.remove("open");
    P.wasTeam=true; savePrefs();
    await openProject(P.projectId);
  }catch(e){ if(e.status===401) needKey(e.message); else { netErr=e.message; backoff=4000; updateStatus(); toast("Can't reach the team site: "+e.message); setTimeout(startTeam,5000) } }
}
async function startLocal(){
  MODE="local"; await loadProjects();
  if(!projects.length){const id=await createProject("Untitled project",blankSeed("Untitled project"));P.projectId=id}
  if(!P.projectId||!projects.some(p=>p.id===P.projectId)) P.projectId=projects[0].id;
  await openProject(P.projectId);
}
async function boot(){
  applyDisplay();
  $("#verLabel").textContent="v"+VERSION; $("#helpVer").textContent="Version v"+VERSION;
  $("#changelog").append(...CHANGELOG.map(([v,d,t])=>h("li",{},h("b",{},"v"+v)," ("+d+") - "+t)));
  setTimeout(checkVersion,5000); setInterval(checkVersion,60000);
  const where=P.mode==="local-forced"?"local":await detectTeam();
  if(where==="unreachable"&&P.projectId){
    // used the team site on this device before: start from the saved copy and keep retrying
    MODE="team"; NEEDS_KEY=!!P.needsKey; netErr="Can't reach the team site"; backoff=4000;
    await openProject(P.projectId); toast("Can't reach the team site - showing your saved copy. Changes will send when it's back.");
    return;
  }
  if(where==="team"){
    MODE="team"; updateStatus();
    if((NEEDS_KEY&&!P.teamKey)||!P.name){needKey("");return}
    await startTeam();
  }else await startLocal();
}

/* ===================== wiring ===================== */
function bindDay(id,key,num){const el=$("#"+id);el.addEventListener("input",()=>{const d=D();if(!d)return;d[key]=num?(el.value===""?"":Number(el.value)):el.value;if(key==="name"){const b=$("#dayTabs .daytab.on");if(b){const sm=$("small",b);b.childNodes.forEach(n=>{if(n.nodeType===3)n.textContent=el.value||"Day"})}}recalc();if(key==="dayNo")$$("#grid tbody tr[data-id]").forEach(tr=>refreshNames(tr.dataset.id));softCommit()});el.addEventListener("change",()=>{const d=D();if(num&&/Pct$/.test(key)&&!(Number(el.value)>0)){d[key]=100;el.value=100}commit();if(key==="kind"){renderAll()}else{renderDayTabs();renderSettingsRow();recalc()}})}
bindDay("dayName","name");bindDay("dayKind","kind");bindDay("dayStatus","status");bindDay("dayNo","dayNo",true);bindDay("shootDate","date");bindDay("callTime","call");bindDay("wrapTime","wrap");
bindDay("setupPct","setupPct",true);bindDay("shootPct","shootPct",true);bindDay("minSetup","minSetup",true);
$("#viewMode").addEventListener("change",e=>{P.view=e.target.value;savePrefs();renderBody()});
$("#prioFilter").addEventListener("change",e=>{P.prioFilter=e.target.value;e.target.classList.toggle("on",!!P.prioFilter);savePrefs();renderBody()});
$("#dupDayBtn").onclick=()=>{commit();const c=clone(D());c.id=uid("d");c.name=(c.name||"Day")+" (copy)";c.rows.forEach(r=>{r.id=uid("r");r.done=false;r.takes=0});delete c.pos;S.days.splice(S.days.indexOf(D())+1,0,c);P.activeByProject[pid()]=c.id;commit();renderAll();toast("Copied day")};
$("#tlColours").onclick=e=>{e.preventDefault();openSettings("display");setTimeout(()=>{const f=$("#colourForm");if(f)f.scrollIntoView({block:"start"})},50)};
$("#moreBtn").onclick=()=>{const t=$("header.top");const o=t.classList.toggle("more-open");$("#moreBtn").setAttribute("aria-expanded",o);$("#moreBtn").textContent=o?"Less ▴":"More ▾"};
$("#bandToggle").onclick=()=>{const c=$("#dayControls");const o=c.classList.toggle("open");$("#bandToggle").setAttribute("aria-expanded",o);$("#bandArrow").textContent=o?"▴":"▾"};
// iPhone / iPad zoom into small inputs on tap; stop that without blocking pinch-zoom (iOS still allows pinch)
if(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)){const m=document.querySelector("meta[name=viewport]");if(m)m.content="width=device-width, initial-scale=1, maximum-scale=1"}
$("#archDayBtn").onclick=async()=>{const d=D();if(!d)return;if(!(await ask("Archive "+d.name+"?","The tab is put away for everyone. Nothing is deleted: restore it any time from the Archived tab at the end of the day tabs.","Archive day")))return;d.archived=true;P.activeByProject[pid()]=null;commit();savePrefs();renderAll();toast("Archived "+d.name+" - restore it from Archived")};
$("#resetBtn").onclick=async()=>{const d=D();const seed=await getSeed();const o=seed&&(seed.days||[]).find(x=>x.id===d.id);if(!o){toast("This day wasn't imported, so there's nothing to reset to");return}
  if(!(await ask("Reset "+d.name+"?","Puts this day back exactly as it was imported"+(MODE==="team"?", for everyone":"")+". Undo straight afterwards brings your version back.","Reset")))return;
  const n=normDoc({days:[o]}).days[0];n.id=d.id;S.days[S.days.indexOf(d)]=n;commit();renderAll();toast("Reset "+d.name+" - Undo to go back")};
$("#undoBtn").onclick=undo; $("#redoBtn").onclick=redo;
$("#csvBtn").onclick=exportCSV;
$("#impBtn").onclick=()=>{commit();$("#sheetInput").value="";$("#sheetInput").click()};
$("#sheetInput").addEventListener("change",e=>{const f=e.target.files[0];if(f)openImport(f)});
$("#impSheet").addEventListener("change",e=>setImpSheet(e.target.value));
$("#impHeader").addEventListener("change",e=>{IMP.header=Math.max(0,Math.min(IMP.rows.length-1,(Number(e.target.value)||1)-1));buildImpMap()});
["impGroup","impTakes","impDest"].forEach(id=>$("#"+id).addEventListener("change",updImpInfo));
$("#impGo").onclick=runImport;
$("#xlsxBtn").onclick=()=>{commit();openExport()};
$("#expGo").onclick=exportXlsx;
$("#updateGo").onclick=refreshForUpdate; $("#updateLater").onclick=()=>$("#updateBar").classList.remove("show");
document.addEventListener("dragover",e=>{if([...(e.dataTransfer||{}).types||[]].includes("Files"))e.preventDefault()});
document.addEventListener("drop",e=>{const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(!f)return;e.preventDefault();if(/\.json$/i.test(f.name)){importMode="new";importFile(f)}else openImport(f)}); $("#printBtn").onclick=()=>window.print();
// on paper, show cell values as plain text so nothing is clipped and long rows can run onto the next page
function printText(on){
  $$("#grid .pv").forEach(x=>x.remove());
  if(!on) return;
  $$("#grid tbody textarea.cell, #grid tbody input.cell, #grid tbody .mins input, #grid tbody select.cell").forEach(el=>{
    const v=el.tagName==="SELECT"?(el.selectedOptions[0]?el.selectedOptions[0].textContent:""):el.value;
    el.after(h("div",{class:"pv"+(el.classList.contains("shotno")?" shotno":"")},v||""));
  });
}
window.addEventListener("beforeprint",()=>{printWidths();printText(true)}); window.addEventListener("afterprint",()=>{printText(false);if(S)applyWidths()});
$("#ditBtn").onclick=()=>{commit();renderDit();$("#ditModal").classList.add("open")};
$("#ditShowDone").addEventListener("change",e=>{P.ditShowDone=e.target.checked;savePrefs();renderDit()});
$("#ditCopyAll").onclick=async()=>{const d=D();const list=[];for(const r of ditRows()){const b2=takeBase(r,d);for(let t=b2+1;t<=b2+(Number(r.takes)||0);t++){const n=shotName(r,d,t);if(n)list.push(n)}}if(!list.length){toast("No takes logged yet");return}await copyText(list.join("\n"));addOut(list.join("\n"),true);toast("Copied "+list.length+" names")};
$("#ditCopyNext").onclick=async()=>{const d=D();const list=ditRows().map(r=>shotName(r,d,nextTake(r,d))).filter(Boolean);if(!list.length){toast("Nothing to copy");return}await copyText(list.join("\n"));addOut(list.join("\n"),true);toast("Copied "+list.length+" names")};
$("#actBtn").onclick=()=>{$("#actModal").classList.add("open");renderActivity()};
$("#setBtn").onclick=()=>{commit();openSettings()};
$("#projTitle").onclick=()=>{commit();openSettings("project")};
$("#projTitle").style.cursor="pointer";
$("#themeBtn").onclick=()=>{const th=effTheme();if(DARK_THEMES.includes(th)){P.lastDark=th;P.theme=P.lastLight||"light"}else{P.lastLight=th;P.theme=P.lastDark||"dark"}savePrefs();applyDisplay();if($("#setModal").classList.contains("open")&&setTab==="display")renderSetTab()};
$("#helpBtn").onclick=()=>$("#helpModal").classList.add("open");
$$("[data-close]").forEach(b=>b.onclick=()=>b.closest(".modal").classList.remove("open"));
$$(".modal").forEach(m=>m.addEventListener("click",e=>{if((e.target===m&&!["joinModal","askModal"].includes(m.id))||m.id==="lightbox")m.classList.remove("open")}));
$("#colBtn").onclick=e=>{e.stopPropagation();renderCols();$("#colMenu").classList.toggle("open")};
document.addEventListener("click",e=>{if(!$("#colMenu").contains(e.target))$("#colMenu").classList.remove("open")});
$("#addShot").onclick=addShot; $("#addBreak").onclick=()=>D()&&insertBreakAt(D().rows.length);
$("#pasteBtn").onclick=()=>{$("#pasteText").value="";$("#pasteModal").classList.add("open");$("#pasteText").focus()};
$("#pasteGo").onclick=()=>{const lines=$("#pasteText").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);const d=D();if(!lines.length||!d)return;
  const counts={};lines.forEach(a=>{const k=a.toLowerCase();counts[k]=(counts[k]||0)+1});
  for(const a of Object.keys(counts).length===lines.length?lines:[...new Set(lines.map(x=>x))]) d.rows.push(newShot({action:a,description:d.kind==="capture"?"":a}));
  commit();renderBody();$("#pasteModal").classList.remove("open");toast("Added "+lines.length+" shot"+(lines.length>1?"s":""))};
$("#fileInput").addEventListener("change",e=>{const f=e.target.files[0];if(f)importFile(f)});
$("#imgInput").addEventListener("change",e=>{const f=e.target.files[0];if(!f||!imgTarget)return;const tgt=imgTarget;imgTarget=null;const img=new Image();const rd=new FileReader();
  rd.onload=()=>{img.onload=async()=>{const sc=Math.min(1,640/img.width,420/img.height);const cv=document.createElement("canvas");cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
    let ref=cv.toDataURL("image/jpeg",.78);
    if(MODE==="team"){try{ref=(await api("/api/image",{data:ref},{noProject:true})).ref}catch(err){toast("Couldn't upload the image: "+err.message);return}}
    const x=R(tgt.id);if(!x)return;x[tgt.key]=ref;commit();renderBody()};img.src=rd.result};rd.readAsDataURL(f)});
$("#joinGo").onclick=async()=>{const name=$("#joinName").value.trim(),key=$("#joinKey").value.trim();if(!name){$("#joinErr").textContent="Add your name so the team can see who's editing.";return}if(NEEDS_KEY&&!key){$("#joinErr").textContent="Enter the team key.";return}
  P.name=name;P.teamKey=key;P.mode=null;savePrefs();$("#joinErr").textContent="Checking…";
  try{await api("/api/projects",undefined,{noProject:true});$("#joinErr").textContent="";await startTeam()}catch(e){$("#joinErr").textContent=e.message}};
$("#joinKey").addEventListener("keydown",e=>{if(e.key==="Enter")$("#joinGo").click()});
$("#joinLocal").onclick=async()=>{P.mode="local-forced";savePrefs();$("#joinModal").classList.remove("open");await startLocal();toast("Working offline in this browser. Settings > Team & sync explains how to join later.")};
document.addEventListener("keydown",e=>{
  if(e.key==="Escape") $$(".modal.open").forEach(m=>{if(!["joinModal"].includes(m.id))m.classList.remove("open")});
  const tag=(document.activeElement||{}).tagName; if(tag==="TEXTAREA"||tag==="INPUT"||tag==="SELECT") return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}
});
document.addEventListener("visibilitychange",()=>{if(MODE==="team"&&!document.hidden){scheduleSync(100)}});
window.addEventListener("online",()=>{if(MODE==="team"){backoff=0;scheduleFlush(100);scheduleSync(200)}});
window.addEventListener("beforeunload",e=>{commit();if(MODE==="team"&&pending.length){e.preventDefault();e.returnValue=""}});

boot();
