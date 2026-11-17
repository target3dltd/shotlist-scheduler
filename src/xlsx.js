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
async function readSheets(file){
  const name=file.name.toLowerCase();
  if(/\.(csv|tsv|txt)$/.test(name)) return [{name:file.name.replace(/\.[^.]+$/,""),rows:parseCSV(await file.text())}];
  if(!/\.(xlsx|xlsm)$/.test(name)) throw new Error("Save it as .xlsx or .csv first (from Google Sheets: File > Download).");
  await loadExcel();
  const wb=new ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
  return wb.worksheets.map(ws=>{
    const rows=[]; ws.eachRow({includeEmpty:false},(row)=>{const vals=row.values.slice(1).map(cellText);rows.push(vals)});
    return {name:ws.name,rows:rows.filter(r=>r.some(x=>String(x).trim()!==""))};
  });
}

/* ---------- mapping ---------- */
const IMPORT_TARGETS=[
  ["ignore","Ignore"],["shot","Shot #"],["take","Take # (groups retakes)"],["shootDay","Shoot day (one day per value)"],
  ["action","Action"],["description","Description"],["performers","Performer(s)"],["perfCount","# Of performers"],["props","Prop / set notes"],
  ["genre","Genre"],["body","Body"],["face","Face"],["glove","Glove"],["hero","Hero"],["safety","Safety"],["priority","Priority"],
  ["done","Shot? / done"],["setup","Setup (min)"],["shoot","Shoot (min)"],["origStart","Planned start time"],["duration","Screen duration"],
  ["location","Location / Setup"],["script","Script / Dialogue"],["shotType","Shot type"],["camera","Camera & lighting"],["vfx","VFX notes"],["director","Director notes"],
  ["label","Break name"],["rowType","Row type (Shot / Break)"]
];
const APPEND_TARGETS=["director","vfx","camera","location","props","script","description"];
const IMPORT_SYN={
  shot:["shot #","shot","shot no","shot number","shot#","sc/shot","scene/shot"],
  take:["take #","take","take no","take#","tk"],
  shootDay:["shoot day","day","shooting day","day #"],
  action:["action","shot name","task","move","action name","name"],
  description:["description","desc"],
  performers:["performer(s)","performers","performer","actor","actors","talent","cast"],
  perfCount:["# of performers","# performers","no. of performers","performer count","num performers"],
  props:["prop","props","prop / set design notes","prop / set notes","set notes"],
  genre:["genre"],body:["body"],face:["face"],glove:["glove","gloves"],hero:["hero"],safety:["safety"],priority:["priority","pri"],
  done:["shot?","done","shot (done)","complete","completed"],
  setup:["time to setup","setup","setup (min)","setup mins"],shoot:["time to shoot","shoot","shoot (min)","shoot mins"],
  origStart:["start shooting","start","start time","planned start","original start"],duration:["duration","screen dur.","screen duration"],
  location:["location and setup","location / setup","location","capture"],script:["script / dialogue","script","dialogue"],
  shotType:["shot type"],camera:["camera & lighting notes","camera & lighting","camera","technical notes"],
  vfx:["vfx notes","vfx","gs process?","capture notes","mocap notes"],director:["director notes","notes","other notes","comments","comment"],
  rowType:["type","row type"]
};
const IMPORT_SKIP=["shot id","totals","seconds (tc)","frame range","seconds (frames)","shoot/production id","frame rate","tc in","tc out","frame start","frame end","storyboard / ref image","alternate reference","shot name (app)","shot name (last take)","video export","mocap export","m&t process?","post filter?","m&t export","gs export","order","end","setup from","calculated end","kind","date","takes"];
const normH=s=>String(s==null?"":s).toLowerCase().replace(/\s+/g," ").trim();
function guessTarget(h,used){
  const n=normH(h); if(!n) return "ignore";
  if(IMPORT_SKIP.includes(n)) return "ignore";
  for(const [k,list] of Object.entries(IMPORT_SYN)) if(list.includes(n)&&(!used.has(k)||APPEND_TARGETS.includes(k))) return k;
  return "ignore";
}
function detectHeader(rows){
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
    const pick=sheets.find(s=>/shot|list|schedule|table/i.test(s.name)&&s.rows.length>1)||sheets.slice().sort((a,b)=>b.rows.length-a.rows.length)[0];
    IMP={file:file.name,sheets,proj:sheets.find(s=>s.name==="Project")};
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
    let t=guessTarget(hdr[c],used); if(t!=="ignore") used.add(t);
    if(!body.some(r=>String(r[c]??"").trim()!=="")) t="ignore";
    IMP.map.push({h:head,t,sample:String((body.find(r=>String(r[c]??"").trim()!=="")||[])[c]??"")});
  }
  const tb=$("#impMap"); tb.innerHTML="";
  IMP.map.forEach((m,i)=>{
    const s=h("select",{"data-mi":i}); IMPORT_TARGETS.forEach(([v,l])=>s.append(h("option",{value:v},l))); s.value=m.t;
    s.addEventListener("change",()=>{IMP.map[i].t=s.value;updImpInfo()});
    tb.append(h("tr",{},h("td",{},h("b",{},m.h)),h("td",{class:"note",style:"max-width:16rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",title:m.sample},m.sample),h("td",{},s)));
  });
  const has=k=>IMP.map.some(m=>m.t===k);
  $("#impTakes").checked=has("take")||has("hero")||has("safety");
  $("#impDest").value=has("shootDay")?"bydays":(S&&D()&&D().rows.length?"newday":"append");
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
    const rec={f:{},take:null,day:null,brk:false};
    let any=false;
    IMP.map.forEach((m,c)=>{
      if(m.t==="ignore") return; const raw=r[c]; const v=typeof raw==="string"?raw.trim():raw;
      if(v===""||v==null) return;
      if(m.t==="take"){const n=parseInt(v,10);if(!isNaN(n))rec.take=n;return}
      if(m.t==="shootDay"){rec.day=String(v);return}
      if(m.t==="rowType"){rec.brk=/break|move|lunch/i.test(String(v));return}
      // a row only counts if it carries real content: pre-built blank tracker rows have just a number and 0/FALSE ticks
      if(!["shot","perfCount","body","face","glove","done","setup","shoot"].includes(m.t)) any=true;
      if(["setup","shoot"].includes(m.t)&&parseMinutes(v)>0) any=true;
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
  if(g.recs[0].brk||(row.label&&!row.action&&!row.shot&&!row.description)){row.type="break";row.label=row.label||row.shot||"Break";row.shot="";row.takes=0;row.done=false;}
  if(!kindCapture&&!row.description&&row.action) row.description=row.action;
  return row;
}
async function runImport(){
  const dest=$("#impDest").value, recorded=$("#impTakes").checked;
  const recs=impRecords(); if(!recs.length) return;
  const groups=groupImport(recs);
  const has=k=>IMP.map.some(m=>m.t===k);
  const capture=has("action")||has("performers")||has("body")||has("take");
  const c=cfg();
  const mkDay=(name,no)=>Object.assign({},DAY_BLANK,{id:uid("d"),name,kind:capture?"capture":"schedule",dayNo:no,call:c.newCall,wrap:c.newWrap,setupPct:c.newSetupPct,shootPct:c.newShootPct,minSetup:c.newMinSetup,rows:[]});
  commit();
  let target=null;
  if(dest==="newproject"){
    const days=[];
    const byDay=has("shootDay");
    for(const g of groups){const name=byDay?("Day "+(g.day||"?")):"Imported day";let d=days.find(x=>x.name===name);if(!d){d=mkDay(name,byDay&&!isNaN(Number(g.day))?Number(g.day):days.length+1);days.push(d)}d.rows.push(groupToRow(g,recorded,capture))}
    const project={name:IMP.file.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ")};
    if(IMP.proj){const pr=IMP.proj.rows;const lk={"client / production":"client","shoot date(s)":"dates","location":"location","capture system":"system","director / lead":"lead","shoot / production id":"prodId","frame rate (fps)":"fps","notes":"notes"};
      if(pr[0]&&String(pr[0][0]).trim())project.name=String(pr[0][0]).trim();pr.slice(1).forEach(r=>{const k=lk[normH(r[0])];if(k&&String(r[1]??"").trim())project[k]=String(r[1])})}
    const doc=normDoc({project,days});
    $("#impModal").classList.remove("open");
    try{const id=await createProject(project.name,docToSeed(doc));await openProject(id);toast(`Imported ${groups.length} shots into a new project`)}catch(e){toast("Couldn't import: "+e.message)}
    return;
  }
  if(dest==="bydays"&&has("shootDay")){
    const made={};
    for(const g of groups){const key=g.day||"?";if(!made[key]){const no=Number(key);const ex=S.days.find(d=>Number(d.dayNo)===no&&!isNaN(no)&&!d.rows.length);made[key]=ex||mkDay("Day "+key,isNaN(no)?S.days.length+1:no);if(!ex)S.days.push(made[key])}made[key].rows.push(groupToRow(g,recorded,capture))}
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
  toast(`Imported ${groups.length} shot${groups.length===1?"":"s"} - Undo to take it back`);
}

/* ---------- export: tracker workbook in the Shotlist Builder format ---------- */
function openExport(){
  const box=$("#expDays"); box.innerHTML="";
  S.days.forEach(d=>{const cb=h("input",{type:"checkbox",value:d.id});cb.checked=true;box.append(h("label",{class:"inline"},cb,`${d.name} `,h("span",{class:"note"},`(${d.rows.filter(r=>r.type!=="break").length} shots)`)))});
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
  const cols=[{k:"shot",h:"Shot #",w:9},{k:"take",h:"Take #",w:8},{k:"sid",h:"Shot ID",w:44},{k:"app",h:"Shot name (app)",w:44},{k:"prod",h:"Shoot/Production ID",w:12},
    {k:"day",h:"Shoot Day",w:8},{k:"priority",h:"Priority",w:9},{k:"perfCount",h:"# Of Performers",w:10},{k:"props",h:"Prop",w:16},{k:"performers",h:"Performer(s)",w:16},
    {k:"genre",h:"Genre",w:12},{k:"action",h:"Action",w:30},{k:"done",h:"Shot?",w:7},{k:"body",h:"Body",w:7},{k:"face",h:"Face",w:7},{k:"glove",h:"Glove",w:7},
    {k:"hero",h:"Hero",w:8},{k:"safety",h:"Safety",w:8},{k:"description",h:"Description",w:30},{k:"location",h:"Location / Setup",w:18},{k:"shotType",h:"Shot type",w:14},
    {k:"camera",h:"Technical Notes",w:28},{k:"vfx",h:"Capture Notes",w:24},{k:"director",h:"Notes",w:30},{k:"setup",h:"Setup (min)",w:9},{k:"shoot",h:"Shoot (min)",w:9},{k:"start",h:"Planned start",w:10}];
  if(opt.withTiming) cols.push({k:"tcIn",h:"TC IN",w:11},{k:"tcOut",h:"TC OUT",w:11},{k:"secTc",h:"Seconds (TC)",w:12},{k:"fs",h:"Frame Start",w:11},{k:"fe",h:"Frame End",w:11},{k:"range",h:"Frame Range",w:11},{k:"fps",h:"Frame Rate",w:10},{k:"secFr",h:"Seconds (Frames)",w:14});
  cols.forEach((x,i)=>{x.i=i+1;x.L=colLetter(i+1)});
  const L=k=>(cols.find(x=>x.k===k)||{}).L;
  const sl=wb.addWorksheet("Shotlist",{properties:{tabColor:{argb:XC.accent}},views:[{state:"frozen",xSplit:3,ySplit:2,showGridLines:false}],pageSetup:{orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:"1:2"}});
  sl.columns=cols.map(x=>({width:x.w}));
  const hr=sl.getRow(1); hr.height=30;
  cols.forEach(x=>{const cell=hr.getCell(x.i);cell.value=x.h;cell.fill=fill(XC.ink);cell.font=F({bold:true,color:{argb:XC.white}});cell.alignment={horizontal:"center",vertical:"middle",wrapText:true};cell.border={bottom:{style:"medium",color:{argb:XC.accent}}}});
  const tr=sl.getRow(2); tr.height=20;
  cols.forEach(x=>{const cell=tr.getCell(x.i);cell.fill=fill(XC.stage);cell.font=F({bold:true});cell.alignment={horizontal:"center",vertical:"middle"};cell.border={bottom:thin}});
  tr.getCell(1).value="Totals";
  ["done","body","face","glove"].forEach(k=>{const l=L(k);tr.getCell(cols.find(x=>x.k===k).i).value={formula:`SUMPRODUCT(--(${l}3:${l}100000))`}});

  // the rows: every logged take of every shot; planned shots with no takes get one row
  const data=[];
  for(const d of days){
    const C=compute(d);
    for(const r of d.rows){
      if(r.type==="break") continue;
      const base=takeBase(r,d), n=Math.max(1,Number(r.takes)||0);
      for(let t=1;t<=n;t++) data.push({d,r,take:base+t,logged:t<=(Number(r.takes)||0),start:C.rows[r.id].start});
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
      default: { const k=p.key; if(!L(k)) return `""`; return `IF(OR(${ref(k)}="",${ref(k)}="-"),"",${pre?`"${pre}"&`:""}${ref(k)})`; }
    }
  };
  const total=Math.max(300,data.length+50);
  const aL=L("action");
  for(let i=0;i<total;i++){
    const rn=i+3, row=sl.getRow(rn), x=data[i];
    const put=(k,v)=>{const col=cols.find(y=>y.k===k);if(col)row.getCell(col.i).value=v};
    if(x){
      const r=x.r, d=x.d;
      put("shot",shotNumber(r,d)); put("take",x.take); put("app",shotName(r,d,x.take));
      const pid_=String(S.project.prodId||"").trim(); put("prod",pid_===""?null:(isNaN(Number(pid_))?pid_:Number(pid_)));
      put("day",d.dayNo||dayIndex(d)+1);
      for(const k of ["priority","props","performers","genre","action","hero","safety","description","location","shotType","camera","vfx","director"]){const v=r[k];if(v!=null&&String(v).trim()!=="")put(k,String(v))}
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
    cols.forEach(col=>{const cell=row.getCell(col.i);cell.border=box;const auto=["sid","app","secTc","range","secFr"].includes(col.k);
      cell.fill=fill(auto?XC.paper:XC.white);cell.font=auto?F({name:"Consolas",size:9,color:{argb:XC.signal}}):F();
      const centre=["shot","take","prod","day","priority","perfCount","done","body","face","glove","hero","safety","setup","shoot","start","fps","fs","fe"].includes(col.k);
      cell.alignment={vertical:"top",horizontal:centre?"center":undefined,wrapText:["description","camera","vfx","director","location"].includes(col.k)}});
    if(opt.withTiming){row.getCell(cols.find(y=>y.k==="tcIn").i).numFmt="hh:mm:ss";row.getCell(cols.find(y=>y.k==="tcOut").i).numFmt="hh:mm:ss"}
  }
  const last=total+2; const rng=k=>`${L(k)}3:${L(k)}${last}`; let pri=1;
  sl.dataValidations.add(rng("priority"),{type:"list",allowBlank:true,showErrorMessage:false,formulae:['"HIGH,MID,LOW"']});
  sl.addConditionalFormatting({ref:rng("priority"),rules:[["HIGH",XC.accent,XC.white],["MID","FFD9A441",XC.ink],["LOW",XC.stage,XC.muted]].map(([v,bg,fc])=>({type:"cellIs",operator:"equal",formulae:[`"${v}"`],style:st(bg,fc,1),priority:pri++}))});
  sl.addConditionalFormatting({ref:`A3:${colLetter(cols.length)}${last}`,rules:[{type:"expression",formulae:[`N($${L("done")}3)=1`],style:st(XC.done),priority:pri++}]});
  ["done","body","face","glove"].forEach(k=>sl.addConditionalFormatting({ref:rng(k),rules:[{type:"expression",formulae:[`AND($${aL}3<>"",N(${L(k)}3)=0)`],style:st(XC.soft,XC.accent),priority:pri++}]}));

  // ID Settings
  const ids=wb.addWorksheet("ID Settings",{properties:{tabColor:{argb:XC.signal}},views:[{showGridLines:false}]});
  ids.columns=[{width:26},{width:12},{width:64}];
  ids.getCell("A1").value="Shot ID Builder"; ids.getCell("A1").font=F({size:18,bold:true}); ids.getRow(1).height=30;
  ["Part","Include?","How it appears when ON"].forEach((t,i)=>{const cell=ids.getCell(2,i+1);cell.value=t;cell.fill=fill(XC.ink);cell.font=F({bold:true,color:{argb:XC.white}})});
  parts.forEach((p,i)=>{const r=ids.getRow(3+i);r.getCell(1).value=ID_PART_LABELS[p.key]||p.key;r.getCell(2).value=!!p.on;
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
      d.rows.forEach((r,i)=>{const c2=C.rows[r.id];const br=r.type==="break";const row=sc.getRow(rn++);
        [i+1,br?"Break":"Shot",br?(r.label||"Break"):shotNumber(r,d),br?(r.description||""):(r.action||r.description||""),hhmm(c2.setupStart),Math.round(c2.su),hhmm(c2.start),Math.round(c2.sh),hhmm(c2.end),br?"":(r.done?"Y":"")].forEach((v,j)=>{const cell=row.getCell(j+1);cell.value=v;cell.border=box;cell.font=F();if(br)cell.fill=fill(XC.break);else if(r.done)cell.fill=fill(XC.done)})});
      rn++;
    }
  }

  // Instructions
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
