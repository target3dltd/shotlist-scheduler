/* ===================== spreadsheets: import (.xlsx / .csv) and tracker export (.xlsx) ===================== */
let excelLoading=null;
function loadExcel(){
  if(window.ExcelJS) return Promise.resolve();
  if(excelLoading) return excelLoading;
  const tryLoad=src=>new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=()=>window.ExcelJS?res():rej(new Error("no ExcelJS"));s.onerror=()=>{s.remove();rej(new Error("load failed"))};document.head.append(s)});
  // the team site hosts its own copy; the standalone file falls back to the public CDN
  excelLoading=tryLoad("vendor/exceljs.min.js").catch(()=>tryLoad("https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js")).catch(e=>{excelLoading=null;throw new Error("The spreadsheet library couldn't load. Check your connection and try again.")});
  return excelLoading;
}

/* ---------- reading ---------- */
function cellText(v){
  if(v==null) return "";
  if(v instanceof Date){
    const base=Date.UTC(1899,11,30);
    if(Math.abs(v.getTime()-base)<86400000) return String(v.getUTCHours()).padStart(2,"0")+":"+String(v.getUTCMinutes()).padStart(2,"0");
    return v.toISOString().slice(0,10);
  }
  if(typeof v==="object"){
    if(v.richText) return v.richText.map(x=>x.text).join("");
    if("result" in v) return cellText(v.result);
    if(v.text!=null) return cellText(v.text);
    if(v.error) return "";
    return "";
  }
  return v;
}
function parseCSV(text){
  text=text.replace(/^﻿/,"");
  const first=text.split(/\r?\n/)[0]||"";
  const delim=[",","\t",";"].map(d=>[d,first.split(d).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],cur="",q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++} else q=false } else cur+=c; }
    else if(c==='"') q=true;
    else if(c===delim){row.push(cur);cur=""}
    else if(c==="\n"||c==="\r"){ if(c==="\r"&&text[i+1]==="\n")i++; row.push(cur);rows.push(row);row=[];cur="" }
    else cur+=c;
  }
  if(cur!==""||row.length){row.push(cur);rows.push(row)}
  return rows.filter(r=>r.some(x=>String(x).trim()!==""));
}
let fflateLoading=null;
function loadFflate(){
  if(window.fflate) return Promise.resolve(window.fflate);
  if(!fflateLoading) fflateLoading=new Promise((res,rej)=>{const s=document.createElement("script");s.src="vendor/fflate.min.js";s.onload=()=>res(window.fflate);
    s.onerror=()=>{const t=document.createElement("script");t.src="https://cdn.jsdelivr.net/npm/fflate@0.8.3/umd/index.js";t.onload=()=>res(window.fflate);t.onerror=()=>{fflateLoading=null;rej(new Error("couldn't load"))};document.head.append(t)};document.head.append(s)});
  return fflateLoading;
}
// { sheetName: [{row, col, data}] } for every picture anchored on a sheet (rows and columns counted from 1)
async function xlsxPictures(buf){
  const ff=await loadFflate(); const z=ff.unzipSync(buf), td=new TextDecoder();
  const txt=p=>z[p]?td.decode(z[p]):"", xml=p=>new DOMParser().parseFromString(txt(p)||"<x/>","application/xml");
  const rels=p=>{const out={};const d=xml(p);for(const r of d.getElementsByTagName("Relationship"))out[r.getAttribute("Id")]=r.getAttribute("Target");return out};
  const resolve=(base,t)=>{if(t.startsWith("/"))return t.slice(1);const parts=base.split("/");parts.pop();for(const seg of t.split("/")){if(seg==="..")parts.pop();else if(seg!==".")parts.push(seg)}return parts.join("/")};
  const relsOf=p=>{const i=p.lastIndexOf("/");return p.slice(0,i)+"/_rels/"+p.slice(i+1)+".rels"};
  const wbRels=rels("xl/_rels/workbook.xml.rels"), out={};
  for(const sh of xml("xl/workbook.xml").getElementsByTagName("sheet")){
    const rid=sh.getAttribute("r:id")||sh.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id"); if(!wbRels[rid]) continue;
    const sp=resolve("xl/workbook.xml",wbRels[rid]), sr=rels(relsOf(sp)), list=[];
    for(const dr of xml(sp).getElementsByTagName("drawing")){
      const drid=dr.getAttribute("r:id")||dr.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id"); if(!sr[drid]) continue;
      const dp=resolve(sp,sr[drid]), drel=rels(relsOf(dp)), dd=xml(dp);
      for(const a of [...dd.getElementsByTagNameNS("*","oneCellAnchor"),...dd.getElementsByTagNameNS("*","twoCellAnchor"),...dd.getElementsByTagNameNS("*","absoluteAnchor")]){
        const from=a.getElementsByTagNameNS("*","from")[0]; const blip=a.getElementsByTagNameNS("*","blip")[0]; if(!blip) continue;
        const emb=blip.getAttribute("r:embed")||blip.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","embed"); if(!drel[emb]) continue;
        const mp=resolve(dp,drel[emb]); if(!z[mp]) continue;
        const row=from?Number(from.getElementsByTagNameNS("*","row")[0].textContent)+1:1, col=from?Number(from.getElementsByTagNameNS("*","col")[0].textContent)+1:1;
        list.push({row,col,data:bytesToDataUrl(z[mp],(mp.split(".").pop()||"png"))});
      }
    }
    list.sort((a,b)=>a.row-b.row||a.col-b.col); out[sh.getAttribute("name")]=list;
  }
  return out;
}
// the same workbook with its drawings removed, for when the spreadsheet library can't cope with them
async function xlsxWithoutDrawings(buf){
  const ff=await loadFflate(); const z=ff.unzipSync(buf), td=new TextDecoder(), te=new TextEncoder(); const out={};
  for(const [p,v] of Object.entries(z)){
    if(/^xl\/drawings\//.test(p)||/^xl\/media\//.test(p)) continue;
    if(/^xl\/worksheets\/sheet[^/]*\.xml$/.test(p)){ out[p]=te.encode(td.decode(v).replace(/<(\w+:)?drawing\b[^>]*\/>/g,"").replace(/<(\w+:)?legacyDrawing\b[^>]*\/>/g,"")); continue; }
    if(/^xl\/worksheets\/_rels\//.test(p)){ out[p]=te.encode(td.decode(v).replace(/<Relationship\b[^>]*Type="[^"]*\/(drawing|vmlDrawing)"[^>]*\/>/g,"")); continue; }
    if(p==="[Content_Types].xml"){ out[p]=te.encode(td.decode(v).replace(/<Override\b[^>]*PartName="\/xl\/drawings\/[^"]*"[^>]*\/>/g,"")); continue; }
    out[p]=v;
  }
  return ff.zipSync(out);
}
function bytesToDataUrl(buf,ext){
  const u=buf instanceof Uint8Array?buf:new Uint8Array(buf.buffer?buf.buffer.slice(buf.byteOffset||0,(buf.byteOffset||0)+buf.byteLength):buf);
  let s=""; for(let i=0;i<u.length;i+=0x8000) s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));
  const e=String(ext||"png").toLowerCase().replace("jpg","jpeg"); return `data:image/${e};base64,`+btoa(s);
}
// any picture reference as a data: URL (an uploaded picture is fetched from this project)
async function refToDataUrl(ref){
  ref=String(ref||""); if(!ref) return ""; if(ref.startsWith("data:")) return ref;
  if(!ref.startsWith("img:")) return "";
  try{ const r=await fetch("/api/image?k="+encodeURIComponent(ref.slice(4))+"&p="+encodeURIComponent(pid()),{headers:keyHeaders()}); if(!r.ok) return "";
    const b=await r.blob(); return await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>res("");fr.readAsDataURL(b)}); }catch(e){ return ""; }
}
async function shrinkDataUrl(du){
  try{ const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=du}); return finishPicture(img).data; }catch(e){ return du; }
}
// a picture brought in from a file: shrunk, and uploaded to the open project on the team site
async function storePicture(du){ const s=await shrinkDataUrl(du); return MODE==="team"?(await api("/api/image",{data:s})).ref:s; }
// pictures waiting in a not-yet-created project are taken out, then put back once it's open
function takeDataRefs(days){ const pend=[]; for(const d of days) for(const r of d.rows) for(const k of ["ref1","ref2","ref3","scribble"]) if(String(r[k]||"").startsWith("data:")){pend.push({rid:r.id,k,data:r[k]});r[k]="";} return pend; }
async function putDataRefs(pend){
  if(!pend.length) return; let n=0, failed=0;
  // upload them all first, then set them in one go (the project may still be loading while they upload)
  for(const p of pend){ toast(`Adding pictures: ${++n} of ${pend.length}…`); try{ p.ref=await storePicture(p.data); }catch(e){ failed++; } }
  for(const p of pend){ if(!p.ref) continue; const x=R(p.rid); if(x) x[p.k]=p.ref; }
  commit(); renderAll(); toast(`Added ${pend.length-failed} picture${pend.length-failed===1?"":"s"}`+(failed?`; ${failed} couldn't be added`:""));
}
async function readSheets(file){
  const name=file.name.toLowerCase();
  if(/\.(csv|tsv|txt)$/.test(name)) return [{name:file.name.replace(/\.[^.]+$/,""),rows:parseCSV(await file.text())}];
  if(!/\.(xlsx|xlsm)$/.test(name)) throw new Error("Save it as .xlsx or .csv first (from Google Sheets: File > Download).");
  await loadExcel();
  const buf=new Uint8Array(await file.arrayBuffer());
  // pictures are read straight from the file (sturdier than the spreadsheet library, which can trip over drawings)
  let pics=null; try{ pics=await xlsxPictures(buf); }catch(e){ pics=null; }
  const wb=new ExcelJS.Workbook();
  try{ await wb.xlsx.load(buf); }
  catch(e){ // try again without the drawings; the pictures were already read above
    let stripped=null; try{ stripped=await xlsxWithoutDrawings(buf); }catch(e2){}
    if(!stripped) throw e; await wb.xlsx.load(stripped);
  }
  return wb.worksheets.map(ws=>{
    const rows=[], nums=[]; ws.eachRow({includeEmpty:false},(row)=>{const vals=row.values.slice(1).map(cellText);if(vals.some(x=>String(x).trim()!=="")){rows.push(vals);nums.push(row.number)}});
    // pictures placed on the sheet go with their row (a picture on a row of its own goes with the row above)
    for(const p of (pics&&pics[ws.name])||[]){
      let idx=-1; for(let i=0;i<nums.length;i++) if(nums[i]<=p.row) idx=i; if(idx<0) continue;
      (rows[idx].__imgs=rows[idx].__imgs||[]).push(p);
    }
    rows.forEach(r=>{if(r.__imgs)r.__imgs.sort((a,b)=>a.row-b.row||a.col-b.col)});
    return {name:ws.name,rows};
  });
}

/* ---------- mapping ---------- */
const BASE_IMPORT_TARGETS=[
  ["ignore","Ignore"],["shot","Shot #"],["take","Take # (groups retakes)"],["shootDay","Shoot day (one day per value)"],
  ["action","Action"],["description","Description"],["performers","Performer(s)"],["perfCount","# Of performers"],["props","Prop / set notes"],
  ["genre","Genre"],["body","Body"],["face","Face"],["glove","Glove"],["hero","Hero"],["safety","Safety"],["priority","Priority"],
  ["done","Shot? / done"],["setup","Setup (min)"],["shoot","Shoot (min)"],["origStart","Planned start time"],["duration","Screen duration"],
  ["heroUrl","Hero link"],["safetyUrl","Safety link"],["location","Location / Setup"],["script","Script / Dialogue"],["shotType","Shot type"],["camera","Camera"],["lighting","Lighting"],["vfx","VFX notes"],["director","Director notes"],
  ["label","Break name"],["rowType","Row type (Shot / Break)"],["status","Status (CUT cuts the shot; other words set the priority)"]
];
function importTargets(){
  const extra=IMP&&IMP.app?[["rid","App row link (keeps days exact)"]]:[];
  const custom=cols().filter(c=>c.custom).map(c=>[c.key,c.label+" (your column)"]);
  const relabel=([k,l])=>{const c=colMap()[k];return [k,c&&c.label!==c.base&&!c.custom?`${c.label} (${l})`:l]};
  return [...BASE_IMPORT_TARGETS.map(relabel),...extra,...custom,["new","+ New column (named after the heading)"]];
}
const APPEND_TARGETS=["director","vfx","camera","lighting","location","props","script","description"];
const IMPORT_SYN={
  shot:["shot #","shot","shot no","shot number","shot#","sc/shot","scene/shot"],
  take:["take #","take","take no","take#","tk"],
  shootDay:["shoot day","day","shooting day","day #"],
  action:["action","shot name","task","move","action name","name"],
  description:["description","desc"],
  performers:["performer(s)","performers","performer","actor","actors","talent","cast"],
  perfCount:["# of performers","# performers","no. of performers","performer count","num performers"],
  props:["prop","props","prop / set design notes","prop / set notes","set notes"],
  genre:["genre"],body:["body"],face:["face"],glove:["glove","gloves"],hero:["hero"],safety:["safety"],heroUrl:["hero link","hero url","hero file"],safetyUrl:["safety link","safety url","safety file"],priority:["priority","pri"],
  done:["shot?","done","shot (done)","complete","completed"],
  setup:["time to setup","setup","setup (min)","setup mins"],shoot:["time to shoot","shoot","shoot (min)","shoot mins"],
  origStart:["start shooting","start","start time","planned start","original start"],duration:["duration","screen dur.","screen duration"],
  location:["location and setup","location / setup","location","capture"],script:["script / dialogue","script","dialogue"],
  shotType:["shot type","shot size","framing","shot size / framing","shot size/framing"],camera:["camera & lighting notes","camera & lighting","camera","camera notes","technical notes"],lighting:["lighting","lighting notes","lights","lx"],
  vfx:["vfx notes","vfx","gs process?","capture notes","mocap notes"],director:["director notes","notes","other notes","comments","comment"],
  rowType:["type","row type"],
  status:["status","hero shot","shot status","cut?","in / out","in/out","omit","omitted"]
};
const IMPORT_SKIP=["shot id","totals","seconds (tc)","frame range","seconds (frames)","shoot/production id","frame rate","tc in","tc out","frame start","frame end","storyboard / ref image","alternate reference","shot name (app)","shot name (last take)","video export","mocap export","m&t process?","post filter?","m&t export","gs export","order","end","setup from","calculated end","kind","date","takes"];
const normH=s=>String(s==null?"":s).toLowerCase().replace(/\s+/g," ").trim();
function guessTarget(h,used){
  const n=normH(h); if(!n) return "ignore";
  for(const c of cols()){ if(!c.label||c.fixed&&c.key!=="shot") continue; if(normH(c.label)===n&&(c.custom||c.label!==c.base)&&!used.has(c.key)) return c.key; }
  // a renamed heading still finds its column: "Shot size / framing [TBC]" and "Shot size / framing" are the same
  const loose=s=>normH(s).replace(/\[[^\]]*\]|\([^)]*\)/g,"").replace(/[^a-z0-9]+/g," ").trim();
  for(const c of cols()){ if(!c.custom||used.has(c.key)) continue; if(loose(c.label)&&loose(c.label)===loose(h)) return c.key; }
  if(IMPORT_SKIP.includes(n)) return "ignore";
  for(const [k,list] of Object.entries(IMPORT_SYN)) if(list.includes(n)&&(!used.has(k)||APPEND_TARGETS.includes(k))) return k;
  return "new";
}
function detectHeader(rows){
  // the row that names the shot number column wins (sheets often have a key or title row above the headings)
  for(let i=0;i<Math.min(rows.length,15);i++) if(rows[i].some(c=>IMPORT_SYN.shot.includes(normH(c)))) return i;
  for(let i=0;i<Math.min(rows.length,15);i++){const strs=rows[i].filter(c=>typeof c==="string"&&c.trim()&&isNaN(c)).length;if(strs>=2)return i}
  return 0;
}
function parseMinutes(v){
  if(v===""||v==null) return null; if(typeof v==="number") return Math.round(v<1&&v>0?v*1440:v);
  const s=String(v).toLowerCase().trim(); if(!s) return null;
  let m=0,hit=false; const hm=s.match(/(\d+(?:\.\d+)?)\s*h/); const mm=s.match(/(\d+(?:\.\d+)?)\s*m/);
  if(hm){m+=parseFloat(hm[1])*60;hit=true} if(mm){m+=parseFloat(mm[1]);hit=true}
  if(!hit){const c=s.match(/^(\d+):(\d{2})$/);if(c)return Number(c[1])*60+Number(c[2]);const n=parseFloat(s);return isNaN(n)?null:Math.round(n)}
  return Math.round(m);
}
let IMP=null;
async function openImport(file){
  try{
    const sheets=await readSheets(file);
    if(!sheets.length) throw new Error("That file has no data.");
    // prefer a shot list tab, and its newest version (v002 over the unversioned original)
    const ver=s=>{const m=s.name.match(/v\s*0*(\d+)/i);return m?Number(m[1]):0};
    const shotTabs=sheets.filter(s=>/shot/i.test(s.name)&&s.rows.length>1).sort((a,b)=>ver(b)-ver(a));
    const pick=shotTabs[0]||sheets.find(s=>/list|schedule|table/i.test(s.name)&&s.rows.length>1)||sheets.slice().sort((a,b)=>b.rows.length-a.rows.length)[0];
    IMP={file:file.name,sheets,proj:sheets.find(s=>s.name==="Project"),app:null};
    const ad=sheets.find(s=>s.name==="App data");
    if(ad){try{const j=JSON.parse(ad.rows.slice(1).map(r=>String(r[0]??"")).join(""));if(j&&j.app==="shotlist-scheduler"&&Array.isArray(j.days))IMP.app=j}catch(e){}}
    const opt=$("#impDest option[value=restore]"); if(opt) opt.remove();
    if(IMP.app) $("#impDest").prepend(h("option",{value:"restore"},`the days as exported (${IMP.app.days.map(d=>d.name).join(", ")}: names, kinds, times and every field kept)`));
    $("#impModal").classList.add("open");
    $("#impSheet").innerHTML=""; sheets.forEach(s=>$("#impSheet").append(h("option",{value:s.name},`${s.name} (${s.rows.length} rows)`)));
    $("#impSheet").value=pick.name; setImpSheet(pick.name);
  }catch(e){toast(e.message||"That file couldn't be read")}
}
function setImpSheet(name){
  IMP.sheet=name; IMP.rows=IMP.sheets.find(s=>s.name===name).rows; IMP.header=detectHeader(IMP.rows);
  $("#impHeader").value=IMP.header+1; buildImpMap();
}
function impDataRows(){return IMP.rows.slice(IMP.header+1).filter(r=>normH(r.find(c=>String(c).trim()!==""))!=="totals")}
function buildImpMap(){
  const hdr=IMP.rows[IMP.header]||[], body=impDataRows();
  const width=Math.max(hdr.length,...body.slice(0,50).map(r=>r.length),0);
  const used=new Set(); IMP.map=[];
  for(let c=0;c<width;c++){
    const head=String(hdr[c]??"").trim()||`Column ${c+1}`;
    let t=normH(hdr[c])==="app row id"?(IMP.app?"rid":"ignore"):guessTarget(hdr[c],used); if(t!=="ignore") used.add(t);
    if(!body.some(r=>String(r[c]??"").trim()!=="")) t="ignore";
    if(t==="new"&&!String(hdr[c]??"").trim()) t="ignore";
    IMP.map.push({h:head,t,sample:String((body.find(r=>String(r[c]??"").trim()!=="")||[])[c]??"")});
  }
  const tb=$("#impMap"); tb.innerHTML="";
  IMP.map.forEach((m,i)=>{
    const s=h("select",{"data-mi":i}); importTargets().forEach(([v,l])=>s.append(h("option",{value:v},l))); s.value=m.t;
    s.addEventListener("change",()=>{IMP.map[i].t=s.value;updImpInfo()});
    tb.append(h("tr",{},h("td",{},h("b",{},m.h)),h("td",{class:"note",style:"max-width:16rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",title:m.sample},m.sample),h("td",{},s)));
  });
  const has=k=>IMP.map.some(m=>m.t===k);
  $("#impTakes").checked=has("take")||has("hero")||has("safety");
  // most of the sheet's shot numbers are already in this project: it's a revised list, so update rather than add
  let matchShare=0; { const ci=IMP.map.findIndex(m=>m.t==="shot"); if(ci>=0&&S){ const have=new Set(); live().forEach(d=>d.rows.forEach(r=>{if(!isBlock(r)&&normShot(r.shot))have.add(normShot(r.shot))}));
    const nums=impDataRows().map(r=>normShot(r[ci])).filter(Boolean); if(nums.length&&have.size) matchShare=nums.filter(n=>have.has(n)).length/nums.length; } }
  $("#impDest").value=IMP.app&&has("rid")?"restore":has("shootDay")?"bydays":matchShare>=0.5?"update":(S&&D()&&D().rows.length?"newday":"append");
  updImpInfo();
}
function updImpInfo(){
  const has=k=>IMP.map.some(m=>m.t===k);
  const recs=impRecords();
  const groups=groupImport(recs);
  const days=[...new Set(groups.map(g=>g.day))];
  $("#impInfo").textContent=`${IMP.file} · ${recs.length} row${recs.length===1?"":"s"} found`+
    ($("#impGroup").checked?` · ${groups.length} shot${groups.length===1?"":"s"} after grouping retakes`:"")+
    ($("#impDest").value==="bydays"?(has("shootDay")?` · ${days.length} day${days.length===1?"":"s"}`:" · map a column to Shoot day to split by day"):"")+
    (!has("action")&&!has("shot")?" · no column is mapped to Action or Shot #, so names will be blank until you fill them in":"");
  $("#impGo").disabled=!recs.length;
}
function impRecords(){
  const out=[];
  for(const r of impDataRows()){
    const rec={f:{},take:null,day:null,brk:false,imgs:(r.__imgs||[]).map(x=>x.data)};
    let any=rec.imgs.length>0;
    IMP.map.forEach((m,c)=>{
      if(m.t==="ignore") return; const raw=r[c]; const v=typeof raw==="string"?raw.trim():raw;
      if(v===""||v==null) return;
      if(m.t==="rid"){rec.rid=String(v);return}
      if(m.t==="take"){const n=parseInt(v,10);if(!isNaN(n))rec.take=n;return}
      if(m.t==="shootDay"){rec.day=String(v);return}
      if(m.t==="status"){rec.f.__status=String(v).trim();any=true;return}
      if(m.t==="rowType"){const t=String(v);rec.tech=/tech|turn\s*-?around|reset|re-?rig/i.test(t);rec.brk=rec.tech||/break|move|lunch/i.test(t);return}
      // a row only counts if it carries real content: pre-built blank tracker rows have just a number and 0/FALSE ticks
      if(!["shot","perfCount","body","face","glove","done","setup","shoot"].includes(m.t)) any=true;
      if(["setup","shoot"].includes(m.t)&&parseMinutes(v)>0) any=true;
      if(m.t==="new"){rec.f["new:"+c]=v;return}
      if(String(m.t).startsWith("c_")){const cc=colMap()[m.t]||{};rec.f[m.t]=cc.type==="flag"?isOn(v):cc.type==="number"&&!isNaN(Number(v))?Number(v):String(v);return}
      if(["body","face","glove","done"].includes(m.t)) rec.f[m.t]=isOn(v);
      else if(m.t==="setup"||m.t==="shoot") rec.f[m.t]=parseMinutes(v);
      else if(m.t==="perfCount"){const n=Number(v);rec.f.perfCount=isNaN(n)?String(v):n}
      else if(APPEND_TARGETS.includes(m.t)&&rec.f[m.t]) rec.f[m.t]+="\n"+v;
      else rec.f[m.t]=typeof v==="number"&&["shot","origStart","duration"].includes(m.t)?String(v):v;
    });
    if(any) out.push(rec);
  }
  return out;
}
function groupImport(recs){
  const doGroup=$("#impGroup").checked;
  const key=r=>normH(r.f.shot)+"|"+normH(r.f.action||(!r.f.shot?r.f.description:""));
  const groups=[];
  for(const r of recs){
    const last=groups[groups.length-1];
    if(doGroup&&!r.brk&&last&&!last.recs[0].brk&&last.day===r.day&&key(last.recs[0])===key(r)&&key(r)!=="|") last.recs.push(r);
    else groups.push({day:r.day,recs:[r]});
  }
  return groups;
}
function groupToRow(g,recorded,kindCapture){
  const first=g.recs[0].f, row=Object.assign({},ROW_BLANK,{id:uid("r")});
  for(const k of Object.keys(first)) row[k]=first[k];
  [...new Set(g.recs.flatMap(r=>r.imgs||[]).filter(Boolean))].slice(0,3).forEach((d,i)=>{row["ref"+(i+1)]=d});
  // merge text from later takes, collect per-take hero / safety / NG marks
  const tn=(r,i)=>r.take!=null?r.take:i+1;
  const marks={hero:[],safety:[],ng:[],test:[]};
  g.recs.forEach((r,i)=>{
    for(const k of APPEND_TARGETS){const v=r.f[k];if(i>0&&v&&!String(row[k]||"").includes(String(v)))row[k]=(row[k]?row[k]+"\n":"")+v}
    const hv=String(r.f.hero||"").trim(), sv=String(r.f.safety||"").trim();
    if(/^x$/i.test(hv))marks.hero.push("T"+tn(r,i)); else if(/^ng$/i.test(hv))marks.ng.push("T"+tn(r,i)); else if(/^test$/i.test(hv))marks.test.push("T"+tn(r,i));
    if(/^x$/i.test(sv))marks.safety.push("T"+tn(r,i));
    if(r.f.done) row.done=true;
  });
  const markish=v=>/^(x|ng|test)$/i.test(String(v||"").trim());
  if(markish(row.hero)) row.hero=""; if(markish(row.safety)) row.safety="";
  const bits=[];
  if(marks.hero.length)bits.push("Hero: "+marks.hero.join(", ")); if(marks.safety.length)bits.push("Safety: "+marks.safety.join(", "));
  if(marks.ng.length)bits.push("NG: "+marks.ng.join(", ")); if(marks.test.length)bits.push("Test: "+marks.test.join(", "));
  if(g.recs.length>1||bits.length) row.director=[g.recs.length>1?`${g.recs.length} rows imported as takes`:"",bits.join(". "),row.director].filter(Boolean).join(". ");
  row.takes=recorded?g.recs.length:0;
  if(recorded&&!("done" in first)) row.done=true;
  if(row.setup==null) row.setup=0; if(row.shoot==null) row.shoot=0;
  for(const k of Object.keys(row)) if(k.startsWith("new:")) delete row[k];
  if(g.recs[0].brk||(row.label&&!row.action&&!row.shot&&!row.description)){row.type=g.recs[0].tech||/\b(tech|turn\s*-?around|reset)\b/i.test(row.label||row.shot||"")?"tech":"break";row.label=row.label||row.shot||"Break";row.shot="";row.takes=0;row.done=false;}
  if(!kindCapture&&!row.description&&row.action) row.description=row.action;
  if("__status" in row){ const st=String(row.__status||"").trim(); delete row.__status;
    if(isCutWord(st)) row.cut=true; else if(st&&!g.recs[0].f.priority) row.priority=st; }
  return row;
}
// rebuild the exported days: each shot starts from its saved copy, then takes whatever was edited in the Shotlist tab
function restoreDays(recs,recorded,colRemap){
  const byRid=new Map(), loose=[];
  for(const r of recs){ if(r.rid){ if(!byRid.has(r.rid)) byRid.set(r.rid,[]); byRid.get(r.rid).push(r); } else loose.push(r); }
  const SKIP=new Set(["origStart","takes"]);   // "Planned start" in the sheet is the calculated time, not the original plan
  const remapKeys=o=>{const out={};for(const [k,v] of Object.entries(o)){out[colRemap[k]||k]=v}return out};
  const days=[];
  for(const ad of IMP.app.days){
    const d=Object.assign({},DAY_BLANK,{});
    for(const k of DAY_FIELDS) if(ad[k]!==undefined&&ad[k]!==null) d[k]=ad[k];
    d.id=uid("d"); d.archived=null; d.rows=[];
    for(const sr of ad.rows||[]){
      if(isBlock(sr)){ d.rows.push(Object.assign(remapKeys(sr),{id:uid("r")})); continue; }
      const got=byRid.get(sr.id);
      if(!got){ if(sr.cut) d.rows.push(Object.assign({},ROW_BLANK,remapKeys(sr),{id:uid("r")})); continue; }   // cut shots aren't in the sheet; anything else missing was deleted there
      byRid.delete(sr.id);
      const row=Object.assign({},ROW_BLANK,remapKeys(sr),{id:uid("r")});
      const f=got[0].f;
      for(const [k,v] of Object.entries(f)){ if(SKIP.has(k)||k.startsWith("new:")) continue; row[k]=v; }
      // the sheet writes padded shot numbers (002); if it wasn't changed there, keep the app's own (02)
      { let exp=""; try{exp=shotNumber(sr,ad)}catch(e){} if(normH(f.shot)===normH(exp)||(f.shot==null&&!exp)) row.shot=sr.shot; }
      // fields that were emptied in the sheet come back empty
      for(const m of IMP.map){ if(["ignore","rid","take","shootDay","rowType","new","origStart","label"].includes(m.t)) continue; if(!(m.t in f)&&typeof row[m.t]==="string") row[m.t]=""; }
      if(got.some(r=>r.f.done)) row.done=true; else if("done" in f) row.done=false;
      { const im=[...new Set(got.flatMap(r=>r.imgs||[]).filter(Boolean))]; if(im.length) ["ref1","ref2","ref3"].forEach((k,i)=>{row[k]=im[i]||""}); }
      d.rows.push(row);
    }
    days.push(d);
  }
  // shots added in the sheet (no app row id) go on the day with the same Shoot Day number, or the last day
  const extra=[...loose,...[...byRid.values()].flat()];
  if(extra.length){
    for(const g of groupImport(extra)){
      const no=Number(g.day); const d=days.find(x=>Number(x.dayNo)===no)||days[days.length-1];
      if(d) d.rows.push(groupToRow(g,recorded,d.kind==="capture"));
    }
  }
  return days;
}
function isCutWord(v){return /^(cut|omit|omitted|drop|dropped|removed|out)$/i.test(String(v||"").trim())}
// shot numbers from different sheets: 005, 5, "100.0", sh030 and 030 are the same shot
function normShot(v){return String(v??"").trim().replace(/\.0+$/,"").replace(/^sh(?=\d)/i,"").replace(/^0+(?=\d)/,"").toLowerCase().replace(/\s+/g,"")}
const UPD={plan:null};
// update mode: match the sheet's shots to the ones already in the project (every day), and list what would change
function planUpdate(groups){
  const capture=D()&&D().kind==="capture";
  // only days that look like this shot list: most of their numbered shots are in the sheet (another sequence that also has a shot 5 is left alone)
  const sheetSet=new Set(groups.map(g=>normShot(g.recs[0].f.shot)).filter(Boolean));
  const share=d=>{const n=d.rows.filter(r=>!isBlock(r)&&normShot(r.shot));return n.length?n.filter(r=>sheetSet.has(normShot(r.shot))).length/n.length:0};
  let days=live().filter(d=>share(d)>=0.5); if(!days.length&&D()) days=[D()];
  const all=[]; for(const d of days) for(const r of d.rows) if(!isBlock(r)) all.push({d,r});
  const idx=new Map(); for(const x of all){const k=normShot(x.r.shot);if(!k)continue;if(!idx.has(k))idx.set(k,[]);idx.get(k).push(x)}
  const mapped=new Set(IMP.map.map(m=>m.t).filter(t=>!["ignore","take","shootDay","rowType","rid","new","shot","label"].includes(t)));
  const statusMapped=mapped.has("status"); mapped.delete("status");
  const same=(a,b,f)=>{const c=colMap()[f]||{};if(c.type==="flag"||["body","face","glove"].includes(f))return isOn(a)===isOn(b);if(typeof a==="number"||typeof b==="number")return Number(a||0)===Number(b||0);return String(a??"").replace(/\r/g,"").trim()===String(b??"").replace(/\r/g,"").trim()};
  const changes=[], adds=[], seen=new Set(); let last=null;
  for(const g of groups){
    if(g.recs[0].brk) continue;
    const nr=groupToRow(g,false,capture), k=normShot(nr.shot);
    if(!k||nr.type!=="shot") continue;
    const hits=idx.get(k);
    if(!hits){adds.push({row:nr,after:last,imgs:[...new Set(g.recs.flatMap(r=>r.imgs||[]).filter(Boolean))]});continue}
    seen.add(k); last=hits[hits.length-1];
    for(const hit of hits){
      const diffs=[];
      for(const f of mapped){ if(["takes","done","origStart","heroUrl","safetyUrl"].includes(f)&&!(f in nr)) continue;
        if(f==="setup"||f==="shoot"){ if(!(nr[f]>0)||Number(nr[f])===Number(hit.r[f])) continue; }
        if(!same(nr[f],hit.r[f],f)) diffs.push({f,old:hit.r[f]??"",val:nr[f]??""}); }
      if(statusMapped){ const nc=!!nr.cut; if(nc!==!!hit.r.cut) diffs.push({f:"cut",old:!!hit.r.cut,val:nc});
        if(!mapped.has("priority")&&nr.priority&&nr.priority!==hit.r.priority) diffs.push({f:"priority",old:hit.r.priority||"",val:nr.priority}); }
      // pictures only fill gaps: a shot that already has its storyboard keeps it
      const im=[...new Set(g.recs.flatMap(r=>r.imgs||[]).filter(Boolean))];
      if(im.length&&!hit.r.ref1) diffs.push({f:"pictures",old:"",val:im.length+" picture"+(im.length>1?"s":""),imgs:im});
      if(diffs.length) changes.push({hit,diffs});
    }
  }
  const missing=all.filter(x=>normShot(x.r.shot)&&!seen.has(normShot(x.r.shot))&&!x.r.cut);
  return {changes,adds,missing,count:groups.filter(g=>normShot(g.recs[0].f.shot)).length,days:days.map(d=>d.name)};
}
function fieldLabel(f){return f==="cut"?"Cut":f==="pictures"?"Storyboard":(colMap()[f]||{}).label||f}
function showVal(v,f){if(f==="cut")return v?"cut":"in";if(typeof v==="boolean")return v?"yes":"";const s=String(v??"");return s.length>220?s.slice(0,220)+"…":s}
// long text: start both sides just before the first difference, so the edit is what you see
function diffCells(x){
  let a=showValFull(x.old,x.f), b=showValFull(x.val,x.f);
  if(typeof x.old==="string"&&typeof x.val==="string"&&a.length>160&&b.length>160){let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;if(i>80){a="…"+a.slice(i-50);b="…"+b.slice(i-50)}}
  const cut=s=>s.length>260?s.slice(0,260)+"…":s;
  return [h("td",{style:"color:var(--muted)"},cut(a)),h("td",{},cut(b))];
}
function showValFull(v,f){if(f==="cut")return v?"cut":"in";if(typeof v==="boolean")return v?"yes":"";return String(v??"")}
function showUpdatePlan(plan){
  UPD.plan=plan; $("#impModal").classList.remove("open");
  openDoc("Shot list update",b=>{
    const nF=plan.changes.reduce((a,c)=>a+c.diffs.length,0), nCut=plan.changes.filter(c=>c.diffs.some(x=>x.f==="cut"&&x.val)).length, nUncut=plan.changes.filter(c=>c.diffs.some(x=>x.f==="cut"&&!x.val)).length;
    b.append(h("p",{},`From ${IMP.file} (${IMP.sheet}): ${plan.count} shots checked against ${plan.days.join(", ")}. Timings, takes, ticks, notes in other columns and pictures already in place are kept.`));
    b.append(h("div",{class:"kvs"},
      h("div",{class:"kv"},h("small",{},"Shots changed"),h("b",{},String(new Set(plan.changes.map(c=>c.hit.r.id)).size))),
      h("div",{class:"kv"},h("small",{},"Changes"),h("b",{},String(nF))),
      h("div",{class:"kv"},h("small",{},"Newly cut"),h("b",{},String(nCut))),
      ...(nUncut?[h("div",{class:"kv"},h("small",{},"Back in"),h("b",{},String(nUncut)))]:[]),
      h("div",{class:"kv"},h("small",{},"New shots"),h("b",{},String(plan.adds.length)))));
    const go=h("button",{class:"btn primary",onclick:()=>applyUpdatePlan()},nF+plan.adds.length?`Apply ${nF+plan.adds.length} change${nF+plan.adds.length===1?"":"s"}`:"Nothing to change");
    if(!(nF+plan.adds.length)) go.disabled=true;
    b.append(h("div",{class:"toolbar noprint",style:"margin:.4rem 0 .8rem"},go,h("button",{class:"btn",onclick:()=>{$("#docModal").classList.remove("open");$("#impModal").classList.add("open")}},"Back to the column mapping")));
    if(plan.changes.length){
      const t=h("table",{class:"doctable"},h("thead",{},h("tr",{},...["Shot","Day","Column","Was","Now"].map(x=>h("th",{},x)))));const tb=h("tbody",{});
      for(const c of plan.changes) c.diffs.forEach((x,i)=>tb.append(h("tr",{},h("td",{class:"nowrap"},i?"":h("b",{},c.hit.r.shot||"")),h("td",{class:"nowrap"},i?"":c.hit.d.name),h("td",{class:"nowrap"},fieldLabel(x.f)),
        ...diffCells(x))));
      t.append(tb); b.append(h("section",{class:"docsec"},h("h3",{},"Changes"),t));
    }
    if(plan.adds.length) b.append(h("section",{class:"docsec"},h("h3",{},"New shots"),h("p",{},plan.adds.map(a=>"Shot "+a.row.shot+(a.after?" (after "+a.after.r.shot+", "+a.after.d.name+")":" (end of "+(D()||{}).name+")")).join("; "))));
    if(plan.missing.length) b.append(h("section",{class:"docsec"},h("h3",{},"In the project but not in the sheet"),h("p",{class:"note"},"Left as they are. Cut them yourself if the client dropped them."),h("p",{},plan.missing.map(x=>x.r.shot+" ("+x.d.name+")").join(", "))));
  });
}
async function applyUpdatePlan(){
  const plan=UPD.plan; if(!plan) return;
  const btn=$("#docBody .btn.primary"); if(btn){btn.disabled=true;btn.textContent="Applying…"}
  // pictures first, so the whole update lands as one change (one Undo)
  const jobs=[...plan.changes.flatMap(c=>c.diffs.filter(x=>x.imgs)),...plan.adds.filter(a=>a.imgs.length)];
  let n=0; for(const j of jobs){ const list=j.imgs; for(let i=0;i<list.length&&i<3;i++){ btn&&(btn.textContent=`Adding pictures ${++n}…`); try{list[i]=await storePicture(list[i])}catch(e){list[i]=""} } }
  commit();
  let shots=0;
  for(const c of plan.changes){ const r=findRow(c.hit.r.id); if(!r) continue; const row=r.r; shots++;
    for(const x of c.diffs){ if(x.f==="pictures"){["ref1","ref2","ref3"].forEach((k,i)=>{if(x.imgs[i])row[k]=x.imgs[i]});continue}
      if(x.f==="priority"&&x.val&&!priorityOptions().includes(x.val)){S.cfg=S.cfg||{};S.cfg.priorityOptions=[x.val,...priorityOptions()].join(",");}
      row[x.f]=x.val; } }
  for(const a of plan.adds){ const row=a.row; ["ref1","ref2","ref3"].forEach((k,i)=>{row[k]=a.imgs[i]||""});
    if(row.priority&&!priorityOptions().includes(row.priority)){S.cfg=S.cfg||{};S.cfg.priorityOptions=[row.priority,...priorityOptions()].join(",");}
    if(a.after){const f=findRow(a.after.r.id); if(f){const rows=f.d.rows; rows.splice(rows.indexOf(f.r)+1,0,row); a.after={r:row,d:f.d}; continue}}
    D().rows.push(row); }
  commit(); renderAll(); $("#docModal").classList.remove("open");
  toast(`Updated ${shots} shot${shots===1?"":"s"}${plan.adds.length?`, added ${plan.adds.length}`:""} - Undo to take it back`);
  UPD.plan=null;
}
function guessColType(c){
  const vals=impDataRows().map(r=>r[c]).filter(v=>v!==""&&v!=null);
  if(!vals.length) return "text";
  if(vals.every(v=>typeof v==="boolean"||/^(0|1|y|n|yes|no|true|false|x)$/i.test(String(v).trim()))) return "flag";
  if(vals.every(v=>!isNaN(String(v).trim()))) return "number";
  const distinct=new Set(vals.map(v=>String(v).trim()));
  if(distinct.size<=8&&vals.length>=distinct.size*2&&[...distinct].every(v=>v.length<=20)) return "list";
  return vals.reduce((a,v)=>a+String(v).length,0)/vals.length>30?"note":"text";
}
async function runImport(){
  const dest=$("#impDest").value, recorded=$("#impTakes").checked;
  // a new project gets its own columns; this project's columns are left as they were
  const colsBefore=clone(S.cols), newCols=()=>{const ids=new Set(colsBefore.map(x=>x.id));const add=S.cols.filter(x=>!ids.has(x.id));S.cols=colsBefore;invalidateCols();return clone(add)};
  // columns mapped to "+ New column" become project columns first
  let made=0;
  const appCols=(IMP.app&&IMP.app.cols)||[], colRemap={};
  // exported custom columns come back as the same column (matched by id, then name), with their type and options
  for(const ac of appCols){ const ex=S.cols.find(x=>x.id===ac.id)||S.cols.find(x=>normH(x.label)===normH(ac.label)); colRemap["c_"+ac.id]=ex?"c_"+ex.id:null; }
  IMP.map.forEach(m=>{ if(m.t!=="new") return; const ac=appCols.find(x=>normH(x.label)===normH(m.h)); if(!ac) return;
    if(!colRemap["c_"+ac.id]){ const id=S.cols.some(x=>x.id===ac.id)?uid("k").replace(/[^a-z0-9]/gi,""):ac.id; S.cols.push({id,label:ac.label,type:ac.type,options:ac.options||""}); colRemap["c_"+ac.id]="c_"+id; }
    m.t=colRemap["c_"+ac.id]; });
  for(const ac of appCols) if(!colRemap["c_"+ac.id]&&(dest==="restore"||dest==="newproject")){ S.cols.push({id:ac.id,label:ac.label,type:ac.type,options:ac.options||""}); colRemap["c_"+ac.id]="c_"+ac.id; }
  IMP.map.forEach((m,c)=>{ if(m.t!=="new") return;
    const type=guessColType(c), id=uid("k").replace(/[^a-z0-9]/gi,"");
    const options=type==="list"?[...new Set(impDataRows().map(r=>String(r[c]??"").trim()).filter(Boolean))].join(","):"";
    S.cols.push({id,label:m.h,type,options}); m.t="c_"+id; made++; });
  if(made){ invalidateCols(); }
  const recs=impRecords(); if(!recs.length) return;
  if(dest==="update"){ showUpdatePlan(planUpdate(groupImport(recs))); return; }
  // pictures from the sheet: into this project now, or into the new project once it exists
  if(dest!=="newproject"){
    const all=recs.flatMap(r=>r.imgs.map((d,i)=>[r,i])); let n=0, failed=0;
    for(const [r,i] of all){ $("#impInfo")&&($("#impInfo").textContent=`Adding pictures: ${++n} of ${all.length}…`); try{ r.imgs[i]=await storePicture(r.imgs[i]); }catch(e){ r.imgs[i]=""; failed++; } }
    if(failed) toast(failed+" picture(s) couldn't be added");
  }
  const groups=groupImport(recs);
  const has=k=>IMP.map.some(m=>m.t===k);
  const capture=has("action")||has("performers")||has("body")||has("take");
  const c=cfg();
  const mkDay=(name,no)=>Object.assign({},DAY_BLANK,{id:uid("d"),name,kind:capture?"capture":"schedule",dayNo:no,call:c.newCall,wrap:c.newWrap,setupPct:c.newSetupPct,shootPct:c.newShootPct,minSetup:c.newMinSetup,rows:[]});
  commit();
  let target=null;
  if(IMP.app&&has("rid")&&(dest==="restore"||dest==="newproject")){
    const days=restoreDays(recs,recorded,colRemap);
    if(dest==="newproject"){
      const project={name:IMP.file.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ")};
      if(IMP.proj){const pr=IMP.proj.rows;const lk={"client / production":"client","shoot date(s)":"dates","location":"location","capture system":"system","director / lead":"lead","shoot / production id":"prodId","frame rate (fps)":"fps","notes":"notes"};
        if(pr[0]&&String(pr[0][0]).trim())project.name=String(pr[0][0]).trim();pr.slice(1).forEach(r=>{const k=lk[normH(r[0])];if(k&&String(r[1]??"").trim())project[k]=String(r[1])})}
      const used=new Set(Object.values(colRemap)); const added=newCols();
      const doc=normDoc({project,cols:[...added,...clone(colsBefore.filter(x=>used.has("c_"+x.id)))],days}); commit();
      $("#impModal").classList.remove("open");
      try{const pend=takeDataRefs(doc.days);const id=await createProject(project.name,docToSeed(doc));await openProject(id);await putDataRefs(pend);toast(`Imported ${days.length} day${days.length>1?"s":""} into a new project`)}catch(e){toast("Couldn't import: "+e.message)}
      return;
    }
    days.forEach(d=>S.days.push(d)); if(made||Object.keys(colRemap).length) invalidateCols();
    commit(); P.activeByProject[pid()]=days[0]&&days[0].id; savePrefs(); renderAll();
    $("#impModal").classList.remove("open");
    toast(`Restored ${days.length} day${days.length>1?"s":""} as exported - Undo to take it back`);
    return;
  }
  if(dest==="newproject"){
    const days=[];
    const byDay=has("shootDay");
    for(const g of groups){const name=byDay?("Day "+(g.day||"?")):"Imported day";let d=days.find(x=>x.name===name);if(!d){d=mkDay(name,byDay&&!isNaN(Number(g.day))?Number(g.day):days.length+1);days.push(d)}d.rows.push(groupToRow(g,recorded,capture))}
    const project={name:IMP.file.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ")};
    if(IMP.proj){const pr=IMP.proj.rows;const lk={"client / production":"client","shoot date(s)":"dates","location":"location","capture system":"system","director / lead":"lead","shoot / production id":"prodId","frame rate (fps)":"fps","notes":"notes"};
      if(pr[0]&&String(pr[0][0]).trim())project.name=String(pr[0][0]).trim();pr.slice(1).forEach(r=>{const k=lk[normH(r[0])];if(k&&String(r[1]??"").trim())project[k]=String(r[1])})}
    const doc=normDoc({project,cols:newCols(),days}); commit();
    $("#impModal").classList.remove("open");
    try{const pend=takeDataRefs(doc.days);const id=await createProject(project.name,docToSeed(doc));await openProject(id);await putDataRefs(pend);toast(`Imported ${groups.length} shots into a new project`)}catch(e){toast("Couldn't import: "+e.message)}
    return;
  }
  if(dest==="bydays"&&has("shootDay")){
    const made={};
    for(const g of groups){const key=g.day||"?";if(!made[key]){const no=Number(key);const ex=S.days.find(d=>!d.archived&&Number(d.dayNo)===no&&!isNaN(no)&&!d.rows.length);made[key]=ex||mkDay("Day "+key,isNaN(no)?S.days.length+1:no);if(!ex)S.days.push(made[key])}made[key].rows.push(groupToRow(g,recorded,capture))}
    target=Object.values(made)[0];
  }else if(dest==="newday"||!D()){
    target=mkDay(IMP.file.replace(/\.[^.]+$/,""),S.days.length+1); S.days.push(target);
    groups.forEach(g=>target.rows.push(groupToRow(g,recorded,capture)));
  }else{
    target=D(); if(dest==="replace") target.rows=[];
    groups.forEach(g=>target.rows.push(groupToRow(g,recorded,target.kind==="capture"||capture)));
  }
  commit(); P.activeByProject[pid()]=target.id; savePrefs(); renderAll();
  $("#impModal").classList.remove("open");
  toast(`Imported ${groups.length} shot${groups.length===1?"":"s"}${made?` and ${made} new column${made>1?"s":""}`:""} - Undo to take it back`);
}

/* ---------- export: tracker workbook in the Shotlist Builder format ---------- */
function openExport(){
  const box=$("#expDays"); box.innerHTML="";
  S.days.filter(d=>!d.archived).forEach(d=>{const cb=h("input",{type:"checkbox",value:d.id});cb.checked=true;box.append(h("label",{class:"inline"},cb,`${d.name} `,h("span",{class:"note"},`(${d.rows.filter(r=>!isBlock(r)).length} shots)`)))});
  $("#expModal").classList.add("open");
}
const XC={ink:"FF1D1D1F",paper:"FFF6F5F2",muted:"FF6B6B70",rule:"FFE2E0DB",stage:"FFE9EEF2",accent:"FFC2412D",soft:"FFF6E3DF",signal:"FF2F4858",white:"FFFFFFFF",note:"FFF2F6EE",done:"FFE8F1EA",break:"FFFBF3E2"};
async function exportXlsx(){
  const ids=$$("#expDays input:checked").map(x=>x.value);
  const withTiming=$("#expTiming").checked, withSchedule=$("#expSchedule").checked;
  const days=S.days.filter(d=>ids.includes(d.id));
  if(!days.length){toast("Pick at least one day");return}
  const btn=$("#expGo"); btn.disabled=true; btn.textContent="Building…";
  try{
    commit(); await loadExcel();
    const buf=await buildTracker(days,{withTiming,withSchedule});
    download(fileBase()+"_Shotlist.xlsx",new Blob([buf]),"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    $("#expModal").classList.remove("open"); toast("Spreadsheet ready. For Google Sheets use File > Import > Replace spreadsheet.");
  }catch(e){toast(e.message||"Couldn't build the spreadsheet")}
  finally{btn.disabled=false;btn.textContent="Download .xlsx"}
}
function colLetter(n){let s="";while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s}
async function buildTracker(days,opt){
  const c=cfg(); const wb=new ExcelJS.Workbook(); wb.creator=""; wb.title=S.project.name||"Shotlist";
  const fill=x=>({type:"pattern",pattern:"solid",fgColor:{argb:x}});
  const thin={style:"thin",color:{argb:XC.rule}}; const box={top:thin,left:thin,bottom:thin,right:thin};
  const F=(o={})=>Object.assign({name:"Calibri",size:10,color:{argb:XC.ink}},o);
  const st=(bg,fc,bold)=>({fill:{type:"pattern",pattern:"solid",bgColor:{argb:bg}},font:fc?{color:{argb:fc},bold:!!bold}:undefined});
  const xs=s=>String(s==null?"":s).replace(/"/g,"").trim();

  // Project
  const pj=wb.addWorksheet("Project",{properties:{tabColor:{argb:XC.signal}},views:[{showGridLines:false}]});
  pj.columns=[{width:26},{width:80}];
  pj.getCell("A1").value=S.project.name||"Untitled project"; pj.getCell("A1").font=F({size:20,bold:true}); pj.getRow(1).height=34;
  [["Client / production",S.project.client],["Shoot date(s)",S.project.dates],["Location",S.project.location],["Capture system",S.project.system],["Director / lead",S.project.lead],["Shoot / production ID",S.project.prodId],["Frame rate (fps)",S.project.fps],["Notes",S.project.notes]].forEach(([k,v],i)=>{
    const r=pj.getRow(i+3); r.getCell(1).value=k; const n=Number(v); r.getCell(2).value=v===""||v==null?null:(String(v).trim()!==""&&!isNaN(n)?n:v);
    r.getCell(1).font=F({size:11,bold:true}); r.getCell(2).font=F({size:11}); r.getCell(2).alignment={wrapText:true,vertical:"top",horizontal:"left"}; r.getCell(1).border={bottom:thin}; r.getCell(2).border={bottom:thin};
  });
  if(S.people.length){
    let r0=13; pj.getCell(`A${r0}`).value="Cast & crew"; pj.getCell(`A${r0}`).font=F({size:13,bold:true});
    S.people.forEach((p,i)=>{const r=pj.getRow(r0+1+i);r.getCell(1).value=`${p.group}: ${p.name}`;r.getCell(2).value=[p.role,p.phone,p.email,p.notes].filter(Boolean).join(" · ");r.getCell(1).font=F({bold:true});r.getCell(2).font=F()});
  }

  // Shotlist: one row per take
  const flagCols=["body","face","glove"];
  const tcols=[{k:"shot",h:"Shot #",w:9},{k:"take",h:"Take #",w:8},{k:"sid",h:"Shot ID",w:44},{k:"app",h:"Shot name (app)",w:44},{k:"prod",h:"Shoot/Production ID",w:12},
    {k:"day",h:"Shoot Day",w:8},{k:"priority",h:"Priority",w:9},{k:"perfCount",h:"# Of Performers",w:10},{k:"props",h:"Prop",w:16},{k:"performers",h:"Performer(s)",w:16},
    {k:"genre",h:"Genre",w:12},{k:"action",h:"Action",w:30},{k:"done",h:"Shot?",w:7},{k:"body",h:"Body",w:7},{k:"face",h:"Face",w:7},{k:"glove",h:"Glove",w:7},
    {k:"hero",h:"Hero",w:8},{k:"safety",h:"Safety",w:8},{k:"heroUrl",h:"Hero link",w:24},{k:"safetyUrl",h:"Safety link",w:24},{k:"description",h:"Description",w:30},{k:"location",h:"Location / Setup",w:18},{k:"shotType",h:"Shot type",w:14},
    {k:"camera",h:"Technical Notes",w:28},{k:"lighting",h:"Lighting",w:24},{k:"vfx",h:"Capture Notes",w:24},{k:"director",h:"Notes",w:30},
    ...cols().filter(x=>x.custom).map(x=>({k:x.key,h:x.label,w:x.type==="note"?28:x.type==="flag"?8:14,custom:x.type})),
    {k:"setup",h:"Setup (min)",w:9},{k:"shoot",h:"Shoot (min)",w:9},{k:"start",h:"Planned start",w:10}];
  if(opt.withTiming) tcols.push({k:"tcIn",h:"TC IN",w:11},{k:"tcOut",h:"TC OUT",w:11},{k:"secTc",h:"Seconds (TC)",w:12},{k:"fs",h:"Frame Start",w:11},{k:"fe",h:"Frame End",w:11},{k:"range",h:"Frame Range",w:11},{k:"fps",h:"Frame Rate",w:10},{k:"secFr",h:"Seconds (Frames)",w:14});
  { const cm=colMap(); const keymap={done:null,start:null,setup:"setup",shoot:"shoot",shot:"shot",priority:"priority",perfCount:"perfCount",props:"props",performers:"performers",genre:"genre",action:"action",body:"body",face:"face",glove:"glove",hero:"hero",safety:"safety",description:"description",location:"location",shotType:"shotType",camera:"camera",vfx:"vfx",director:"director"};
    tcols.forEach(x=>{const k=keymap[x.k];const c=k&&cm[k];if(c&&c.label!==c.base)x.h=c.label}); }
  const refKeys=opt.withPictures===false?[]:["ref1","ref2","ref3"].filter(k=>days.some(d=>d.rows.some(r=>!isBlock(r)&&!r.cut&&r[k])));
  refKeys.forEach((k,i)=>tcols.push({k,h:"Storyboard "+(i+1),w:24}));
  const pics=new Map();
  for(const d of days) for(const r of d.rows) if(!isBlock(r)&&!r.cut) for(const k of refKeys) if(r[k]&&!pics.has(r[k])) pics.set(r[k],await refToDataUrl(r[k]));
  tcols.push({k:"rid",h:"App row ID",w:12});
  tcols.forEach((x,i)=>{x.i=i+1;x.L=colLetter(i+1)});
  const L=k=>(tcols.find(x=>x.k===k)||{}).L;
  const sl=wb.addWorksheet("Shotlist",{properties:{tabColor:{argb:XC.accent}},views:[{state:"frozen",xSplit:3,ySplit:2,showGridLines:false}],pageSetup:{orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:"1:2"}});
  sl.columns=tcols.map(x=>({width:x.w,hidden:x.k==="rid"}));
  const hr=sl.getRow(1); hr.height=30;
  tcols.forEach(x=>{const cell=hr.getCell(x.i);cell.value=x.h;cell.fill=fill(XC.ink);cell.font=F({bold:true,color:{argb:XC.white}});cell.alignment={horizontal:"center",vertical:"middle",wrapText:true};cell.border={bottom:{style:"medium",color:{argb:XC.accent}}}});
  const tr=sl.getRow(2); tr.height=20;
  tcols.forEach(x=>{const cell=tr.getCell(x.i);cell.fill=fill(XC.stage);cell.font=F({bold:true});cell.alignment={horizontal:"center",vertical:"middle"};cell.border={bottom:thin}});
  tr.getCell(1).value="Totals";
  ["done","body","face","glove"].forEach(k=>{const l=L(k);tr.getCell(tcols.find(x=>x.k===k).i).value={formula:`SUMPRODUCT(--(${l}3:${l}100000))`}});

  // the rows: every logged take of every shot; planned shots with no takes get one row
  const data=[];
  for(const d of days){
    const C=compute(d);
    for(const r of d.rows){
      if(isBlock(r)||r.cut) continue;   // cut shots stay out of the tracker; the App data tab keeps them
      const base=takeBase(r,d), n=Math.max(1,Number(r.takes)||0);
      for(let t=1;t<=n;t++) data.push({d,r,take:base+t,first:t===1,logged:t<=(Number(r.takes)||0),start:C.rows[r.id].start});
    }
  }
  // ID Settings rows: one per name part, in the app's order
  const parts=c.idParts||[]; const idRow=k=>3+parts.findIndex(p=>p.key===k);
  const T=k=>`'ID Settings'!$B$${idRow(k)}`;
  const sep=xs(c.idSep==null?"_":c.idSep);
  // same clean-up as the app: trim, "/" and "&" become "+", characters that break file names are removed
  const DROP=[",",";",":","(",")","[","]","{","}","!","?","*","'","<",">","|","\\"];
  const cleanF=x=>{let f=x;for(const [a,b] of [[" / ","+"],[" & ","+"],["/","+"],["&","+"]])f=`SUBSTITUTE(${f},"${a}","${b}")`;for(const ch of DROP)f=`SUBSTITUTE(${f},"${ch}","")`;f=`SUBSTITUTE(${f},CHAR(34),"")`;return f};
  const segFormula=(p,rn)=>{
    const pre=xs(p.prefix);
    const ref=k=>`TRIM(${L(k)}${rn})`;
    switch(p.key){
      case "shot": return `IF(${ref("shot")}="","",${pre?`"${pre}"&`:""}${ref("shot")})`;
      case "take": return `IF(${ref("take")}="","",${pre?`"${pre}"&`:""}TEXT(${ref("take")},"${"0".repeat(Math.max(1,Number(c.takePad)||1))}"))`;
      case "prod": return `IF(${ref("prod")}="","",${pre?`"${pre}"&`:""}${ref("prod")})`;
      case "day": return `IF(${ref("day")}="","",${pre?`"${pre}"&`:""}${ref("day")})`;
      case "body": case "face": case "glove": return `IF(N(${L(p.key)}${rn})=1,"${pre}","")`;
      default: { const k=p.key; if(!L(k)) return `""`;
        const cc=tcols.find(y=>y.k===k); if(cc&&cc.custom==="flag"){const tag=pre||cleanSeg((colMap()[k]||{}).label||"");return `IF(N(${L(k)}${rn})=1,"${xs(tag)}","")`}
        return `IF(OR(${ref(k)}="",${ref(k)}="-"),"",${pre?`"${pre}"&`:""}${ref(k)})`; }
    }
  };
  const total=Math.max(300,data.length+50);
  const aL=L("action");
  for(let i=0;i<total;i++){
    const rn=i+3, row=sl.getRow(rn), x=data[i];
    const put=(k,v)=>{const col=tcols.find(y=>y.k===k);if(col)row.getCell(col.i).value=v};
    if(x){
      const r=x.r, d=x.d;
      put("rid",r.id); put("shot",shotNumber(r,d)); put("take",x.take);
      // timecode in / out from takes logged with the slate or Note View
      if(opt.withTiming){ const lt=takeList(r).find(t=>t.n===x.take); const fps=slateFps(); const fr=v=>{const ms=parseTc(v,fps);return ms==null?null:ms/864e5};
        if(lt&&lt.tc&&fr(lt.tc)!=null) put("tcIn",fr(lt.tc)); if(lt&&lt.out&&fr(lt.out)!=null) put("tcOut",fr(lt.out)); }
      if(x.first) for(const k of refKeys){ const du=pics.get(r[k]); const col=tcols.find(y=>y.k===k); if(!du||!col) continue;
        const m=du.match(/^data:image\/(png|jpe?g|gif);base64,(.*)$/i); if(!m) continue;
        const id=wb.addImage({base64:m[2],extension:m[1].toLowerCase().replace("jpg","jpeg")});
        sl.addImage(id,{tl:{col:col.i-1+0.08,row:rn-1+0.08},ext:{width:160,height:90},editAs:"oneCell"}); row.height=72; } put("app",shotName(r,d,x.take));
      const pid_=String(S.project.prodId||"").trim(); put("prod",pid_===""?null:(isNaN(Number(pid_))?pid_:Number(pid_)));
      put("day",d.dayNo||dayIndex(d)+1);
      for(const k of ["priority","props","performers","genre","action","hero","safety","description","location","shotType","camera","lighting","vfx","director"]){const v=r[k];if(v!=null&&String(v).trim()!=="")put(k,String(v))}
      for(const k of ["heroUrl","safetyUrl"]){const v=String(r[k]||"").trim();if(v)put(k,isUrl(v)?{text:v,hyperlink:v}:v)}
      for(const col of tcols.filter(y=>y.custom)){const v=r[col.k];if(col.custom==="flag")put(col.k,isOn(v)?1:0);else if(v!=null&&String(v).trim()!=="")put(col.k,col.custom==="number"&&!isNaN(Number(v))?Number(v):String(v))}
      if(r.perfCount!==""&&r.perfCount!=null) put("perfCount",isNaN(Number(r.perfCount))?r.perfCount:Number(r.perfCount));
      put("done",x.logged||r.done?1:0); flagCols.forEach(k=>put(k,isOn(r[k])?1:0));
      put("setup",Number(r.setup)||0); put("shoot",Number(r.shoot)||0); put("start",hhmm(x.start));
      if(opt.withTiming&&S.project.fps!==""&&!isNaN(Number(S.project.fps))) put("fps",Number(S.project.fps));
    }
    // live formulas, so the sheet keeps working when rows are added in Sheets
    const spaces=c.idSpaces; const joined=cleanF(`_xlfn.TEXTJOIN("${sep}",TRUE${parts.map(p=>`,IF(${T(p.key)},${segFormula(p,rn)},"")`).join("")})`);
    const idF=spaces==="keep"?joined:`SUBSTITUTE(${joined}," ","${spaces==null?"_":xs(spaces)}")`;
    put("sid",{formula:`IF(AND(${aL}${rn}="",${L("shot")}${rn}=""),"",${idF})`,result:x?shotName(x.r,x.d,x.take):""});
    if(!x) put("take",{formula:`IF(${aL}${rn}="","",COUNTIF($${aL}$3:${aL}${rn},${aL}${rn}))`});
    if(opt.withTiming){
      put("secTc",{formula:`IFERROR(IF(OR(${L("tcIn")}${rn}="",${L("tcOut")}${rn}=""),"",MOD(${L("tcOut")}${rn}-${L("tcIn")}${rn},1)*86400),"")`});
      put("range",{formula:`IFERROR(IF(OR(${L("fs")}${rn}="",${L("fe")}${rn}=""),"",${L("fe")}${rn}-${L("fs")}${rn}),"")`});
      put("secFr",{formula:`IFERROR(IF(OR(${L("range")}${rn}="",${L("fps")}${rn}="",${L("fps")}${rn}=0),"",${L("range")}${rn}/${L("fps")}${rn}),"")`});
      if(!x) put("fps",{formula:`IF(${L("fps")}${rn-1}="","",${L("fps")}${rn-1})`});
    }
    tcols.forEach(col=>{const cell=row.getCell(col.i);cell.border=box;const auto=["sid","app","secTc","range","secFr"].includes(col.k);
      cell.fill=fill(auto?XC.paper:XC.white);cell.font=auto?F({name:"Consolas",size:9,color:{argb:XC.signal}}):F();
      const centre=["shot","take","prod","day","priority","perfCount","done","body","face","glove","hero","safety","setup","shoot","start","fps","fs","fe"].includes(col.k);
      cell.alignment={vertical:"top",horizontal:centre?"center":undefined,wrapText:["description","camera","lighting","vfx","director","location"].includes(col.k)}});
    if(opt.withTiming){row.getCell(tcols.find(y=>y.k==="tcIn").i).numFmt="hh:mm:ss";row.getCell(tcols.find(y=>y.k==="tcOut").i).numFmt="hh:mm:ss"}
  }
  const last=total+2; const rng=k=>`${L(k)}3:${L(k)}${last}`; let pri=1;
  const popts=priorityOptions(); const plist=popts.join(",").replace(/"/g,"");
  if(plist&&plist.length<=250) sl.dataValidations.add(rng("priority"),{type:"list",allowBlank:true,showErrorMessage:false,formulae:[`"${plist}"`]});
  const prules=popts.map(o=>{const hx=prioHex(o);if(!hx)return null;const argb="FF"+hx.slice(1).toUpperCase();return {type:"cellIs",operator:"equal",formulae:[`"${o.replace(/"/g,"")}"`],style:st(argb,inkOn(hx)==="#fff"?XC.white:XC.ink,1),priority:pri++}}).filter(Boolean);
  if(prules.length) sl.addConditionalFormatting({ref:rng("priority"),rules:prules});
  for(const col of tcols.filter(y=>y.custom==="list")){const o=optList((S.cols.find(x=>"c_"+x.id===col.k)||{}).options).join(",").replace(/"/g,"");if(o&&o.length<=250)sl.dataValidations.add(rng(col.k),{type:"list",allowBlank:true,showErrorMessage:false,formulae:[`"${o}"`]})}
  sl.addConditionalFormatting({ref:`A3:${colLetter(tcols.length)}${last}`,rules:[{type:"expression",formulae:[`N($${L("done")}3)=1`],style:st(XC.done),priority:pri++}]});
  ["done","body","face","glove"].forEach(k=>sl.addConditionalFormatting({ref:rng(k),rules:[{type:"expression",formulae:[`AND($${aL}3<>"",N(${L(k)}3)=0)`],style:st(XC.soft,XC.accent),priority:pri++}]}));

  // ID Settings
  const ids=wb.addWorksheet("ID Settings",{properties:{tabColor:{argb:XC.signal}},views:[{showGridLines:false}]});
  ids.columns=[{width:26},{width:12},{width:64}];
  ids.getCell("A1").value="Shot ID Builder"; ids.getCell("A1").font=F({size:18,bold:true}); ids.getRow(1).height=30;
  ["Part","Include?","How it appears when ON"].forEach((t,i)=>{const cell=ids.getCell(2,i+1);cell.value=t;cell.fill=fill(XC.ink);cell.font=F({bold:true,color:{argb:XC.white}})});
  parts.forEach((p,i)=>{const r=ids.getRow(3+i);r.getCell(1).value=partLabel(p.key)||"(deleted column)";r.getCell(2).value=!!p.on;
    r.getCell(3).value=["body","face","glove"].includes(p.key)?`'${xs(p.prefix)}' when ticked, otherwise skipped`:(xs(p.prefix)?`Value prefixed with ${xs(p.prefix)} (skipped if blank or '-')`:"Value as entered (skipped if blank or '-')");
    r.getCell(1).font=F({bold:true});r.getCell(2).alignment={horizontal:"center"};for(let k=1;k<=3;k++){r.getCell(k).border=box}});
  ids.dataValidations.add(`B3:B${parts.length+2}`,{type:"list",allowBlank:false,formulae:['"TRUE,FALSE"']});
  const tip=parts.length+4; ids.getCell(`A${tip}`).value=`Parts join with "${sep||"(nothing)"}" in this order; blank or switched-off parts are dropped. Spaces inside parts ${c.idSpaces==="keep"?"are kept":"become "+(c.idSpaces||"(nothing)")}. The Shot name (app) column shows the name the Scheduler generated, for checking.`;
  ids.mergeCells(`A${tip}:C${tip}`); ids.getCell(`A${tip}`).alignment={wrapText:true,vertical:"top"}; ids.getRow(tip).height=44; ids.getCell(`A${tip}`).font=F({italic:true,color:{argb:XC.muted}});

  // Schedule (values, as calculated in the Scheduler)
  if(opt.withSchedule){
    const sc=wb.addWorksheet("Schedule",{properties:{tabColor:{argb:"FFD9A441"}},views:[{showGridLines:false}],pageSetup:{orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0}});
    sc.columns=[{width:6},{width:10},{width:10},{width:40},{width:10},{width:9},{width:9},{width:9},{width:9},{width:7}];
    let rn=1;
    for(const d of days){
      const C=compute(d);
      const t=sc.getRow(rn); t.getCell(1).value=`${d.name}${d.date?" · "+d.date:""} · call ${hhmm(toMin(d.call))} · wrap ${hhmm(C.wrap)} (target ${hhmm(toMin(d.wrap))})`; t.getCell(1).font=F({size:13,bold:true}); rn++;
      const hd=sc.getRow(rn); ["#","Type","Shot #","Action / description","Setup from","Setup","Start","Shoot","End","Done"].forEach((v,i)=>{const cell=hd.getCell(i+1);cell.value=v;cell.fill=fill(XC.ink);cell.font=F({bold:true,color:{argb:XC.white}})}); rn++;
      d.rows.forEach((r,i)=>{const c2=C.rows[r.id];const br=isBlock(r);const row=sc.getRow(rn++);
        [i+1,br?(r.type==="tech"?"Tech":"Break"):"Shot",br?blockName(r):shotNumber(r,d),br?(r.description||""):(r.action||r.description||""),hhmm(c2.setupStart),Math.round(c2.su),hhmm(c2.start),Math.round(c2.sh),hhmm(c2.end),br?"":(r.done?"Y":"")].forEach((v,j)=>{const cell=row.getCell(j+1);cell.value=v;cell.border=box;cell.font=F();if(br)cell.fill=fill(XC.break);else if(r.done)cell.fill=fill(XC.done)})});
      rn++;
    }
  }

  // Instructions
  // App data (hidden): everything the tracker columns don't carry - day names, kinds and times, script, refs, column types -
  // so importing this file back restores the days exactly, while edits made in the Shotlist tab still come through
  { const ad=wb.addWorksheet("App data",{state:"hidden"});
    const payload=JSON.stringify({app:"shotlist-scheduler",v:1,exported:new Date().toISOString(),cols:S.cols,
      days:days.map(d=>{const o={};for(const k of DAY_FIELDS)o[k]=d[k]??null;o.id=d.id;o.rows=d.rows.map(r=>Object.assign({},r));return o})});
    ad.getCell("A1").value="Shotlist Scheduler app data - used when this file is imported back. Please leave it as it is.";
    for(let i=0,rn=2;i<payload.length;i+=30000,rn++) ad.getCell("A"+rn).value=payload.slice(i,i+30000); }
  const ins=wb.addWorksheet("Instructions",{properties:{tabColor:{argb:XC.signal}},views:[{showGridLines:false}]});
  ins.columns=[{width:30},{width:100}];
  ins.getCell("A1").value="How to use this shotlist"; ins.getCell("A1").font=F({size:18,bold:true}); ins.getRow(1).height=30;
  const help=[["Made by",`Shotlist Scheduler v${VERSION} on ${new Date().toISOString().slice(0,10)} for ${S.project.name||"this project"}: ${days.map(d=>d.name).join(", ")}.`],
    ["One row per take","Every logged take is its own row. Shots with no takes logged yet have a single planned row."],
    ["Shot ID","A formula built from the ID Settings tab: set a part to FALSE to drop it from every ID. 'Shot name (app)' is what the Scheduler generated, for checking."],
    ["Retakes added here",`Add a row and type the same Action. Blank rows already carry the Take # and Shot ID formulas (Take # counts earlier rows with that Action). ${total} rows are ready.`],
    ["Tick-box columns","Shot?, Body, Face and Glove hold 1 or 0. In Sheets you can select them and use Insert > Checkbox; totals and colours keep working."],
    ["Google Sheets","File > Import > Upload this file > Replace spreadsheet. Formulas, dropdowns and colours come across."]];
  if(opt.withTiming) help.push(["Timecode & frames","TC IN / TC OUT as hh:mm:ss give Seconds (TC), including takes that cross midnight. Frame Start / End give Frame Range and Seconds (Frames)."]);
  help.forEach(([a,b],i)=>{const r=ins.getRow(i+3);r.getCell(1).value=a;r.getCell(2).value=b;r.getCell(1).font=F({size:11,bold:true});r.getCell(2).font=F({size:11,color:{argb:XC.muted}});r.getCell(1).alignment={vertical:"top"};r.getCell(2).alignment={vertical:"top",wrapText:true};r.getCell(1).border={bottom:thin};r.getCell(2).border={bottom:thin}});
  wb.views=[{activeTab:1}];
  return wb.xlsx.writeBuffer();
}

/* ---------- new version available ---------- */
let newVersionShown=false;
async function checkVersion(){
  if(!/^https?:$/.test(location.protocol)||newVersionShown) return;
  try{const r=await fetch("version.json",{cache:"no-store"});if(!r.ok)return;const j=await r.json();
    if(j&&j.version&&j.version!==VERSION){newVersionShown=true;const bar=$("#updateBar");$("#updateText").textContent=`Version ${j.version} is ready (you have ${VERSION}). Your work is safe - it saves before refreshing.`;bar.classList.add("show")}}catch(e){}
}
async function refreshForUpdate(){
  const b=$("#updateGo"); b.disabled=true; b.textContent="Saving…";
  commit(); if(MODE==="team"&&pending.length){try{await flush()}catch(e){}}
  location.reload();
}

/* ===================== storyboard pictures from a PDF ===================== */
// Reads a shot tracker / storyboard PDF (e.g. a Google Sheets export) in the browser: finds the "Shot No" column,
// takes every picture in the table, and gives each one to the shot on its row. Rows with no shot number carry on the
// shot above (extra frames), including across a page break. Pages that repeat the same rows (a wide sheet printed
// as several pages) are only read once.
let pdfLib=null;
async function loadPdfJs(){
  if(pdfLib) return pdfLib;
  const tryLib=async base=>{const m=await import(base+"pdf.min.mjs");m.GlobalWorkerOptions.workerSrc=base+"pdf.worker.min.mjs";return m};
  try{ pdfLib=await tryLib(new URL("vendor/pdfjs/",location.href).href); }
  catch(e){ try{ pdfLib=await tryLib("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/"); }catch(e2){ throw new Error("The PDF reader couldn't load. Check the connection and try again."); } }
  return pdfLib;
}
const SHOT_LABEL=/^\d{1,4}[A-Za-z]{0,2}$/;
async function pdfObj(page,id){const store=String(id).startsWith("g_")?page.commonObjs:page.objs;return await new Promise((res,rej)=>{try{store.get(id,res)}catch(e){rej(e)}})}
function objToCanvas(o){
  const c=document.createElement("canvas"); c.width=o.width; c.height=o.height; const x=c.getContext("2d");
  if(o.bitmap){ x.drawImage(o.bitmap,0,0); return c; }
  const im=x.createImageData(o.width,o.height), d=o.data, D=im.data;
  if(o.kind===3) D.set(d.subarray?d.subarray(0,D.length):d);
  else if(o.kind===2){ for(let i=0,j=0;j<D.length;i+=3,j+=4){D[j]=d[i];D[j+1]=d[i+1];D[j+2]=d[i+2];D[j+3]=255} }
  else { const rb=Math.ceil(o.width/8); for(let y=0;y<o.height;y++)for(let xx=0;xx<o.width;xx++){const v=(d[y*rb+(xx>>3)]>>(7-(xx&7)))&1?255:0,j=(y*o.width+xx)*4;D[j]=D[j+1]=D[j+2]=v;D[j+3]=255} }
  x.putImageData(im,0,0); return c;
}
// shrink onto white (no transparency), as a JPEG ready to upload, plus a small fingerprint to spot repeats
function finishPicture(src){
  const sc=Math.min(1,640/src.width,420/src.height), c=document.createElement("canvas");
  c.width=Math.max(1,Math.round(src.width*sc)); c.height=Math.max(1,Math.round(src.height*sc));
  const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,c.width,c.height); x.drawImage(src,0,0,c.width,c.height);
  const f=document.createElement("canvas"); f.width=12; f.height=8; const fx=f.getContext("2d"); fx.fillStyle="#fff"; fx.fillRect(0,0,12,8); fx.drawImage(src,0,0,12,8);
  const px=fx.getImageData(0,0,12,8).data; let hash=src.width+"x"+src.height+":"; for(let i=0;i<px.length;i+=4) hash+=((px[i]+px[i+1]+px[i+2])/48|0).toString(16);
  return {data:c.toDataURL("image/jpeg",.8),hash};
}
async function readStoryboardPdf(file,progress){
  const lib=await loadPdfJs(), OPS=lib.OPS, U=lib.Util;
  const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
  const shots=new Map(); let prevLast=null, lastKey=null, headerPages=0, pagesRead=0;
  for(let pn=1;pn<=doc.numPages;pn++){
    progress&&progress(pn,doc.numPages);
    const page=await doc.getPage(pn), vp=page.getViewport({scale:1});
    const tc=await page.getTextContent();
    const items=tc.items.filter(i=>i.str&&i.str.trim()).map(i=>{const [x,y]=vp.convertToViewportPoint(i.transform[4],i.transform[5]);const ht=Math.abs(i.transform[3])||i.height||8;return {s:i.str.trim(),x0:x,x1:x+(i.width||0),top:y-ht,bottom:y,cy:y-ht/2}});
    // the "Shot No" heading: one item ("Shot No", "Shot #", "Shot number") or "Shot" with "No" just after it
    let hx0=null,hx1=null,hb=null;
    for(let i=0;i<items.length&&hb==null;i++){const it=items[i];
      if(/^shot\s*(no\.?|#|number|num)$/i.test(it.s)){hx0=it.x0;hx1=it.x1;hb=it.bottom}
      else if(/^shot$/i.test(it.s)){const n=items.find(j=>j!==it&&Math.abs(j.cy-it.cy)<3&&j.x0>=it.x1-1&&j.x0-it.x1<14&&/^(no\.?|#|number|num)$/i.test(j.s));if(n){hx0=it.x0;hx1=n.x1;hb=Math.max(it.bottom,n.bottom)}}}
    if(hb==null){ page.cleanup(); continue; }
    headerPages++;
    const labels=items.filter(it=>SHOT_LABEL.test(it.s)&&it.top>hb&&it.x0>=hx0-24&&it.x1<=hx1+24).sort((a,b)=>a.cy-b.cy);
    // pictures and where they're drawn
    const ol=await page.getOperatorList(); let ctm=[1,0,0,1,0,0]; const st=[], pics=[];
    for(let i=0;i<ol.fnArray.length;i++){const fn=ol.fnArray[i],a=ol.argsArray[i];
      if(fn===OPS.save) st.push(ctm.slice());
      else if(fn===OPS.restore) ctm=st.pop()||[1,0,0,1,0,0];
      else if(fn===OPS.transform) ctm=U.transform(ctm,a);
      else if(fn===OPS.paintFormXObjectBegin){st.push(ctm.slice());if(a&&Array.isArray(a[0])&&a[0].length===6)ctm=U.transform(ctm,a[0])}
      else if(fn===OPS.paintFormXObjectEnd) ctm=st.pop()||[1,0,0,1,0,0];
      else if(fn===OPS.paintImageXObject||fn===OPS.paintInlineImageXObject){
        const pts=[[0,0],[1,0],[0,1],[1,1]].map(p=>vp.convertToViewportPoint(...U.applyTransform(p,ctm)));
        const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
        const b={x0:Math.min(...xs),x1:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
        if(b.x1-b.x0>=30&&b.bottom-b.top>=20&&b.top>=hb-2) pics.push(Object.assign(b,{id:fn===OPS.paintImageXObject?a[0]:null,inline:fn===OPS.paintInlineImageXObject?a[0]:null}));
      }}
    pics.sort((a,b)=>a.top-b.top||a.x0-b.x0);
    const done=[];
    for(const p of pics){
      let cv=null;
      try{ cv=objToCanvas(p.inline||await pdfObj(page,p.id)); }catch(e){}
      if(!cv){ // fall back to cutting it out of the rendered page
        if(!p.page){const sc=2,v2=page.getViewport({scale:sc}),pc=document.createElement("canvas");pc.width=v2.width;pc.height=v2.height;await page.render({canvasContext:pc.getContext("2d"),viewport:v2}).promise;p.page=pc}
        cv=document.createElement("canvas");cv.width=Math.round((p.x1-p.x0)*2);cv.height=Math.round((p.bottom-p.top)*2);cv.getContext("2d").drawImage(p.page,p.x0*2,p.top*2,cv.width,cv.height,0,0,cv.width,cv.height);
      }
      done.push(Object.assign(p,finishPicture(cv)));
    }
    // a wide sheet prints the same rows several times: only read them once
    const key=labels.map(l=>l.s).join(",")+"|"+done.map(p=>p.hash).join(",");
    if(key===lastKey){ page.cleanup(); continue; }
    lastKey=key; pagesRead++;
    for(const p of done){
      let owner=null; for(const l of labels) if(l.cy<=p.bottom) owner=l.s;
      owner=owner||prevLast; if(!owner) continue;          // pictures above the first shot of the document
      if(!shots.has(owner)) shots.set(owner,{shot:owner,pics:[]});
      const g=shots.get(owner); if(!g.pics.some(x=>x.hash===p.hash)) g.pics.push({data:p.data,hash:p.hash});
    }
    if(labels.length) prevLast=labels[labels.length-1].s;
    page.cleanup();
  }
  await doc.destroy();
  return {pages:doc.numPages,headerPages,pagesRead,shots:[...shots.values()]};
}
/* ---------- the PDF import window ---------- */
let PDFIMP=null;
async function openPdfImport(file){
  const m=$("#pdfModal"), b=$("#pdfBody"); b.innerHTML=""; m.classList.add("open");
  const prog=h("p",{class:"note"},"Reading "+file.name+"…"); b.append(prog);
  let res; try{ res=await readStoryboardPdf(file,(i,n)=>{prog.textContent=`Reading page ${i} of ${n}…`}); }
  catch(e){ prog.textContent="Couldn't read that PDF: "+e.message; return; }
  if(!res.headerPages){ prog.textContent="Couldn't find a \"Shot No\" column in this PDF. It needs a table with the shot number in a column headed Shot No (or Shot #) and the pictures on the same rows."; return; }
  PDFIMP={file:file.name,res}; renderPdfImport();
}
function pdfMatches(shot,scope){const k=normShot(shot);const days=scope==="day"?[D()]:live();const out=[];for(const d of days)for(const r of d.rows)if(!isBlock(r)&&!r.cut&&k&&normShot(r.shot)===k)out.push({d,r});return out}
function renderPdfImport(){
  const b=$("#pdfBody"); b.innerHTML=""; const {res}=PDFIMP; const n=res.shots.reduce((a,g)=>a+g.pics.length,0);
  const scope=h("select",{},h("option",{value:"all"},"Every day in this project"),h("option",{value:"day"},"This day only ("+(D()||{}).name+")"));
  const mode=h("select",{},h("option",{value:"fill"},"Keep them, add into empty slots"),h("option",{value:"replace"},"Replace them with the PDF's"));
  const addNew=h("input",{type:"checkbox"});
  scope.value=PDFIMP.scope||"all"; mode.value=PDFIMP.mode||"fill"; addNew.checked=!!PDFIMP.addNew;
  const redo=()=>{PDFIMP.scope=scope.value;PDFIMP.mode=mode.value;PDFIMP.addNew=addNew.checked;renderPdfImport()};
  [scope,mode,addNew].forEach(x=>x.addEventListener("change",redo));
  const matched=res.shots.filter(g=>pdfMatches(g.shot,scope.value).length), missing=res.shots.filter(g=>!pdfMatches(g.shot,scope.value).length);
  b.append(h("p",{},h("b",{},`${n} picture${n===1?"":"s"} for ${res.shots.length} shot${res.shots.length===1?"":"s"}`),` found in ${PDFIMP.file} (${res.pages} pages${res.pagesRead<res.headerPages?`; repeated pages read once`:""}). `,
    matched.length?`${matched.length} match shots in this project`:"None match shots in this project yet","",missing.length?`, ${missing.length} don't.`:"."));
  b.append(h("div",{class:"form"},h("label",{},"Match shot numbers on",scope),h("label",{},"When a shot already has pictures",mode),
    missing.length?h("label",{class:"inline"},addNew,`Add the ${missing.length} shot${missing.length>1?"s":""} that aren't in the project to ${(D()||{}).name}`):null));
  const t=h("table",{class:"plain pdfprev"}); t.append(h("thead",{},h("tr",{},h("th",{},"Shot"),h("th",{},"Pictures"),h("th",{},"Goes to"))));
  const tb=h("tbody",{});
  for(const g of res.shots){
    const ms=pdfMatches(g.shot,scope.value);
    const pics=h("div",{class:"refs"}); g.pics.forEach((p,i)=>pics.append(h("img",{src:p.data,class:i>=3?"over":"",title:i>=3?"Only 3 pictures fit a shot: this one is left out":"Picture "+(i+1)})));
    tb.append(h("tr",{class:ms.length||addNew.checked?"":"nomatch"},h("td",{},h("b",{},g.shot)),h("td",{},pics),
      h("td",{class:"note"},ms.length?ms.map(x=>`${x.d.name}: shot ${x.r.shot}`).join("; "):addNew.checked?`New shot on ${(D()||{}).name}`:"No shot "+g.shot+" in the project: skipped")));
  }
  t.append(tb);
  const go=h("button",{class:"btn primary",onclick:()=>runPdfImport()},"Import pictures");
  b.append(t,h("div",{class:"toolbar",style:"margin-top:.8rem"},go,h("span",{class:"note",id:"pdfProg"})),
    h("p",{class:"note"},"Shot numbers match ignoring leading zeros (005 = 5). Up to 3 pictures go on each shot, in the PDF's order. The pictures are uploaded to this project, so everyone on it sees them."));
}
async function runPdfImport(){
  const {res,scope="all",mode="fill",addNew=false}=PDFIMP; const pr=$("#pdfProg"); const btn=$("#pdfBody .btn.primary"); btn.disabled=true;
  const groups=res.shots.filter(g=>pdfMatches(g.shot,scope).length||(addNew&&D()));
  // 1) upload every picture first...
  const total=groups.reduce((a,g)=>a+Math.min(3,g.pics.length),0); let up=0, failed=0; const refsFor=new Map();
  for(const g of groups){ const refs=[];
    for(const p of g.pics.slice(0,3)){ pr.textContent=`Uploading picture ${++up} of ${total}…`;
      try{ refs.push(MODE==="team"?(await api("/api/image",{data:p.data})).ref:p.data); }catch(e){ failed++; } }
    refsFor.set(g,refs); }
  // 2) ...then change the schedule in one go, so a single Undo takes the whole import back
  let added=0, placed=0, shotsDone=0; const d0=D();
  for(const g of groups){
    let ms=pdfMatches(g.shot,scope);
    if(!ms.length&&addNew&&d0){ const r=Object.assign({},ROW_BLANK,{id:uid("r"),shot:g.shot}); d0.rows.push(r); ms=[{d:d0,r}]; added++; }
    const refs=refsFor.get(g)||[]; if(refs.length) shotsDone++;
    for(const {r} of ms){ const slots=["ref1","ref2","ref3"];
      if(mode==="replace"&&refs.length) slots.forEach(k=>r[k]="");
      for(const ref of refs){ const k=slots.find(k=>!r[k]); if(!k) break; r[k]=ref; placed++; } }
  }
  commit(); renderAll(); $("#pdfModal").classList.remove("open");
  let check="";
  const first=[...refsFor.values()].flat().find(x=>String(x).startsWith("img:"));
  if(first){ imgCache.delete(first); const ok=await imgSrc(first); if(!ok) check=` - but they won't load back from the site (${imgErrors.get(first)||"unknown"}). Please send this message to whoever set up the site.`; }
  const where=[...new Set(groups.flatMap(g=>pdfMatches(g.shot,scope).map(x=>x.d.name)))];
  toast(placed?`Added ${placed} picture${placed===1?"":"s"} to ${shotsDone} shot${shotsDone===1?"":"s"}${where.length?" on "+where.join(", "):""}${added?` (${added} new)`:""}${failed?` - ${failed} couldn't upload`:""}${check||" - Undo to take them back"}`
    :`No pictures were added: ${failed?failed+" couldn't upload":"no shot numbers matched this project"}.`);
}
