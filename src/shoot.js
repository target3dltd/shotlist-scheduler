/* ===================== shoot-day tools =====================
   Freeze timings, call sheet, wrap report, takes export for edit / DIT, weather and daylight,
   and the shoot-ready check. Kept together so they can be read (and changed) in one place. */

/* ---------- freeze timings ---------- */
let FREEZE_BYPASS=false;
function isFrozen(d){d=d||D();return !!(d&&d.frozen&&!FREEZE_BYPASS)}
// call before anything that would retime or reorder a frozen day; says why and returns true to stop
function frozenNo(){if(!isFrozen())return false;toast("Timings are frozen for this day. Use Unfreeze in the day banner to change them.");return true}
function applyFreeze(){
  const d=D(), on=isFrozen(d);
  document.body.classList.toggle("dayfrozen",on);
  for(const id of ["callTime","setupPct","shootPct","minSetup"]){const el=$("#"+id);if(el)el.disabled=on}
  const b=$("#freezeBtn"); if(b){b.textContent=on?"Unfreeze timings":"Freeze timings";b.classList.toggle("primary",on);b.setAttribute("aria-pressed",String(on))}
  const flag=$("#frozenFlag"); if(flag) flag.hidden=!on;
}
async function toggleFreeze(){
  const d=D(); if(!d) return;
  if(d.frozen){ if(!(await ask("Unfreeze "+d.name+"?","Timings, the running order and rows can be changed again, by everyone.","Unfreeze")))return; d.frozen=false; }
  else d.frozen=true;
  commit(); renderAll(); toast(d.frozen?"Timings frozen: takes, ticks, notes and cuts still work":"Timings unfrozen");
}

/* ---------- a page view for the call sheet and wrap report, printable on its own ---------- */
function openDoc(title,build){
  const m=$("#docModal"); m.classList.add("open"); $("#docTitle").textContent=title;
  const body=$("#docBody"); body.innerHTML=""; build(body); DOC.title=title; DOC.build=build;
}
const DOC={title:"",build:null};
function rebuildDoc(){const ae=document.activeElement;if(ae&&ae.closest&&ae.closest("#docBody")&&(ae.tagName==="TEXTAREA"||(ae.tagName==="INPUT"&&!/checkbox|radio|button/.test(ae.type))))return;if($("#docModal").classList.contains("open")&&DOC.build){const sc=$("#docModal .box").scrollTop;$("#docBody").innerHTML="";DOC.build($("#docBody"));$("#docModal .box").scrollTop=sc}}
function printDoc(){
  document.body.classList.add("printdoc");
  $$("#docBody textarea").forEach(t=>{const div=h("div",{class:"ta-print"},t.value||"");t.after(div)});
  const done=()=>{document.body.classList.remove("printdoc");$$("#docBody .ta-print").forEach(x=>x.remove());removeEventListener("afterprint",done)};
  addEventListener("afterprint",done); window.print(); setTimeout(()=>{if(!matchMedia("print").matches&&document.body.classList.contains("printdoc"))done()},1500);
}
function docText(){
  const out=[]; const walk=el=>{
    for(const n of el.childNodes){
      if(n.nodeType===3){const t=n.textContent.replace(/\s+/g," ");if(t.trim())out.push(t);continue}
      if(n.nodeType!==1||n.classList.contains("noprint")||n.tagName==="BUTTON") continue;
      if(n.tagName==="TEXTAREA"||n.tagName==="INPUT"){if(n.value)out.push(n.value);continue}
      if(n.tagName==="TR"){out.push("\n"+[...n.children].map(c=>c.innerText.replace(/\s+/g," ").trim()).filter(Boolean).join("  |  "));continue}
      const block=/^(H\d|P|DIV|SECTION|LI|TABLE|UL)$/.test(n.tagName); if(block) out.push("\n"); walk(n); if(/^H\d$/.test(n.tagName))out.push("\n");
    }}; walk($("#docBody"));
  return out.join("").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}
function dayNoteBox(d,key,ph){
  const t=h("textarea",{class:"docnote",placeholder:ph,rows:"3"}); t.value=d[key]||"";
  const fit=()=>{t.style.height="auto";t.style.height=Math.max(60,t.scrollHeight+2)+"px"};
  t.addEventListener("input",()=>{const x=S.days.find(y=>y.id===d.id);if(x)x[key]=t.value;fit();softCommit()}); t.addEventListener("change",commit);
  requestAnimationFrame(fit); return t;
}
function longDate(iso){if(!iso)return "Date not set";const dt=new Date(iso+"T12:00:00");return isNaN(dt)?iso:dt.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
function dayOfN(d){const l=live().filter(x=>x.date||x.dayNo);const no=Number(d.dayNo)||0;const total=Math.max(no,...live().map(x=>Number(x.dayNo)||0));return no?`Day ${no}${total>1?" of "+total:""}`:""}

/* ---------- call sheet ---------- */
function openCallSheet(){const d=D();if(!d)return;commit();openDoc("Call sheet",b=>buildCallSheet(b,d))}
function buildCallSheet(b,d){
  d=S.days.find(x=>x.id===d.id)||d; const C=compute(d), pr=S.project;
  const rows=d.rows.filter(r=>!r.cut), shots=rows.filter(r=>!isBlock(r));
  const first=shots[0], lunch=rows.find(r=>r.type==="break"&&/lunch/i.test(blockName(r)))||rows.find(r=>r.type==="break");
  const kv=(k,v)=>h("div",{class:"kv"},h("small",{},k),h("b",{},v||"-"));
  b.append(h("div",{class:"dochead"},
    h("div",{},h("div",{class:"docproj"},pr.name||"Untitled project"),h("div",{class:"docsub"},[pr.client,pr.prodId].filter(Boolean).join(" · "))),
    h("div",{class:"docday"},h("div",{},d.name),h("small",{},[dayOfN(d),longDate(d.date)].filter(Boolean).join(" · ")))));
  b.append(h("div",{class:"kvs big"},kv("Crew call",fmt(toMin(d.call||"09:00"))),kv("First shot",first?fmt(C.rows[first.id].start):"-"),
    kv(lunch?blockName(lunch):"Break",lunch?fmt(C.rows[lunch.id].start)+" for "+dur(C.rows[lunch.id].sh):"-"),kv("Target wrap",fmt(wrapMin(d))),kv("Scheduled wrap",fmt(C.wrap))));
  const sky=skyLine(d,true);
  b.append(h("section",{class:"docsec"},h("h3",{},"Location"),
    h("div",{class:"doc2"},h("div",{},h("label",{class:"doclabel"},"Address, parking and access"),dayNoteBox(d,"address","Address, postcode, parking, unit base, access notes")),
      h("div",{},h("label",{class:"doclabel"},"Weather and daylight"),sky||h("p",{class:"note"},"No location set for this day."),locationButton(d,"noprint")))));
  b.append(h("section",{class:"docsec"},h("h3",{},"Notes"),dayNoteBox(d,"callNotes","Nearest hospital, safety, catering, wardrobe, what to bring, contacts on the day")));
  for(const group of ["Cast","Crew"]){
    const ppl=S.people.filter(p=>(p.group||"Crew")===group&&(p.name||p.role)); if(!ppl.length) continue;
    const t=h("table",{class:"doctable"},h("thead",{},h("tr",{},...["Name",group==="Cast"?"Character / role":"Role","Phone","Email","Notes"].map(x=>h("th",{},x)))));
    const tb=h("tbody",{}); ppl.forEach(p=>tb.append(h("tr",{},h("td",{},h("b",{},p.name||"")),h("td",{},p.role||""),h("td",{class:"nowrap"},p.phone||""),h("td",{},p.email||""),h("td",{},p.notes||""))));
    t.append(tb); b.append(h("section",{class:"docsec"},h("h3",{},group+" ("+ppl.length+")"),t));
  }
  const capture=d.kind==="capture";
  const t=h("table",{class:"doctable sched"},h("thead",{},h("tr",{},...["Time","Shot",capture?"Action":"Description","Location / setup",capture?"Performers":"Shot type","Mins"].map(x=>h("th",{},x)))));
  const tb=h("tbody",{});
  rows.forEach(r=>{const c=C.rows[r.id];
    if(isBlock(r)){tb.append(h("tr",{class:"blk"},h("td",{class:"nowrap"},fmt(c.start)),h("td",{colspan:"4"},blockName(r)),h("td",{class:"num"},String(Math.round(c.sh)))));return}
    tb.append(h("tr",{},h("td",{class:"nowrap"},fmt(c.start)),h("td",{class:"nowrap"},h("b",{},r.shot||"")),h("td",{},String((capture?r.action:r.description)||r.description||r.action||"").slice(0,160)),
      h("td",{},r.location||""),h("td",{},capture?(r.performers||""):(r.shotType||"")),h("td",{class:"num"},String(Math.round(c.su+c.sh)))));});
  t.append(tb); b.append(h("section",{class:"docsec"},h("h3",{},`Schedule (${shots.length} shot${shots.length===1?"":"s"})`),t));
  b.append(h("p",{class:"docfoot"},`${pr.name||"Shotlist"} · ${d.name} · printed ${new Date().toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}`));
}

/* ---------- wrap report ---------- */
function openWrapReport(){const d=D();if(!d)return;commit();openDoc("Wrap report",b=>buildWrap(b,d))}
function wrapData(d){
  const C=compute(d), rows=d.rows, shots=rows.filter(r=>!isBlock(r));
  const planned=shots.filter(r=>!r.cut), done=planned.filter(r=>r.done), left=planned.filter(r=>!r.done), cut=shots.filter(r=>r.cut);
  const st=takeStats(d), p=paceData(d,C);
  const ends=done.map(r=>r.doneAt).filter(x=>x!=null); const actual=ends.length?Math.max(...ends):null;
  let raw=0,heroN=0,heroMs=0,safetyN=0; for(const r of shots) for(const t of takeList(r)){if(t.mark==="hero"){heroN++;heroMs+=takeMs(t)} if(t.mark==="safety")safetyN++}
  return {C,planned,done,left,cut,st,p,actual,heroN,heroMs,safetyN};
}
function buildWrap(b,d){
  d=S.days.find(x=>x.id===d.id)||d; const W=wrapData(d), pr=S.project, capture=d.kind==="capture";
  const kv=(k,v,cls)=>h("div",{class:"kv "+(cls||"")},h("small",{},k),h("b",{},v));
  b.append(h("div",{class:"dochead"},
    h("div",{},h("div",{class:"docproj"},pr.name||"Untitled project"),h("div",{class:"docsub"},"Wrap report")),
    h("div",{class:"docday"},h("div",{},d.name),h("small",{},[dayOfN(d),longDate(d.date),capture?"Mocap":"Live Action"].filter(Boolean).join(" · ")))));
  // a day still under way shows its projected wrap; a finished one shows when the last shot was done
  const finished=!W.left.length&&W.actual!=null, endAt=finished?W.actual:(W.p?W.p.proj:null);
  const over=endAt!=null?Math.round(endAt-wrapMin(d)):null;
  b.append(h("div",{class:"kvs big"},
    kv("Shots done",`${W.done.length} of ${W.planned.length}`),
    kv("Call",fmt(toMin(d.call||"09:00"))),
    kv(finished?"Wrapped":"Projected wrap",endAt!=null?fmt(endAt):"not started"),
    kv("Against target",over==null?"-":over===0?"on target":(over>0?"+":"−")+dur(Math.abs(over)),over>0?"bad":over<0?"good":""),
    ...(!finished&&W.actual!=null?[kv("Last shot done",fmt(W.actual))]:[]),
    kv("Takes",String(W.st.takes)),
    kv(capture?"Captured":"Raw footage",W.st.timed?durSecs(W.st.ms):"-"),
    kv(capture?"Hero selects":"Hero takes",W.heroN?`${W.heroN}${W.heroMs?" · "+durSecs(W.heroMs):""}`:"-"),
    ...(W.p&&W.p.shots.length?[kv("Best streak",String(W.p.best)+" on pace")]:[])));
  // per shot
  const t=h("table",{class:"doctable"},h("thead",{},h("tr",{},...["Shot",capture?"Action":"Description","Takes","Marked","Finished","Vs plan"].map(x=>h("th",{},x)))));
  const tb=h("tbody",{});
  for(const r of W.planned){
    const c=W.C.rows[r.id], a=takeList(r);
    const marks=a.filter(t=>t.mark==="hero"||t.mark==="safety"||t.mark==="good").map(t=>`T${t.n} ${t.mark}${t.tc?" @ "+t.tc:""}`).join(", ");
    const vs=r.done&&r.doneAt!=null?Math.round(r.doneAt-c.end):null;
    tb.append(h("tr",{class:r.done?"":"undone"},h("td",{class:"nowrap"},h("b",{},r.shot||"-")),h("td",{},String((capture?r.action:r.description)||r.description||r.action||"").slice(0,120)),
      h("td",{class:"num"},String(Number(r.takes)||0)),h("td",{},marks||""),h("td",{class:"nowrap"},r.done?(r.doneAt!=null?fmt(r.doneAt):"done"):"not shot"),
      h("td",{class:"nowrap "+(vs>0?"bad":vs<0?"good":"")},vs==null?"":vs===0?"on plan":(vs>0?"+":"−")+dur(Math.abs(vs)))));
  }
  t.append(tb); b.append(h("section",{class:"docsec"},h("h3",{},"Shots"),t));
  if(W.left.length){
    b.append(h("section",{class:"docsec"},h("h3",{},`Carry over (${W.left.length})`),
      h("p",{},W.left.map(r=>(r.shot?"Shot "+r.shot:"")+(r.priority?" ("+r.priority+")":"")+((r.action||r.description)?": "+String(r.action||r.description).slice(0,60):"")).join("; ")),
      h("div",{class:"toolbar noprint"},h("button",{class:"btn small",onclick:()=>{FREEZE_BYPASS=true;try{$("#docModal").classList.remove("open");openMove(W.left.map(r=>r.id))}finally{FREEZE_BYPASS=false}}},"Move these to another day…"))));
  }
  if(W.cut.length) b.append(h("section",{class:"docsec"},h("h3",{},`Cut (${W.cut.length})`),h("p",{},W.cut.map(r=>"Shot "+(r.shot||"?")).join(", "))));
  b.append(h("section",{class:"docsec"},h("h3",{},"Wrap notes"),dayNoteBox(d,"wrapNotes","What happened, issues, kit, pickups needed, notes for the edit")));
  b.append(h("div",{class:"toolbar noprint"},h("button",{class:"btn small",onclick:()=>exportTakes([d])},"Download this day's takes (CSV)")));
  b.append(h("p",{class:"docfoot"},`${pr.name||"Shotlist"} · ${d.name} · ${new Date().toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}`));
}

/* ---------- takes for the edit / DIT ---------- */
function exportTakes(days){
  commit(); days=days||live();
  const head=["Day","Date","Shot #","Take","Clip name","Mark","TC in","TC out","Duration (s)","Duration","Logged at","Take note","Shot description","Action","Location / setup","Shot notes","Hero URL","Safety URL","Frame rate"];
  const lines=[head.map(csvEsc).join(",")]; let n=0;
  const fps=Number(S.project.fps)||"";
  for(const d of days) for(const r of d.rows){ if(isBlock(r)) continue;
    for(const t of takeList(r)){ n++; const ms=takeMs(t);
      lines.push([d.name,d.date||"",r.shot||"",t.n,t.name||shotName(r,d,t.n)||"",t.mark?t.mark[0].toUpperCase()+t.mark.slice(1):"",t.tc||"",t.out||"",ms?Math.round(ms/100)/10:"",ms?durSecs(ms):"",
        t.at?new Date(t.at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"}):(t.t||""),t.note||"",r.description||"",r.action||"",r.location||"",r.notes||r.director||"",r.heroUrl||"",r.safetyUrl||"",fps].map(csvEsc).join(","));
    } }
  if(!n){toast("No takes logged yet. Takes come from Slate View or Note View.");return}
  download(fileBase()+(days.length===1?"_"+String(days[0].name).replace(/[^\w\-]+/g,"_"):"")+"_takes.csv","﻿"+lines.join("\r\n"),"text/csv");
  toast(`Exported ${n} take${n===1?"":"s"}`);
}

/* ---------- weather and daylight ---------- */
// sunrise / sunset and golden hour, worked out on this device (no network), from the day's location
function sunTimes(iso,lat,lon){
  const rad=Math.PI/180, dayMs=864e5, J1970=2440588, J2000=2451545, e=rad*23.4397, J0=0.0009;
  const date=new Date((iso||todayISO())+"T12:00:00"); if(isNaN(date)||lat===""||lon===""||lat==null||lon==null) return null;
  const toDays=dt=>dt.valueOf()/dayMs-0.5+J1970-J2000, fromJ=j=>new Date((j+0.5-J1970)*dayMs);
  const lw=rad*-Number(lon), phi=rad*Number(lat), d=toDays(date), n=Math.round(d-J0-lw/(2*Math.PI));
  const ds=J0+lw/(2*Math.PI)+n, M=rad*(357.5291+0.98560028*ds);
  const L=M+rad*(1.9148*Math.sin(M)+0.02*Math.sin(2*M)+0.0003*Math.sin(3*M))+rad*102.9372+Math.PI;
  const dec=Math.asin(Math.sin(e)*Math.sin(L)), Jnoon=J2000+ds+0.0053*Math.sin(M)-0.0069*Math.sin(2*L);
  const at=deg=>{const w=Math.acos((Math.sin(deg*rad)-Math.sin(phi)*Math.sin(dec))/(Math.cos(phi)*Math.cos(dec)));if(isNaN(w))return null;
    const a=J0+(w+lw)/(2*Math.PI)+n, set=J2000+a+0.0053*Math.sin(M)-0.0069*Math.sin(2*L); return {rise:fromJ(Jnoon-(set-Jnoon)),set:fromJ(set)}};
  const sun=at(-0.833), gold=at(6), civil=at(-6);
  const m=x=>x?x.getHours()*60+x.getMinutes():null;
  return sun?{rise:m(sun.rise),set:m(sun.set),goldAm:gold?m(gold.rise):null,goldPm:gold?m(gold.set):null,dawn:civil?m(civil.rise):null,dusk:civil?m(civil.set):null,len:Math.round((sun.set-sun.rise)/60000)}:null;
}
const WX_CODES={0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Freezing fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",56:"Freezing drizzle",57:"Freezing drizzle",
  61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Freezing rain",71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Showers",81:"Heavy showers",82:"Violent showers",85:"Snow showers",86:"Heavy snow showers",95:"Thunderstorms",96:"Thunderstorms with hail",99:"Thunderstorms with hail"};
const WX={};   // forecasts by day, kept for 30 minutes
function wxKey(d){return [d.lat,d.lon,d.date].join("|")}
function wxFor(d){
  if(d.lat===""||d.lat==null||!d.date) return null;
  const days=(new Date(d.date+"T12:00:00")-new Date(todayISO()+"T12:00:00"))/864e5; if(days<0||days>15) return {range:true};
  const k=wxKey(d), c=WX[k]; if(c&&(c.loading||Date.now()-c.at<(c.data&&c.data.error?5:30)*60000)) return c.data||null;
  WX[k]={loading:true,at:Date.now()};
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${Number(d.lat).toFixed(3)}&longitude=${Number(d.lon).toFixed(3)}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max,wind_gusts_10m_max&wind_speed_unit=mph&timezone=auto&start_date=${d.date}&end_date=${d.date}`;
  fetch(url).then(r=>r.ok?r.json():Promise.reject(new Error("forecast "+r.status))).then(j=>{
    const dl=j.daily||{}, hr=j.hourly||{};
    const call=toMin(d.call||"09:00"), wrap=Math.min(wrapMin(d),1439); const hours=[];
    (hr.time||[]).forEach((t,i)=>{const m=Number(t.slice(11,13))*60;if(m>=Math.floor(call/60)*60&&m<=wrap)hours.push({m,temp:hr.temperature_2m[i],rain:hr.precipitation_probability[i],code:hr.weather_code[i],wind:hr.wind_speed_10m[i],gust:hr.wind_gusts_10m[i]})});
    const wet=hours.filter(x=>x.rain>=40);
    WX[k]={at:Date.now(),data:{code:(dl.weather_code||[])[0],hi:(dl.temperature_2m_max||[])[0],lo:(dl.temperature_2m_min||[])[0],rain:hours.length?Math.max(...hours.map(x=>x.rain||0)):(dl.precipitation_probability_max||[])[0],
      wind:hours.length?Math.max(...hours.map(x=>x.wind||0)):(dl.wind_speed_10m_max||[])[0],gust:hours.length?Math.max(...hours.map(x=>x.gust||0)):(dl.wind_gusts_10m_max||[])[0],
      wet:wet.length?{from:wet[0].m,to:wet[wet.length-1].m+60}:null,hours}};
    renderSky(); rebuildDoc();
  }).catch(err=>{WX[k]={at:Date.now(),data:{error:String(err.message||err)}};renderSky()});
  return null;
}
function skyLine(d,long){
  if(d.lat===""||d.lat==null) return null;
  const s=sunTimes(d.date,d.lat,d.lon), w=wxFor(d), bits=[];
  const place=h("span",{class:"skyplace"},d.place||`${Number(d.lat).toFixed(2)}, ${Number(d.lon).toFixed(2)}`);
  if(s){bits.push(["Sunrise",fmt(s.rise)],["Golden hour",(s.goldPm!=null?fmt(s.goldPm):"-")+(long&&s.goldAm!=null?" (morning until "+fmt(s.goldAm)+")":"")],["Sunset",fmt(s.set)]); if(long) bits.push(["Daylight",dur(s.len)])}
  else bits.push(["Sun","no sunrise or sunset that day"]);
  if(w&&w.range) bits.push(["Weather",d.date<todayISO()?"past day":"forecast shows up to 16 days ahead"]);
  else if(w&&w.error) bits.push(["Weather","couldn't load the forecast"]);
  else if(w){bits.push(["Weather",`${WX_CODES[w.code]||"-"}, ${Math.round(w.hi)}° / ${Math.round(w.lo)}°C`],["Rain",`${Math.round(w.rain||0)}%`+(w.wet?` (likeliest ${fmt(w.wet.from)} to ${fmt(w.wet.to)})`:"")],["Wind",`${Math.round(w.wind||0)} mph`+(w.gust>=Math.max(25,(w.wind||0)+10)?`, gusts ${Math.round(w.gust)}`:"")])}
  else bits.push(["Weather","loading…"]);
  return h("div",{class:"sky"+(long?" long":"")},place,...bits.map(([k,v])=>h("span",{class:"skybit"},h("small",{},k),h("b",{},v))));
}
function renderSky(){
  const box=$("#sky"); if(!box) return; box.innerHTML=""; const d=D(); if(!d){box.hidden=true;return}
  const line=skyLine(d,false);
  if(line){box.hidden=false;box.append(line,locationButton(d,""));return}
  if(d.kind==="capture"){box.hidden=true;return}
  box.hidden=false; box.append(h("span",{class:"note"},"Weather, sunrise and sunset for this day:"),locationButton(d,""));
}
function locationButton(d,cls){return h("button",{class:"btn small "+(cls||""),onclick:e=>openLocation(d,e.currentTarget)},d.lat===""||d.lat==null?"Set location":"Change location")}
async function geocode(q){
  q=q.trim(); const ll=q.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if(ll) return [{name:`${(+ll[1]).toFixed(4)}, ${(+ll[2]).toFixed(4)}`,lat:+ll[1],lon:+ll[2]}];
  const pc=q.replace(/\s+/g,"").toUpperCase();
  if(/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(pc)){ // UK postcode
    const r=await fetch("https://api.postcodes.io/postcodes/"+encodeURIComponent(pc)); if(r.ok){const j=(await r.json()).result;if(j)return [{name:`${j.postcode}, ${j.admin_district||j.region||""}`.replace(/, $/,""),lat:j.latitude,lon:j.longitude}]}
  }
  const r=await fetch("https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&name="+encodeURIComponent(q.split(",")[0].trim()));
  if(!r.ok) throw new Error("lookup "+r.status);
  return ((await r.json()).results||[]).map(x=>({name:[x.name,x.admin1,x.country].filter(Boolean).join(", "),lat:x.latitude,lon:x.longitude}));
}
function openLocation(d,anchor){
  $$(".locpop").forEach(x=>x.remove());
  const pop=h("div",{class:"locpop",role:"dialog","aria-label":"Day location"});
  const inp=h("input",{type:"text",placeholder:"Town, UK postcode, or lat, long",value:d.place||String(d.address||"").split("\n")[0]||S.project.location||""});
  const list=h("div",{class:"locres"}), msg=h("p",{class:"note",style:"margin:.3rem 0 0"},"Only the place you type (or this device's position) is sent, to look up the forecast. Sunrise and sunset are worked out here.");
  const set=x=>{const t=S.days.find(y=>y.id===d.id);if(!t)return;if(x){t.lat=Math.round(x.lat*1e4)/1e4;t.lon=Math.round(x.lon*1e4)/1e4;t.place=x.name}else{t.lat="";t.lon="";t.place=""}commit();pop.remove();renderSky();rebuildDoc();toast(x?"Location set: "+x.name:"Location cleared")};
  const search=async()=>{if(!inp.value.trim())return;list.innerHTML="";list.append(h("p",{class:"note"},"Looking up…"));
    try{const res=await geocode(inp.value);list.innerHTML="";if(!res.length)list.append(h("p",{class:"note"},"Nothing found. Try a town name, a postcode, or lat, long."));res.forEach(x=>list.append(h("button",{class:"mi",onclick:()=>set(x)},x.name)))}
    catch(err){list.innerHTML="";list.append(h("p",{class:"note"},"Couldn't look that up ("+err.message+"). You can type lat, long instead, e.g. 51.5, -0.12."))}};
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();search()}if(e.key==="Escape")pop.remove()});
  pop.append(h("div",{class:"toolbar",style:"flex-wrap:nowrap"},inp,h("button",{class:"btn small primary",onclick:search},"Find")),list,
    h("div",{class:"toolbar",style:"margin-top:.4rem"},
      "geolocation" in navigator?h("button",{class:"btn small",onclick:()=>{list.innerHTML="";list.append(h("p",{class:"note"},"Getting this device's position…"));navigator.geolocation.getCurrentPosition(p=>set({name:"Here ("+p.coords.latitude.toFixed(3)+", "+p.coords.longitude.toFixed(3)+")",lat:p.coords.latitude,lon:p.coords.longitude}),err=>{list.innerHTML="";list.append(h("p",{class:"note"},"Couldn't get the position: "+err.message))},{timeout:10000})}},"Use where I am now"):null,
      d.lat!==""&&d.lat!=null?h("button",{class:"btn small",onclick:()=>set(null)},"Clear"):null,h("button",{class:"btn small",onclick:()=>pop.remove()},"Cancel")),msg);
  document.body.append(pop);
  const r=anchor.getBoundingClientRect(); const top=r.bottom+6+pop.offsetHeight>innerHeight?Math.max(8,r.top-pop.offsetHeight-6):r.bottom+6;
  pop.style.top=top+"px"; pop.style.left=Math.max(8,Math.min(r.left,innerWidth-pop.offsetWidth-8))+"px"; inp.focus(); inp.select();
  setTimeout(()=>document.addEventListener("pointerdown",function off(e){if(!pop.contains(e.target)&&e.target!==anchor){pop.remove();document.removeEventListener("pointerdown",off)}}),0);
}

/* ---------- shoot-ready check ---------- */
let SIM_OFFLINE=0;    // practice dropout: until this time, team saves act as if the network had gone
function readyState(){P.ready=P.ready||{};const k=pid()+"|"+((D()||{}).id||"");return P.ready[k]||(P.ready[k]={})}
function openReady(){commit();openDoc("Shoot-ready check",buildReady)}
function buildReady(b){
  const d=D(), st=readyState(); if(!d){b.append(h("p",{},"Add a day first."));return}
  const C=compute(d), shots=d.rows.filter(r=>!isBlock(r)&&!r.cut);
  const mark=(k,v)=>{st[k]=v;savePrefs();rebuildDoc()};
  const items=[];
  const item=(key,title,detail,auto,actions)=>{const ok=auto===true||(auto==null&&!!st[key]);const warn=auto===false;
    const cb=h("input",{type:"checkbox",disabled:auto!=null});cb.checked=ok;cb.addEventListener("change",()=>mark(key,cb.checked));
    items.push(h("div",{class:"rdy"+(ok?" ok":warn?" warn":"")},h("label",{class:"rdyck"},cb),h("div",{class:"rdyb"},h("b",{},title),h("small",{},detail),actions&&actions.length?h("div",{class:"toolbar"},...actions):null)));
    return ok};
  const btn=(l,fn,primary)=>h("button",{class:"btn small"+(primary?" primary":""),onclick:fn},l);
  const issues=[]; if(!d.date) issues.push("no shoot date"); if(!shots.length) issues.push("no shots");
  const noTime=shots.filter(r=>!Number(r.shoot)).length; if(noTime) issues.push(`${noTime} shot${noTime===1?" has":"s have"} no shoot time`);
  if(C.wrap>wrapMin(d)) issues.push(`scheduled to wrap ${dur(C.wrap-wrapMin(d))} past the target`);
  b.append(h("p",{class:"note"},`For ${d.name}${d.date?" ("+longDate(d.date)+")":""}. Ticks are kept on this device. Items with a grey box check themselves.`));
  item("day","The day is set up",issues.length?"Check: "+issues.join(", ")+".":`${shots.length} shots, call ${fmt(toMin(d.call||"09:00"))}, wraps ${fmt(C.wrap)} against a target of ${fmt(wrapMin(d))}.`,issues.length?false:true);
  const online=MODE==="team"&&!netErr;
  item("conn","Connected to the team site",MODE!=="team"?"This device is working on its own copy, so nobody else sees its changes.":netErr?"Not reaching the site right now: "+netErr:"Live. Everyone with the project open sees changes within a few seconds.",MODE==="team"?online:false);
  const others=typeof peopleOnline==="function"?peopleOnline():[];
  item("team","The team has joined on the devices they'll use",others.length?`Online now: ${others.map(p=>(p.name||"someone")+(p.dev?" ("+p.dev+")":"")).join(", ")}.`:"Nobody else is online. Ask each person to open the link, enter their name, and check the schedule looks right on their phone, tablet or laptop.",null);
  item("backup","Backup saved","A project file (everything, including pictures) and a PDF of the day, kept somewhere off this device. If the site or wifi fails you still have the schedule.",null,
    [btn("Download project file",async()=>{await saveFile();mark("backup",true)},true),btn("Print / save PDF of this day",()=>{$("#docModal").classList.remove("open");setTimeout(()=>window.print(),100)}),btn("Call sheet",openCallSheet)]);
  item("sound","Clap sound heard on the slating device",`Sound: ${slateCfg().sound||"clap"}. Check the volume and the silent switch on the device you'll slate from.`,null,[btn("Play the clap",()=>playClap())]);
  item("tc","Timecode source chosen",`This device: ${tcLabel()}. Jam from a Tentacle or similar in Slate View settings, or use time of day.`,null,[btn("Open Slate View",()=>{$("#docModal").classList.remove("open");openSlate()})]);
  item("awake","Screens stay on","wakeLock" in navigator?"Slate View and Note View keep the screen awake on this device. Plug in or charge the slating device.":"This browser can't keep the screen awake: set auto-lock to Never on this device.","wakeLock" in navigator?true:false);
  item("drop","Practised a dropout",SIM_OFFLINE>Date.now()?"Practice running: make a change, watch the status say Offline with changes waiting, then Live again once it's sent.":"Takes 30 seconds: the status goes Offline, your changes wait on this device, then send themselves when the connection is back. Nothing is lost.",null,
    MODE==="team"?[btn(SIM_OFFLINE>Date.now()?"Practice running…":"Practise a 30 second dropout",()=>{SIM_OFFLINE=Date.now()+30000;netErr="Practice dropout";updateStatus();toast("Practice dropout for 30 seconds: make a change and watch the status");setTimeout(()=>{SIM_OFFLINE=0;netErr="";backoff=0;scheduleFlush(50);scheduleSync(100);setTimeout(()=>{updateStatus();mark("drop",true)},1500)},30000);rebuildDoc()})]:[]);
  item("fb","Feedback alerts reach you","Send a test from the ? button (bottom left) and check it arrives the way you set up (inbox, phone, chat or email).",null,[btn("Send a test report",async()=>{try{await api("/api/feedback",{type:"question",title:"Test report from the shoot-ready check",details:"Just checking alerts arrive. You can delete this.",from:P.name||"",ctx:fbContext()},{noProject:true});toast("Test report sent");mark("fb",true)}catch(e){toast("Couldn't send: "+e.message)}})]);
  item("freeze","Freeze timings once you're rolling",isFrozen(d)?"Frozen. Ticks, takes, notes and cuts still work for everyone.":"Stops anyone dragging or retiming shots by accident during the shoot. You can unfreeze any time.",isFrozen(d)?true:null,[isFrozen(d)?null:btn("Freeze timings now",async()=>{await toggleFreeze();rebuildDoc()})].filter(Boolean));
  const n=items.filter(x=>x.classList.contains("ok")).length;
  b.append(h("div",{class:"rdyhead"},h("b",{},`${n} of ${items.length} ready`),h("div",{class:"rdybar"},h("i",{style:`width:${Math.round(n/items.length*100)}%`}))),...items);
}

/* ---------- reference / rehearsal video, by link (Google Drive first) ---------- */
// a shot's links are kept one per line in r.video; videos stay in Drive (or wherever) and play from there
// links are kept one per line; with a project base address a plain file name (SH030_rehearsal.mp4) is enough
function videoLinks(r,f="video"){return String((r&&r[f])||"").split(/\s*[\n,]\s*|\s+(?=https?:|ftp:|<iframe)/i).map(s=>s.trim()).filter(Boolean).filter(s=>/^(https?:|ftp:)\/\//i.test(s)||/<iframe/i.test(s)||(vidBase()&&/\.\w{2,5}$/.test(s)))}
function vidBase(){const b=String((S&&S.project&&S.project.vidBase)||"").trim();return /^https?:\/\//i.test(b)?b.replace(/\/*$/,"/"):""}
// the Google account to open Drive files with is each person's own, kept on their device per project (never shared)
function vidAccount(){return String(((P.vidAccounts||{})[pid()])||"").trim()}
function setVidAccount(v){P.vidAccounts=P.vidAccounts||{};v=String(v||"").trim();if(v)P.vidAccounts[pid()]=v;else delete P.vidAccounts[pid()];savePrefs()}
function withAccount(u){const a=vidAccount();if(!a)return u;try{const x=new URL(u);x.searchParams.set("authuser",a);return x.toString()}catch(e){return u}}
function videoUrl(s){ if(/^(https?:|ftp:)/i.test(s)) return s; const m=s.match(/<iframe[^>]+src=["']([^"']+)["']/i); if(m) return m[1].replace(/&amp;/g,"&"); return vidBase()?vidBase()+s.split("/").map(encodeURIComponent).join("/"):s; }
function videoEmbed(raw){
  const url=videoUrl(raw); let m;
  if(/<iframe/i.test(raw)&&!/^https:\/\//i.test(url)) return {kind:"link",src:"",open:"#",name:"Embed code without an https address"};
  if(/<iframe/i.test(raw)) return {kind:"embed",src:url,open:url,name:(()=>{try{return new URL(url).hostname.replace(/^www\./,"")}catch(e){return "Embedded player"}})()};
  if(/^ftp:/i.test(url)) return {kind:"ftp",src:url,open:url,name:"FTP"};
  if((m=url.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]{10,})/))) return {kind:"drive",src:withAccount(`https://drive.google.com/file/d/${m[1]}/preview`),open:withAccount(`https://drive.google.com/file/d/${m[1]}/view`),name:"Drive video"};
  if((m=url.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([\w-]{10,})/))) return {kind:"folder",src:withAccount(`https://drive.google.com/embeddedfolderview?id=${m[1]}#grid`),open:withAccount(url),name:"Drive folder"};
  if((m=url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/))) return {kind:"youtube",src:`https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`,open:url,name:"YouTube"};
  if((m=url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]+))?/))) return {kind:"vimeo",src:`https://player.vimeo.com/video/${m[1]}${m[2]?"?h="+m[2]:""}`,open:url,name:"Vimeo"};
  if((m=url.match(/app\.box\.com\/s\/(\w+)/))) return {kind:"embed",src:`https://app.box.com/embed/s/${m[1]}`,open:url,name:"Box"};
  if(/dropbox\.com\//i.test(url)){ try{const u=new URL(url); u.searchParams.delete("dl"); u.searchParams.set("raw","1"); return {kind:"file",src:u.toString(),open:url,name:"Dropbox video"};}catch(e){} }
  if(/\.(mp4|m4v|mov|webm|ogv)(\?|#|$)/i.test(url)) return {kind:"file",src:url,open:url,name:decodeURIComponent(url.split(/[?#]/)[0].split("/").pop())};
  return {kind:"link",src:url,open:url,name:(()=>{try{return new URL(url).hostname.replace(/^www\./,"")}catch(e){return "Link"}})()};
}
/* Settings > Project: where this project's videos live, shared with the team */
const VID_SOURCES=[["","Choose…"],["drive","Google Drive"],["dropbox","Dropbox"],["onedrive","OneDrive or SharePoint"],["box","Box"],["server","Our own server or NAS (web address)"],["other","Something else"]];
function renderVideoSettings(b){
  const pr=S.project, src=pr.vidSource||"";
  const sel=h("select",{}); VID_SOURCES.forEach(([v,l])=>sel.append(h("option",{value:v},l))); sel.value=src;
  sel.addEventListener("change",()=>{S.project.vidSource=sel.value;commit();renderSetTab()});
  const field=(k,label,ph,type)=>{const i=h("input",{type:type||"text",value:pr[k]||"",placeholder:ph,spellcheck:"false"});bindDoc(i,null,v=>{S.project[k]=v.trim()});return h("label",{},label,i)};
  const f=h("div",{class:"form"},h("label",{},"Videos and files are shared through",sel));
  const tips={drive:"Paste Drive file links into each shot (Note View or the Reference video column). If you're signed into several Google accounts, enter the one that can see this project's files: Drive then opens them with it instead of whichever account is first. That's your own setting; each person enters theirs, and nobody else sees it.",
    dropbox:"Paste Dropbox file links; they play with speed, frame steps, loop and mirror.",
    onedrive:"In OneDrive or SharePoint choose the video, then Embed, and paste the whole embed code into the shot. Plain share links open in a new tab.",
    box:"Paste Box shared links; they play in Box's own player.",
    server:"Give the web address of the project's folder (https://…). The team can then type just a file name for each shot, such as SH030_rehearsal.mp4. Browsers can't play from FTP: most NAS and FTP hosts can also share over HTTPS, which is what's needed here.",
    other:"Paste any link. Video files (.mp4, .mov, .webm) play in place; embed codes (<iframe…>) play in their own player; anything else opens in a new tab."};
  if(src==="drive"){ const i=h("input",{type:"email",value:vidAccount(),placeholder:"you@company.com",spellcheck:"false"});
    i.addEventListener("change",()=>{setVidAccount(i.value);const vh=$("#nvVideoHost");if(vh)vh.dataset.key="";toast(i.value.trim()?"Drive videos will open with "+i.value.trim()+" on this device":"Drive videos open with your default Google account")});
    f.append(h("label",{},"Your Google account for this project",i,h("small",{class:"note"},"Just for you, on this device. Everyone sets their own."))); }
  if(src==="server") f.append(field("vidBase","Web address of the video folder","https://files.example.com/project/videos/","url"));
  if(src) f.append(field("vidFolder","Project video folder (link, for the team to browse)","https://…","url"));
  b.append(h("h3",{style:"margin-top:1.2rem"},"Reference video"),h("p",{class:"note"},"Rehearsal and reference videos stay where they're stored; each shot only keeps the link. "+(tips[src]||"Pick where this project keeps its videos. Each project can use a different place or Google account.")),f);
}
const VID={i:0,key:null};
function setVideoLinks(id,links,f="video"){const x=R(id);if(!x)return;x[f]=links.join("\n");commit()}
// opt.field: which links (a shot's "video", a sequence's "seqVideo"); opt.host: where the player lives
function videoSection(r,opt={}){
  const F=opt.field||"video", hostSel=opt.host||"#nvVideoHost", redraw=()=>{const x=R(r.id);if(x)updateVideoHost(x,opt)};
  const links=videoLinks(r,F); const vk=F+"|"+r.id; if(VID.key!==vk){VID.key=vk;VID.i=0} if(VID.i>=links.length) VID.i=Math.max(0,links.length-1);
  const sec=h("div",{class:"nvvideo"},h("h3",{},"Reference video"));
  const stage=h("div",{class:"vstage"}), ctl=h("div",{class:"vctl"});
  const main=h("div",{});
  if(links.length>1) main.append(h("div",{class:"vtabs",role:"tablist"},...links.map((u,i)=>h("button",{role:"tab","aria-selected":String(i===VID.i),onclick:()=>{VID.i=i;redraw()}},"Video "+(i+1)))));
  main.append(stage,ctl);
  if(!links.length) stage.hidden=true;
  else{
    const e=videoEmbed(links[VID.i]);
    if(e.kind==="file"){
      const v=h("video",{src:e.src,controls:"",playsinline:"",preload:"metadata"}); stage.append(v);
      v.playbackRate=Number(P.vidRate)||1; v.loop=P.vidLoop!==false; if(P.vidMirror) v.classList.add("mirror");
      const rate=x=>h("button",{class:"btn small","aria-pressed":String((Number(P.vidRate)||1)===x),onclick:()=>{P.vidRate=x;savePrefs();v.playbackRate=x;$$(".rate",ctl).forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.r)===x)))},"data-r":String(x)},x===1?"1x":x+"x");
      const rates=[0.25,0.5,1].map(x=>{const b=rate(x);b.classList.add("rate");return b});
      const step=dir=>{v.pause();v.currentTime=Math.max(0,v.currentTime+dir/(slateFps()||25))};
      const loop=h("button",{class:"btn small","aria-pressed":String(v.loop),onclick:()=>{v.loop=!v.loop;P.vidLoop=v.loop;savePrefs();loop.setAttribute("aria-pressed",String(v.loop))}},"Loop");
      const mir=h("button",{class:"btn small","aria-pressed":String(!!P.vidMirror),onclick:()=>{P.vidMirror=!P.vidMirror;savePrefs();v.classList.toggle("mirror",P.vidMirror);mir.setAttribute("aria-pressed",String(P.vidMirror))}},"Mirror");
      ctl.append(h("span",{class:"note"},"Speed"),...rates,h("button",{class:"btn small",title:"Back one frame",onclick:()=>step(-1)},"‹ frame"),h("button",{class:"btn small",title:"Forward one frame",onclick:()=>step(1)},"frame ›"),loop,mir);
      v.addEventListener("error",()=>{stage.innerHTML="";stage.append(h("div",{class:"vempty",style:"position:absolute;inset:0"},"This video wouldn't play here. Check the link opens for you, or open it in a new tab."))});
    }else if(e.kind==="ftp"){
      stage.append(h("div",{class:"vempty",style:"position:absolute;inset:0"},h("div",{},"Browsers can't play from FTP. Ask for an HTTPS link to the file, or ",h("a",{href:e.open,target:"_blank",rel:"noopener noreferrer",style:"color:#fff"},"open the FTP link"),".")));
    }else if(e.kind==="link"){
      stage.append(h("div",{class:"vempty",style:"position:absolute;inset:0"},h("div",{},"This link can't play inside the app (",e.name,"). ",h("a",{href:links[VID.i],target:"_blank",rel:"noopener noreferrer",style:"color:#fff"},"Open it in a new tab"),".")));
    }else{
      stage.append(h("iframe",{src:e.src,allow:"autoplay; fullscreen; picture-in-picture",allowfullscreen:"",referrerpolicy:"no-referrer-when-downgrade",title:"Reference video for shot "+(r.shot||"")}));
      if(e.kind==="drive") ctl.append(h("span",{class:"note"},"Playing from Google Drive"+(vidAccount()?" as "+vidAccount():"")+". Speed, quality and full screen are in Drive's own player; it only plays for people who can open the file. ",h("a",{href:"#",onclick:ev=>{ev.preventDefault();if($("#seqView").classList.contains("open"))closeSeqView();else closeNotes();openSettings&&openSettings("project")}},vidAccount()?"Change account":"Pick which Google account")));
      if(e.kind==="folder") ctl.append(h("span",{class:"note"},"A Drive folder: pick a video and it opens in a new tab. Link each shot to its own file to play it here."));
    }
  }
  // the links: add, open, remove
  const list=h("div",{class:"vlist"});
  links.forEach((u,i)=>list.append(h("div",{},h("a",{href:videoEmbed(u).open,target:"_blank",rel:"noopener noreferrer",title:videoUrl(u)},"Video "+(i+1)+": "+(/^https?:|<iframe/i.test(u)?videoEmbed(u).name:u)),
    h("button",{title:"Remove this link","aria-label":"Remove video "+(i+1),onclick:()=>{setVideoLinks(r.id,links.filter((x,j)=>j!==i),F);redraw()}},"✕"))));
  const ph={drive:"Paste a Google Drive link",dropbox:"Paste a Dropbox link",onedrive:"Paste the OneDrive embed code",box:"Paste a Box link",server:"Type a file name or paste a link"}[S.project.vidSource]||"Paste a Google Drive or other video link";
  const inp=h("input",{type:"text",placeholder:ph,spellcheck:"false"});
  const add=()=>{const v=inp.value.trim(); if(!v) return; if(!videoLinks({video:v}).length){toast(vidBase()?"Type a file name with its extension, or paste a link":"That doesn't look like a link. To type file names, set a web address in Settings, Project");return}
    setVideoLinks(r.id,[...links,v],F); VID.i=links.length; redraw(); toast(videoEmbed(v).kind==="link"?"Link saved: it opens in a new tab":(F==="seqVideo"?"Video added to "+seqTitle(r):"Video added to shot "+(r.shot||"")))};
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();add()}});
  inp.addEventListener("paste",()=>setTimeout(add,30));
  sec.append(h("div",{class:"vwrap"},main,h("div",{class:"vside"},list,inp,h("button",{class:"btn small",onclick:add},links.length?"+ Add another video":"Add video"),
    S.project.vidFolder?h("a",{class:"btn small",href:withAccount(S.project.vidFolder),target:"_blank",rel:"noopener noreferrer"},"Open the project's video folder"):null,
    h("p",{class:"note",style:"margin:0"},(S.project.vidSource==="server"?"Type the file's name as it is in the project folder.":S.project.vidSource==="onedrive"?"In OneDrive: the video, Embed, then copy the code.":"In Drive: right-click the video, Share, then Copy link. Share it with the team (or set it to Anyone with the link) so it plays for everyone.")+" Each shot can have several videos. Where they're kept is set per project in Settings, Project.")) ));
  return sec;
}
function updateVideoHost(r,opt={}){
  const F=opt.field||"video"; const host=$(opt.host||"#nvVideoHost"); if(!host) return; const pr=S.project||{}; const key=F+"|"+r.id+"|"+(r[F]||"")+"|"+VID.i+"|"+[pr.vidSource,vidAccount(),pr.vidFolder,pr.vidBase].join("|");
  host.classList.toggle("has-video",videoLinks(r,F).length>0);
  if(host.dataset.key===key) return; host.dataset.key=key; host.innerHTML=""; host.append(...videoSection(r,opt).childNodes); if(!opt.host){ cardControls(host); applyNvLayout(); }
}
// in the table: the links, plus ▶ to open the shot in Note View
function videoCell(r){
  const w=h("div",{class:"videocell"});
  const i=h("input",{class:"cell",type:"text",placeholder:vidBase()?"File name or link":"Video link",value:videoLinks(r).join(", "),"data-k":"video",spellcheck:"false",title:"Video links (or file names, with a web address set in Settings, Project), separated by commas"});
  i.addEventListener("change",()=>{const x=R(r.id);if(!x)return;x.video=videoLinks({video:i.value}).join("\n");commit();renderBody()});
  w.append(i); if(videoLinks(r).length) w.append(h("button",{class:"play",title:"Play in Note View",onclick:()=>{NV.id=r.id;openNotes(r.id)}},"▶"+(videoLinks(r).length>1?" "+videoLinks(r).length:"")));
  return w;
}

/* ---------- Status in the first column: To do / Setting up / Rolling / Shooting / Shot / Cut ---------- */
let NOWCUR=null;
// the shot (or sequence's first shot) we're on: the live one on the shoot day, otherwise only one picked by hand
function nowCurId(d,C){ const L=liveStatus(d,C); const c=L?L.cur:(d.onRow&&R(d.onRow)); if(!c||c.done) return null; return c.seq&&R(c.seq)?seqAnchor(c).id:c.id; }
function rowStatus(r,cur){
  if(r.cut) return "cut"; if(r.done) return "shot";
  const t=r.seq&&R(r.seq)?seqAnchor(r):r; if(rollingTake(t)) return "rolling";
  if(cur&&t.id===cur) return takeList(t).some(x=>x.at&&Date.now()-x.at<16*3600e3)?"shooting":"setup";
  return "todo";
}
const STATUS_LABEL={todo:"To do",setup:"Setting up",rolling:"● Rolling",shooting:"Shooting",shot:"Shot ✓",cut:"Cut"};
function statusChip(r,cur){ const st=rowStatus(r,cur);
  return h("button",{class:"stchip st-"+st,"data-k":"status","data-status":st,"data-short":{todo:"○",setup:"◐",rolling:"●",shooting:"◑",shot:"✓",cut:"✕"}[st],title:"Status: "+STATUS_LABEL[st].replace("● ","")+". Click to change","aria-label":"Status "+STATUS_LABEL[st].replace("● ",""),onclick:e=>{e.stopPropagation();statusMenu(e.currentTarget,r.id)}},STATUS_LABEL[st]); }
function afterStatus(){ commit(); renderBody(); renderStats(compute()); renderDayTabs(); refreshViews(); }
function statusMenu(anchor,id){
  $$(".locpop").forEach(x=>x.remove()); const r=R(id); if(!r) return; const d=D(); const t=r.seq&&R(r.seq)?seqAnchor(r):r;
  const st=rowStatus(r,nowCurId(d,compute())), rolling=rollingTake(t);
  const pop=h("div",{class:"locpop seqmenu",role:"menu"}); const close=()=>pop.remove();
  const item=(label,fn,sub,on)=>h("button",{class:"mi"+(on?" on":""),role:"menuitem",onclick:()=>{close();fn()}},label,sub?h("small",{}," "+sub):null);
  const undone=x=>{x.done=false;x.doneAt=null};
  pop.append(h("div",{class:"note",style:"margin:0 .3rem .3rem"},(t.seq?seqTitle(t)+" · shot ":"Shot ")+(r.shot||"-")));
  pop.append(
    item("To do",()=>{const x=R(id);undone(x);x.cut=false;t.setupAt=null;if(d.onRow===t.id){d.onRow="";d.onSince=null}afterStatus()},"",st==="todo"),
    item("Setting up",()=>{const x=R(id);undone(x);x.cut=false;d.onRow=t.id;d.onSince=Date.now();t.setupAt=Date.now();afterStatus();toast("Setting up: ahead / behind counts from now until you roll")},"we're on it, not rolling yet",st==="setup"),
    rolling?item("■ Cut take",()=>{cutTake(t.id);afterStatus()},"end take "+rolling.n+" (timecode out)")
           :item("● Roll",()=>{const x=R(id);undone(x);x.cut=false;logTake(t.id,t.seq&&d.kind!=="capture"?{caught:[]}:{});afterStatus()},"start take "+nextTake(t,d)+(t.seq?" of the sequence":""),st==="rolling"),
    item("Shot ✓",()=>{const x=R(id);if(rollingTake(t))cutTake(t.id);x.done=true;x.doneAt=dayClock(d);x.cut=false;afterStatus()},t.seq?"just this shot (Sequence done ticks them all)":"",st==="shot"),
    item(r.cut?"Not cut":"Cut shot",()=>{setCut([id],!r.cut);renderStats(compute());refreshViews()},r.cut?"back in the schedule":"out of the schedule (Undo brings it back)",false));
  document.body.append(pop);
  const b=anchor.getBoundingClientRect(); const top=b.bottom+6+pop.offsetHeight>innerHeight?Math.max(8,b.top-pop.offsetHeight-6):b.bottom+6;
  pop.style.top=top+"px"; pop.style.left=Math.max(8,Math.min(b.left,innerWidth-pop.offsetWidth-8))+"px";
  setTimeout(()=>document.addEventListener("pointerdown",function off(e){if(!pop.contains(e.target)){pop.remove();document.removeEventListener("pointerdown",off)}}),0);
}

/* ---------- "We're on this shot": the live ahead / behind works from it ---------- */
function onNowBtn(r){
  const d=D(); const L=d&&liveStatus(d,compute());
  if(isOnNow(r)) return h("span",{class:"onnow on",title:L?L.basis:""},"● On now · "+({setup:"setting up",rolling:"rolling",shooting:"shooting"}[L&&L.phase]||""));
  return h("button",{class:"onnow",title:"Say this is the shot (or sequence) you're on: until you roll it counts as setting up, so ahead / behind is right",onclick:e=>{e.stopPropagation();setOnNow(r.id)}},"We're on this");
}

/* ---------- takes: remove (with Undo) and rename (double-click the take number) ---------- */
function deleteTake(rowId,n,redraw){
  const x=R(rowId); if(!x) return; const l=takeList(x); if(!l.some(z=>z.n===n)) return;
  setTakeList(x,l.filter(z=>z.n!==n)); x.takes=Math.max(0,(Number(x.takes)||0)-1); syncMarks(x); commit(); redraw&&redraw();
  toast("Take "+n+" removed",{label:"Undo",fn:()=>undo()});
}
function takeLabel(rowId,t,redraw){
  const b=h("b",{class:"takelab",title:"Double-click to renumber or rename this take"},"T"+t.n,t.name?h("small",{},t.name):null);
  b.addEventListener("dblclick",e=>{e.stopPropagation();editTake(b,rowId,t.n,redraw)});
  return b;
}
function editTake(el,rowId,n,redraw,focus){
  const x=R(rowId); if(!x) return; const t=takeList(x).find(z=>z.n===n); if(!t) return; const f=findRow(rowId);
  const auto=shotName(x,f&&f.d,n)||"", fps=slateFps();
  const num=h("input",{type:"number",min:"1",step:"1",value:String(n),style:"width:4.2rem","aria-label":"Take number"});
  const nm=h("input",{type:"text",value:t.name||"",placeholder:auto||"Clip name",style:"width:min(22rem,60vw)","aria-label":"Clip name (leave empty for the automatic name)"});
  // timecode in / out: fix a late roll or an early cut (HH:MM:SS:FF; the length is worked out again)
  const tin=h("input",{type:"text",value:t.tc||"",placeholder:"TC in 10:00:00:00",style:"width:8.6rem",class:"mono","aria-label":"Timecode in"});
  const tout=h("input",{type:"text",value:t.out||"",placeholder:"TC out",style:"width:8.6rem",class:"mono","aria-label":"Timecode out"});
  const box=h("span",{class:"takeedit"},"T",num,nm,h("span",{class:"note"},"in"),tin,h("span",{class:"note"},"out"),tout,h("button",{class:"btn small primary",onclick:()=>save()},"Save"),h("button",{class:"btn small",onclick:()=>redraw&&redraw()},"Cancel"));
  const save=()=>{ const y=R(rowId); if(!y) return; const l=takeList(y); const it=l.find(z=>z.n===n); if(!it) return;
    const nn=Math.max(1,Math.round(Number(num.value)||n));
    if(nn!==n&&l.some(z=>z.n===nn)){ toast("There's already a take "+nn+" on this "+(y.seq?"sequence":"shot")); num.focus(); return; }
    const vi=tin.value.trim(), vo=tout.value.trim(), pi=vi?parseTc(vi,fps):null, po=vo?parseTc(vo,fps):null;
    if(vi&&pi==null){ toast(`TC in should look like 10:00:00:00 (at ${Math.round(fps)} fps)`); tin.focus(); return; }
    if(vo&&po==null){ toast(`TC out should look like 10:00:30:00 (at ${Math.round(fps)} fps)`); tout.focus(); return; }
    const tcChanged=(vi?tcString(pi,fps):"")!==(it.tc||"")||(vo?tcString(po,fps):"")!==(it.out||"");
    if(tcChanged){ it.tc=vi?tcString(pi,fps):""; if(vo){ it.out=tcString(po,fps); if(pi!=null){ let ms=po-pi; if(ms<0) ms+=864e5; it.ms=ms; it.len=fmtDur(ms); } } else { delete it.out; delete it.ms; delete it.len; } }
    it.n=nn; const v=nm.value.trim(); if(v&&v!==auto) it.name=v; else delete it.name;
    l.sort((a,b)=>a.n-b.n); setTakeList(y,l); syncMarks(y); commit(); redraw&&redraw(); toast(nn!==n?`Take ${n} is now take ${nn}`:tcChanged?`Take ${nn} timecode updated${it.len?" ("+it.len+")":""}`:"Take renamed",{label:"Undo",fn:()=>undo()}); };
  [num,nm,tin,tout].forEach(i=>i.addEventListener("keydown",e=>{e.stopPropagation(); if(e.key==="Enter"){e.preventDefault();save()} if(e.key==="Escape"){e.preventDefault();redraw&&redraw()}}));
  el.replaceWith(box); const first=focus==="tc"?tin:num; first.focus(); first.select();
}
// double-click a take's timecode to correct it
function tcEditable(span,rowId,n,redraw){ span.title="Double-click to correct the timecode"; span.style.cursor="text";
  span.addEventListener("dblclick",e=>{e.stopPropagation();const lab=span.closest(".nvtake")&&span.closest(".nvtake").querySelector(".takelab");if(lab)editTake(lab,rowId,n,redraw,"tc")}); return span; }

/* ---------- sequences: shots grouped and shot in one go ----------
   A sequence is the shots sharing r.seq; its first shot (the anchor, whose id is the sequence id) carries the
   sequence's takes, name and notes, so Slate, Roll / Cut, timecode, take counts and exports all work as for a shot.
   Its DIT name uses the shot range. On Live Action days each take records which shots it caught. */
function seqMembers(r,d){ if(!r||!r.seq) return []; const f=findRow(r.id); d=d||(f&&f.d); if(!d) return []; return d.rows.filter(x=>x.seq===r.seq&&!isBlock(x)); }
function seqAnchor(r){ if(!r||!r.seq) return r; const f=findRow(r.seq); return f&&f.r.seq===r.seq?f.r:r; }
function seqRange(a,d){ const f=findRow(a.id); d=d||(f&&f.d); if(!d) return ""; const m=seqMembers(a,d); if(!m.length) return ""; if(m.length<2) return shotNumber0(m[0],d);
  const nums=m.map(x=>shotNumber0(x,d)).sort(COLLATE.compare); const all=d.rows.filter(x=>!isBlock(x)); const idx=m.map(x=>all.indexOf(x));
  // next to each other in the shot list: lowest to highest number; spread out: each one
  const together=idx.every((v,i)=>!i||v===idx[i-1]+1); return together?nums[0]+"-"+nums[nums.length-1]:nums.join("+"); }
function seqTitle(a){ return (a&&a.seqName)||("Shots "+(seqRange(a)||"")); }
function seqColor(id){ return colorFor("seq"+id); }
function seqAnyVcs(a){ return seqMembers(a).some(x=>x.vcs); }
function seqCoverage(a){ const mem=seqMembers(a), caught=new Map();
  for(const t of takeList(a)){ if(t.mark==="ng") continue; for(const id of (t.caught||[])){ if(!caught.has(id)) caught.set(id,[]); caught.get(id).push(t.n); } }
  return {mem,caught,missing:mem.filter(m=>!caught.has(m.id))}; }
function seqCell(r){
  const w=h("span",{class:"seqcell"});
  if(r.seq){ const a=seqAnchor(r); w.append(seqChip(a,r.id===a.id?h("small",{}," · "+takeList(a).length+" take"+(takeList(a).length===1?"":"s")):null)); }
  w.append(h("button",{class:r.seq?"seqmore":"seqadd",title:r.seq?"Move this shot to another sequence, or take it out":"Put this shot in a sequence","aria-label":"Sequence options",onclick:e=>{e.stopPropagation();seqMenu(e.currentTarget,r.id)}},r.seq?"▾":"+"));
  return w;
}
// the sequence's name as a chip: click opens Sequence View, double-click renames it in place
function seqChip(a,extra){
  const chip=h("button",{class:"seqchip",style:`--seq:${seqColor(a.seq)}`,title:"Click: Sequence View · Double-click: rename"},seqTitle(a),extra||null);
  let t=null; chip.addEventListener("click",e=>{e.stopPropagation();clearTimeout(t);t=setTimeout(()=>openSeqView(a.seq),260)});
  chip.addEventListener("dblclick",e=>{e.preventDefault();e.stopPropagation();clearTimeout(t);renameSeqInline(chip,a.id)});
  return chip;
}
function renameSeqInline(el,id){
  if(frozenNo()) return; const a=R(id); if(!a) return;
  const i=h("input",{type:"text",value:a.seqName||"",placeholder:"Sequence name",maxlength:"60",class:"seqrename","aria-label":"Sequence name"});
  let done=false; const save=keep=>{ if(done) return; done=true; const v=i.value.trim(); if(keep&&v!==(a.seqName||"")){ const x=R(id); if(x){x.seqName=v;commit();toast(v?"Renamed to "+v:"Name cleared")} } renderAll(); if($("#seqView").classList.contains("open")) renderSeqView(); };
  i.addEventListener("keydown",e=>{e.stopPropagation(); if(e.key==="Enter"){e.preventDefault();save(true)} if(e.key==="Escape"){e.preventDefault();save(false)}});
  i.addEventListener("blur",()=>save(true)); i.addEventListener("click",e=>e.stopPropagation());
  el.replaceWith(i); i.focus(); i.select();
}
// one shot's sequence: move it to another, take it out, or start a new one with it
function seqMenu(anchor,id){
  $$(".locpop").forEach(x=>x.remove()); const f=findRow(id); if(!f) return; const d=f.d, r=f.r;
  const pop=h("div",{class:"locpop seqmenu",role:"menu"}); const close=()=>pop.remove();
  const item=(label,fn,sub)=>h("button",{class:"mi",role:"menuitem",onclick:()=>{close();fn()}},label,sub?h("small",{}," "+sub):null);
  const others=daySeqs(d).filter(a=>a.seq!==r.seq);
  pop.append(h("div",{class:"note",style:"margin:0 .3rem .3rem"},"Shot "+(r.shot||"-")+(r.seq?" · in "+seqTitle(seqAnchor(r)):"")));
  if(r.seq) pop.append(item("Open Sequence View",()=>openSeqView(r.seq)),item("Rename this sequence",()=>{const c=$(`#grid tr.seqhead[data-seq="${r.seq}"] .seqchip`);if(c)renameSeqInline(c,r.seq)}));
  if(others.length){ pop.append(h("div",{class:"note",style:"margin:.4rem .3rem .2rem"},r.seq?"Move to":"Add to"));
    for(const a of others) pop.append(item(seqTitle(a),()=>moveToSeq(id,a.id),seqRange(a,d))); }
  pop.append(item("New sequence with this shot",()=>moveToSeq(id,"new")));
  if(r.seq) pop.append(item("Take it out of the sequence",()=>moveToSeq(id,"")));
  if(!r.seq) pop.append(item("Group with other shots…",()=>openSeqDialog(id)));
  document.body.append(pop);
  const b=anchor.getBoundingClientRect(); const top=b.bottom+6+pop.offsetHeight>innerHeight?Math.max(8,b.top-pop.offsetHeight-6):b.bottom+6;
  pop.style.top=top+"px"; pop.style.left=Math.max(8,Math.min(b.left,innerWidth-pop.offsetWidth-8))+"px";
  setTimeout(()=>document.addEventListener("pointerdown",function off(e){if(!pop.contains(e.target)){pop.remove();document.removeEventListener("pointerdown",off)}}),0);
}
function moveToSeq(id,target){
  if(frozenNo()) return; const f=findRow(id); if(!f) return; const d=f.d, r=f.r; commit();
  const SEQF=["seqName","takeLog","seqNotes","seqTime","seqSetup","seqShoot","seqVideo"], blank={seqName:"",takeLog:"",seqNotes:"",seqTime:false,seqSetup:0,seqShoot:0,seqVideo:""};
  // leaving: if it was the sequence's first shot, the sequence's takes, name and timing pass to the next one
  if(r.seq){ const a=seqAnchor(r), rest=seqMembers(a,d).filter(x=>x.id!==r.id);
    if(a.id===r.id&&rest.length){ const na=rest[0]; for(const k of SEQF) na[k]=r[k]; na.takes=r.takes; rest.forEach(x=>x.seq=na.id); }
    // its takes went with the sequence; a sequence of one keeps them on the shot
    if(a.id===r.id){ if(rest.length){ Object.assign(r,blank); r.takes=0; } else Object.assign(r,{seqName:"",seqNotes:"",seqTime:false,seqSetup:0,seqShoot:0}); }
    r.seq=""; }
  let msg="";
  if(target==="new"){ const names=new Set(daySeqs(d).map(x=>x.seqName)); let n=1; while(names.has("Sequence "+n)) n++; r.seq=r.id; r.seqName="Sequence "+n; msg=`Shot ${r.shot||""} starts ${r.seqName}: double-click its name to rename it`; }
  else if(target){ const ta=R(target); if(ta){ r.seq=ta.seq; msg=`Shot ${r.shot||""} moved to ${seqTitle(ta)}`; } }
  else msg=`Shot ${r.shot||""} taken out of the sequence`;
  commit(); renderAll(); if($("#seqView").classList.contains("open")) renderSeqView(); toast(msg+" - Undo to put it back");
}
// group: pick the shots on this day that are shot together
function openSeqDialog(rowId){
  const f=findRow(rowId); if(!f) return; const d=f.d, r=f.r; if(frozenNo()) return;
  const shots=d.rows.filter(x=>!isBlock(x)); const cur=r.seq?seqAnchor(r):null;
  const pick=new Set(cur?seqMembers(cur,d).map(x=>x.id):[r.id,(shots[shots.indexOf(r)+1]||{}).id].filter(Boolean));
  const m=h("div",{class:"modal open",id:"seqModal"}), box=h("div",{class:"box",style:"max-width:36rem"}); m.append(box);
  const close=()=>m.remove();
  const name=h("input",{type:"text",value:cur?cur.seqName||"":"",placeholder:"e.g. Tavern fight",maxlength:"60"});
  const list=h("div",{class:"seqpick"});
  shots.forEach(x=>{ const cb=h("input",{type:"checkbox"}); cb.checked=pick.has(x.id); cb.addEventListener("change",()=>{cb.checked?pick.add(x.id):pick.delete(x.id);upd()});
    const other=x.seq&&(!cur||x.seq!==cur.seq)?h("small",{class:"note"}," (in "+seqTitle(seqAnchor(x))+")"):null;
    list.append(h("label",{},cb,h("b",{},x.shot||"-"),h("span",{}," "+String(x.action||x.description||"").slice(0,70)),other)); });
  const info=h("p",{class:"note"}); const save=h("button",{class:"btn primary"},cur?"Save":"Group");
  const upd=()=>{ const n=pick.size; save.disabled=n<2; info.textContent=n<2?"Tick at least two shots.":`${n} shots. Takes are logged once for the sequence; on Live Action days you tick which shots each take caught.`; };
  save.onclick=()=>{ applySeq(d,cur,[...pick],name.value.trim()); close(); };
  box.append(h("button",{class:"btn small close",onclick:close},"Close"),h("h2",{},cur?"Sequence":"Group into a sequence"),
    h("p",{class:"note"},"Shots you shoot in one go. They keep their own rows and storyboards; the sequence gets one set of takes and a DIT name covering the shot range."),
    h("label",{class:"stack"},"Name (optional)",name),list,info,
    h("div",{class:"toolbar"},save,cur?h("button",{class:"btn",onclick:()=>{applySeq(d,cur,[],"");close()}},"Ungroup"):null,h("button",{class:"btn",onclick:close},"Cancel")));
  document.body.append(m); upd(); name.focus();
  m.addEventListener("click",e=>{if(e.target===m)close()});
}
function applySeq(d,cur,ids,name){
  commit();
  const keep=d.rows.filter(x=>ids.includes(x.id)&&!isBlock(x));   // in day order
  const oldMem=cur?seqMembers(cur,d):[];
  for(const x of oldMem) if(!ids.includes(x.id)) x.seq="";
  if(keep.length<2){ for(const x of keep) x.seq=""; if(cur){cur.seqName="";} commit(); renderAll(); toast(cur?"Ungrouped - Undo to put it back":"Pick at least two shots"); return; }
  const anchor=keep[0];
  // the sequence's takes, name and notes live on its first shot; if that changes they move with it
  if(cur&&cur.id!==anchor.id){ for(const k of ["takeLog","seqNotes","seqVideo"]) {anchor[k]=cur[k]||"";cur[k]=""} anchor.takes=cur.takes; cur.takes=0; cur.seqName=""; }
  // shots taken from another sequence leave it (that sequence keeps going if it still has two shots)
  for(const x of keep){ if(x.seq&&x.seq!==(cur&&cur.seq)){ const other=seqAnchor(x); x.seq=""; const rest=seqMembers(other,d).filter(y=>y.id!==x.id); if(rest.length<2) rest.forEach(y=>y.seq=""); else if(other.id===x.id){ const na=rest[0]; for(const y of rest) y.seq=na.id; na.seqName=x.seqName; na.takeLog=x.takeLog; na.takes=x.takes; na.seqNotes=x.seqNotes; x.takeLog=""; x.takes=0; x.seqName=""; x.seqNotes=""; } } }
  for(const x of keep) x.seq=anchor.id;
  anchor.seqName=name;
  commit(); renderAll(); toast(`${cur?"Updated":"Grouped"} ${keep.length} shots as ${name||"a sequence"} - Undo to take it back`);
}
/* ---------- sequence rows in the table: fold, time as one, duplicate ---------- */
function seqTimedRow(r){ if(!r||!r.seq) return false; const a=R(r.seq); return !!(a&&a.seq===a.id&&a.seqTime); }
function seqFolded(id){ return !!((P.seqFold||{})[id]); }
function setFold(id,on){ P.seqFold=P.seqFold||{}; if(on) P.seqFold[id]=true; else delete P.seqFold[id]; savePrefs(); renderBody(); }
function seqSpan(a,C,d){ const m=seqMembers(a,d).filter(x=>!x.cut); if(!m.length) return null; const cs=m.map(x=>C.rows[x.id]).filter(Boolean);
  return {start:Math.min(...cs.map(c=>c.setupStart)),end:Math.max(...cs.map(c=>c.end)),su:cs.reduce((t,c)=>t+c.su,0),sh:cs.reduce((t,c)=>t+c.sh,0)}; }
// switch a sequence between per-shot timings and one setup / shoot for the whole sequence (the shots' own times are kept for switching back)
function setSeqTime(id,on){ if(frozenNo()) return; const a=R(id); if(!a) return; const d=findRow(id).d;
  if(on&&!a.seqTime&&!(Number(a.seqSetup)||Number(a.seqShoot))){ const m=seqMembers(a,d).filter(x=>!x.cut); a.seqSetup=Math.max(0,...m.map(x=>Number(x.setup)||0)); a.seqShoot=m.reduce((t,x)=>t+(Number(x.shoot)||0),0); }
  a.seqTime=!!on; commit(); renderAll(); rebuildDoc(); if($("#seqView").classList.contains("open")) renderSeqView();
  toast(on?`${seqTitle(a)} is timed as one: setup ${a.seqSetup} min, shoot ${a.seqShoot} min`:`${seqTitle(a)} back to per-shot timings`); }
function setSeqMins(id,k,v){ if(frozenNo()) return; const a=R(id); if(!a) return; a[k]=Math.max(0,Math.round(Number(v)||0)); commit(); renderAll(); if($("#seqView").classList.contains("open")) renderSeqView(); }
function dupSeq(id){
  if(frozenNo()) return; const f=findRow(id); if(!f) return; const d=f.d, a=f.r, mem=seqMembers(a,d); if(!mem.length) return;
  commit();
  const copies=mem.map(m=>Object.assign({},m,{id:uid("r"),done:false,doneAt:null,takes:0,takeLog:"",cut:false,origStart:"",setupAt:null}));
  const na=copies[0]; for(const c of copies) c.seq=na.id;
  const base=String(a.seqName||"Sequence").replace(/\s*\(\d+\)$/,""); let n=2; const names=new Set(d.rows.filter(x=>x.seq===x.id).map(x=>x.seqName)); while(names.has(`${base} (${n})`)) n++;
  na.seqName=`${base} (${n})`; na.seqTime=a.seqTime; na.seqSetup=a.seqSetup; na.seqShoot=a.seqShoot; na.seqNotes=a.seqNotes;
  for(const c of copies.slice(1)){ c.seqName=""; c.seqTime=false; c.seqSetup=0; c.seqShoot=0; c.seqNotes=""; }
  const last=mem[mem.length-1]; d.rows.splice(d.rows.indexOf(last)+1,0,...copies);
  commit(); renderAll(); toast(`Duplicated as ${na.seqName}: same shots, no takes yet - Undo to take it back`); return na.id;
}
function seqHeadRow(id,C,d,first){
  const a=R(id), mem=seqMembers(a,d), sp=seqSpan(a,C,d), la=d.kind!=="capture", cov=la?seqCoverage(a):null, folded=seqFolded(id);
  const fz=isFrozen(d), tl=takeList(a).length;
  const box=h("div",{class:"seqhd"},
    h("button",{class:"fold",title:folded?"Show the sequence's shots":"Fold the sequence into this row","aria-expanded":String(!folded),onclick:()=>setFold(id,!folded)},folded?"▸":"▾"),
    seqChip(a),
    h("span",{class:"meta"},`${seqRange(a,d)} · ${mem.length} shot${mem.length===1?"":"s"}`),
    ...(sp?[(()=>{const t=h("button",{class:"t seqtime",title:"Click to move the whole sequence to a time of day"},fmt(sp.start)+" → "+fmt(sp.end));t.addEventListener("click",e=>{e.stopPropagation();openSeqJumpTime(id,t)});return t})()]:[]));
  if(a.seqTime){ const inp=(k,lab)=>{const i=h("input",{type:"number",min:"0",step:"5",value:String(Number(a[k])||0),"aria-label":lab+" minutes for the sequence",readOnly:fz});i.addEventListener("change",()=>setSeqMins(id,k,i.value));return h("label",{class:"mins2"},lab,i)};
    box.append(inp("seqSetup","Setup"),inp("seqShoot","Shoot"),h("span",{class:"meta"},"min, whole sequence"),h("button",{class:"lnk noprint",onclick:()=>setSeqTime(id,false)},"time per shot")); }
  else if(sp) box.append(h("span",{class:"meta"},`setup ${dur(sp.su)} · shoot ${dur(sp.sh)}`),h("button",{class:"lnk noprint",title:"One setup and shoot time for the whole sequence instead of per shot",onclick:()=>setSeqTime(id,true)},"time as one"));
  // rows that sit between the sequence's shots (a lunch left in the middle): say so, with a one-click way out
  const all=d.rows, idx=mem.map(m=>all.indexOf(m)).filter(i=>i>=0), lo=Math.min(...idx), hi=Math.max(...idx);
  const inside=idx.length>1?all.slice(lo,hi+1).filter(r=>r.seq!==id&&!r.cut):[];
  if(inside.length){ const names=inside.map(r=>isBlock(r)?blockName(r):"Shot "+(r.shot||"-"));
    box.append(h("span",{class:"seqinside"},`${names.slice(0,3).join(", ")}${names.length>3?" and "+(names.length-3)+" more":""} ${inside.length===1?"sits":"sit"} inside this sequence`),
      h("button",{class:"lnk noprint",title:"Put them straight after the sequence's last shot",onclick:()=>moveRowsTo(inside.map(r=>r.id),all[hi].id,true)},"move after"),
      h("button",{class:"lnk noprint",title:"Put them straight before the sequence's first shot",onclick:()=>moveRowsTo(inside.map(r=>r.id),all[lo].id,false)},"move before")); }
  box.append(h("span",{class:"meta"},`${tl} take${tl===1?"":"s"}`+(la&&mem.length?` · ${mem.length-cov.missing.length}/${mem.length} caught`:"")),
    h("button",{class:"lnk noprint",onclick:()=>dupSeq(id)},"duplicate"),
    ...(first&&Object.keys(P.seqFold||{}).length?[h("button",{class:"lnk noprint",onclick:()=>{P.seqFold={};savePrefs();renderBody()}},"unfold all")]:[]),
    ...(first&&daySeqs(d).length>1&&daySeqs(d).some(x=>!seqFolded(x.id))?[h("button",{class:"lnk noprint",onclick:()=>{P.seqFold=P.seqFold||{};daySeqs(d).forEach(x=>P.seqFold[x.id]=true);savePrefs();renderBody()}},"fold all")]:[]));
  // drag: the ⠿ moves the whole sequence; rows dropped on the header land above it (top half) or below it (bottom half)
  const grip=h("span",{class:"handle seqgrip",draggable:"true",title:"Drag to move the whole sequence"},"⠿");
  grip.addEventListener("dragstart",e=>{if(isFrozen()){e.preventDefault();frozenNo();return}dragId="seq:"+id;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",dragId)});
  grip.addEventListener("dragend",()=>{dragId=null;$$("tr.dropbefore,tr.dropafter").forEach(x=>x.classList.remove("dropbefore","dropafter"))});
  box.prepend(grip);
  const tr=h("tr",{class:"seqhead"+(folded?" folded":""),"data-seq":id,style:`--seq:${seqColor(id)}`},h("td",{colspan:String(cols().length)},box));
  const below=e=>{const b=tr.getBoundingClientRect();return e.clientY>b.top+b.height/2};
  tr.addEventListener("dragover",e=>{if(!dragId||dragId==="seq:"+id)return;e.preventDefault();$$("tr.dropbefore,tr.dropafter").forEach(x=>x.classList.remove("dropbefore","dropafter"));tr.classList.add(below(e)?"dropafter":"dropbefore")});
  tr.addEventListener("dragleave",()=>tr.classList.remove("dropbefore","dropafter"));
  tr.addEventListener("drop",e=>{e.preventDefault();if(!dragId||dragId==="seq:"+id)return;const m=seqMembers(R(id));if(!m.length)return;
    const moving=String(dragId).startsWith("seq:")?seqMembers(R(dragId.slice(4))).map(x=>x.id):[dragId]; dragId=null;
    below(e)?moveRowsTo(moving,m[m.length-1].id,true):moveRowsTo(moving,m[0].id,false)});
  return tr;
}
// type a time: the whole sequence moves (its shots together) to the slot that starts closest to it
function seqSlot(d,ids,target){
  const block=d.rows.filter(r=>ids.includes(r.id)), rest=d.rows.filter(r=>!ids.includes(r.id)); let best=null;
  for(let i=0;i<=rest.length;i++){ const trial=[...rest.slice(0,i),...block,...rest.slice(i)], C=compute(Object.assign({},d,{rows:trial})), st=C.rows[block[0].id].setupStart;
    const diff=Math.abs(st-target); if(!best||diff<best.diff-0.01) best={i,start:st,diff,before:rest[i]||null,after:rest[i-1]||null,rows:trial}; }
  return best;
}
function openSeqJumpTime(id,el){
  if(frozenNo()) return; closeJumpTime(); const d=D(), a=R(id); if(!a) return; const ids=seqMembers(a,d).map(r=>r.id); const sp=seqSpan(a,compute(),d); if(!sp) return;
  const inp=h("input",{type:"time",value:hhmm(sp.start%1440)}), hint=h("div",{class:"note"}), name=seqTitle(a);
  const nb=n=>n?(isBlock(n)?blockName(n):"shot "+(n.shot||"-")):"";
  const preview=()=>{ if(!inp.value){hint.textContent="";return} const b=seqSlot(d,ids,jumpTarget(d,inp.value));
    hint.textContent=(Math.round(b.diff)<=1?"Starts at ":"Closest it can start: ")+fmt(b.start)+(b.after&&b.before?` (between ${nb(b.after)} and ${nb(b.before)})`:b.before?" (first in the day)":" (last in the day)"); };
  const go=()=>{ if(!inp.value) return; const b=seqSlot(d,ids,jumpTarget(d,inp.value)); closeJumpTime();
    if(b.rows.map(r=>r.id).join()===d.rows.map(r=>r.id).join()){toast(name+" already starts closest to that time");return}
    d.rows=b.rows; commit(); renderBody(); renderStats(compute()); toast(`${name} now starts at ${fmt(seqSpan(R(id),compute(),d).start)} - Undo to put it back`); };
  inp.addEventListener("input",preview); inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();go()}if(e.key==="Escape")closeJumpTime()});
  const pop=h("div",{class:"jumppop",id:"jumpPop"},h("label",{},`Move ${name} (all ${ids.length} shots) to start at`,inp),hint,
    h("div",{class:"toolbar"},h("button",{class:"btn small primary",onclick:go},"Move"),h("button",{class:"btn small",onclick:closeJumpTime},"Cancel")));
  pop.style.visibility="hidden"; document.body.append(pop); preview();
  const bb=el.getBoundingClientRect(), ph=pop.offsetHeight, pw=pop.offsetWidth; const top=bb.bottom+4+ph<=innerHeight-8?bb.bottom+4:Math.max(8,bb.top-4-ph);
  pop.style.left=Math.max(8,Math.min(innerWidth-pw-8,bb.left))+"px"; pop.style.top=top+"px"; pop.style.visibility="";
  setTimeout(()=>{inp.focus();document.addEventListener("mousedown",jumpOutside,true)},0);
}
// move rows (one, or a sequence's shots together) before or after another row
function moveRowsTo(ids,target,after){
  if(frozenNo()) return; const d=D(); if(!d||ids.includes(target)) return;
  const moving=d.rows.filter(x=>ids.includes(x.id)); if(!moving.length) return;
  const rest=d.rows.filter(x=>!ids.includes(x.id)); let i=rest.findIndex(x=>x.id===target); if(i<0) return; if(after) i++;
  rest.splice(i,0,...moving); d.rows=rest; commit(); renderBody(); renderStats(compute());
}

/* ---------- running order: one simple page for the day ---------- */
const RO={seqs:true,cut:false};
function openRunningOrder(){ commit(); openDoc("Running order",b=>buildRunningOrder(b,D())); }
function runningOrderRows(d){
  const C=compute(d), out=[], done=new Set();
  for(const r of d.rows){
    if(r.cut&&!RO.cut) continue; const c=C.rows[r.id];
    if(isBlock(r)){ out.push({kind:r.type==="tech"?"tech":"break",start:c.start,end:c.end,what:blockName(r),desc:"",loc:"",su:0,sh:c.sh}); continue; }
    if(RO.seqs&&r.seq&&R(r.seq)){ if(done.has(r.seq)) continue; done.add(r.seq); const a=R(r.seq), sp=seqSpan(a,C,d)||{start:c.setupStart,end:c.end,su:c.su,sh:c.sh}, m=seqMembers(a,d).filter(x=>!x.cut||RO.cut);
      out.push({kind:"seq",start:sp.start,end:sp.end,what:seqTitle(a)+" ("+seqRange(a,d)+")",desc:m.map(x=>(x.shot||"-")+(String(x.action||x.description||"").trim()?" "+String(x.action||x.description).trim().split(/[.\n]/)[0].slice(0,50):"")).join("; "),
        loc:[...new Set(m.map(x=>x.location).filter(Boolean))].join(", "),su:sp.su,sh:sp.sh,vcs:m.some(x=>x.vcs)}); continue; }
    out.push({kind:"shot",start:c.setupStart,end:c.end,what:"Shot "+(r.shot||"-"),desc:String((d.kind==="capture"?r.action:r.description)||r.action||r.description||"").replace(/\s+/g," ").slice(0,140),loc:r.location||"",su:c.su,sh:c.sh,cut:r.cut,vcs:r.vcs});
  }
  return {rows:out,C};
}
function buildRunningOrder(b,d){
  d=S.days.find(x=>x.id===d.id)||d; const {rows,C}=runningOrderRows(d), pr=S.project;
  b.append(h("div",{class:"dochead"},h("div",{},h("div",{class:"docproj"},pr.name||"Untitled project"),h("div",{class:"docsub"},"Running order")),
    h("div",{class:"docday"},h("div",{},d.name),h("small",{},[longDate(d.date),"call "+fmt(toMin(d.call||"09:00")),"wrap "+fmt(C.wrap)+(C.wrap>wrapMin(d)?" (target "+fmt(wrapMin(d))+")":"")].join(" · ")))));
  const opt=(k,l)=>{const c=h("input",{type:"checkbox"});c.checked=RO[k];c.addEventListener("change",()=>{RO[k]=c.checked;rebuildDoc()});return h("label",{class:"sw",style:"color:var(--ink)"},c,h("span",{},l))};
  b.append(h("div",{class:"toolbar noprint",style:"margin:0 0 .6rem"},opt("seqs","One line per sequence"),opt("cut","Include cut shots"),h("button",{class:"btn small",onclick:()=>exportRunningOrder(d)},"Download CSV")));
  const t=h("table",{class:"doctable runorder"},h("thead",{},h("tr",{},...["Time","What","Details","Location","Setup","Shoot"].map(x=>h("th",{},x)))));const tb=h("tbody",{});
  for(const x of rows) tb.append(h("tr",{class:x.kind==="shot"?(x.cut?"undone":""):x.kind==="seq"?"seq":"blk"},h("td",{class:"nowrap"},fmt(x.start)+"-"+fmt(x.end)),h("td",{class:"nowrap"},h("b",{},x.what),x.vcs?" · VCS":""),h("td",{},x.desc),h("td",{},x.loc),
    h("td",{class:"num"},x.su?String(Math.round(x.su)):""),h("td",{class:"num"},x.sh?String(Math.round(x.sh)):"")));
  t.append(tb); b.append(t, h("p",{class:"docfoot"},`${pr.name||"Shotlist"} · ${d.name} · ${rows.filter(x=>x.kind!=="break"&&x.kind!=="tech").length} items · ${new Date().toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}`));
}
function exportRunningOrder(d){ const {rows}=runningOrderRows(d);
  const lines=[["Start","End","What","Details","Location","Setup (min)","Shoot (min)","VCS"].map(csvEsc).join(",")];
  for(const x of rows) lines.push([fmt(x.start),fmt(x.end),x.what,x.desc,x.loc,x.su?Math.round(x.su):"",x.sh?Math.round(x.sh):"",x.vcs?"VCS":""].map(csvEsc).join(","));
  download(fileBase()+"_"+String(d.name).replace(/[^\w\-]+/g,"_")+"_running_order.csv","\ufeff"+lines.join("\r\n"),"text/csv"); }

/* Sequence View: the grouped shots in one place, with the sequence's takes and what each caught */
const SQV={id:null};
function daySeqs(d){d=d||D();return d?d.rows.filter(x=>x.seq&&x.seq===x.id&&!isBlock(x)):[]}
function openSeqView(id){ const a=R(id); if(!a) return; const f=findRow(id); if(f&&D()&&f.d.id!==D().id){P.activeByProject[pid()]=f.d.id;savePrefs();renderAll()}
  SQV.id=id; $("#seqView").classList.add("open"); document.body.classList.add("viewopen"); keepAwake(true); renderSeqView(); }
function closeSeqView(){ rememberView(null); const vh=$("#sqVideoHost"); if(vh){vh.innerHTML="";vh.dataset.key=""} $("#seqView").classList.remove("open"); document.body.classList.remove("viewopen"); clearInterval(SQV.timer); keepAwake(false); renderBody(); }
function seqStep(dir){ const l=daySeqs(); if(!l.length) return; let i=l.findIndex(x=>x.id===SQV.id); i=Math.max(0,Math.min(l.length-1,(i<0?0:i)+dir)); SQV.id=l[i].id; renderSeqView(); }
function renderSeqView(){
  // like Note View: the panels are redrawn, the video player isn't (marking a take doesn't restart it)
  const v=$("#seqView"); const host=$("#sqVideoHost")||h("section",{id:"sqVideoHost",class:"sqvhost"});
  let body=$("#sqBody"); if(!body) body=h("div",{class:"nvbody",id:"sqBody"}); if(host.parentNode!==body) body.append(host);
  [...v.children].forEach(c=>{if(c!==body)c.remove()}); [...body.children].forEach(c=>{if(c!==host)c.remove()});
  const d=D(), a=SQV.id&&R(SQV.id);
  if(!a||!a.seq){ host.innerHTML=""; host.dataset.key=""; closeSeqView(); return; }
  rememberView("seq",a.id);
  const la=d.kind!=="capture", mem=seqMembers(a,d), cov=seqCoverage(a), take=nextTake(a,d), name=shotName(a,d,take);
  const head=h("div",{class:"nvhead"},
    h("button",{title:"Previous sequence",onclick:()=>seqStep(-1)},"‹"),
    h("div",{class:"nvtitle"},(()=>{const t=h("b",{title:"Double-click to rename",style:"cursor:text"},seqTitle(a));t.addEventListener("dblclick",()=>renameSeqInline(t,a.id));return t})(),onNowBtn(a),h("span",{class:"pill",style:`background:${seqColor(a.seq)};color:#fff`},seqRange(a,d)),seqAnyVcs(a)?h("span",{class:"pill"},"VCS"):null,h("span",{class:"note"},d.name+" · next take "+take)),
    h("button",{title:"Next sequence",onclick:()=>seqStep(1)},"›"),
    h("button",{class:"nvreset",onclick:()=>{const nid=dupSeq(a.id);if(nid){SQV.id=nid;renderSeqView()}}},"Duplicate"),
    h("button",{class:"nvreset",onclick:()=>openSeqDialog(a.id)},"Edit shots"),
    h("button",{title:"Close",onclick:closeSeqView},"✕"));
  // DIT name for the next take
  const dit=h("section",{},h("h3",{},"DIT name"),h("div",{class:"seqdit"},h("code",{},name||"-"),h("button",{class:"btn small",onclick:async()=>{if(await copyText(name))toast("Copied "+name)}},"Copy")),
    h("p",{class:"note"},"Covers shots "+seqRange(a,d)+". "+(la?"Every storyboard shot still needs catching: tick what each take got.":"Mocap: each take records the whole action; framing is set in post.")));
  // the shots
  const shots=h("section",{class:"seqshots"},h("h3",{},`Shots (${mem.length})`));
  for(const m of mem){ const got=cov.caught.get(m.id); const im=h("img",{alt:""}); if(m.ref1) imgSrc(m.ref1).then(s=>{if(s)im.src=s});
    shots.append(h("div",{class:"seqshot"+(la?(got?" got":" miss"):"")},m.ref1?im:h("div",{class:"noimg"}),
      h("div",{},h("b",{},"Shot "+(m.shot||"-")),m.vcs?h("span",{class:"pill"},"VCS"):null,h("p",{},String(m.action||m.description||"").slice(0,120)),
        la?h("small",{},got?"Caught in "+got.map(n=>"T"+n).join(", "):"Not caught yet"):null,
        h("button",{class:"go",onclick:()=>{closeSeqView();openNotes(m.id)}},"Notes"),
        videoLinks(m).length?h("button",{class:"go",style:"margin-left:.6rem",title:"This shot has its own reference video",onclick:()=>{closeSeqView();openNotes(m.id)}},"▶ shot video"):null)));
  }
  if(la) shots.append(h("p",{class:"seqcov "+(cov.missing.length?"miss":"got")},cov.missing.length?`Still to get: ${cov.missing.map(m=>m.shot||"?").join(", ")}`:"Every shot caught"+(takeList(a).length?"":" (no takes yet)")));
  // takes
  const takes=h("section",{},h("h3",{},"Takes"));
  const rolling=rollingTake(a); const extra=()=>la?{caught:[]}:{};
  const clock=h("span",{class:"mono nvclock"},rolling?fmtDur(Date.now()-rolling.at):"0:00");
  clearInterval(SQV.timer); if(rolling) SQV.timer=setInterval(()=>{const t=rollingTake(R(a.id));if(t)clock.textContent=fmtDur(Date.now()-t.at);else{clearInterval(SQV.timer);renderSeqView()}},250);
  takes.append(h("div",{class:"toolbar"},h("button",{class:"btn"+(rolling?" rolling":""),onclick:()=>{rollingTake(R(a.id))?cutTake(a.id):logTake(a.id,extra());renderSeqView()}},rolling?"■ Cut":"● Roll"),clock,
    h("button",{class:"btn",onclick:()=>{logTake(a.id,extra());renderSeqView()}},"+ Take"),
    h("button",{class:"btn primary",title:"Mark every shot in the sequence done",onclick:()=>{for(const m of seqMembers(R(a.id))){m.done=true;m.doneAt=dayClock(D())}commit();toast("Sequence done");const n=daySeqs().find(x=>!seqMembers(x).every(y=>y.done));if(n){SQV.id=n.id}renderSeqView()}},"Sequence done ✓")));
  const list=takeList(a).slice().reverse();
  if(!list.length) takes.append(h("p",{class:"note"},"No takes yet. ● Roll logs a take for the whole sequence with its timecode in, ■ Cut adds the timecode out; Clap and Cut in Slate View do the same."+(la?" Then tick the shots each take caught.":"")));
  const edit=(n,fn)=>{const x=R(a.id);const l=takeList(x);const t=l.find(z=>z.n===n);if(!t)return;fn(t);setTakeList(x,l);syncMarks(x);commit();renderSeqView()};
  for(const t of list){
    const marks=h("span",{class:"nvmarks"});
    for(const [m,l] of [["good","Good"],["ng","NG"],["hero","Hero ★"],["safety","Safety"]]) marks.append(h("button",{class:"mk mk-"+m+(t.mark===m?" on":""),onclick:()=>edit(t.n,z=>{z.mark=z.mark===m?"":m})},l));
    const row=h("div",{class:"nvtake"},takeLabel(a.id,t,()=>renderSeqView()),tcEditable(h("span",{class:"mono note nvtc"},t.tc?"in "+t.tc:"",t.out?" → out "+t.out:(rollingTake(a)===t?" ● rolling":""),t.len?" · "+t.len:""),a.id,t.n,()=>renderSeqView()),marks);
    if(la){ const ticks=h("span",{class:"seqticks"},h("small",{class:"note"},"Caught:"));
      for(const m of mem){ const on=(t.caught||[]).includes(m.id); ticks.append(h("button",{class:"tick"+(on?" on":""),title:(on?"Caught":"Not caught")+": shot "+(m.shot||""),onclick:()=>edit(t.n,z=>{const c=new Set(z.caught||[]);c.has(m.id)?c.delete(m.id):c.add(m.id);z.caught=mem.map(y=>y.id).filter(id=>c.has(id))})},m.shot||"?")); }
      ticks.append(h("button",{class:"tick all",onclick:()=>edit(t.n,z=>{z.caught=(z.caught||[]).length===mem.length?[]:mem.map(y=>y.id)})},(t.caught||[]).length===mem.length?"None":"All"));
      row.append(ticks); }
    const note=h("input",{value:t.note||"",placeholder:"note"}); note.addEventListener("change",()=>edit(t.n,z=>{z.note=note.value})); row.append(note);
    row.append(h("button",{class:"nvdel",title:"Remove this take (you can undo it)",onclick:()=>deleteTake(a.id,t.n,()=>renderSeqView())},"✕"));
    takes.append(row);
  }
  const notes=h("section",{},h("h3",{},"Sequence notes"));
  const ta=h("textarea",{rows:"4",placeholder:"Blocking, what to watch for, pickups needed"}); ta.value=a.seqNotes||"";
  ta.addEventListener("input",()=>{const x=R(a.id);if(x){x.seqNotes=ta.value;softCommit()}}); ta.addEventListener("change",commit); notes.append(ta);
  const C=compute(d), sp=seqSpan(a,C,d);
  const timing=h("section",{},h("h3",{},"Timing"));
  if(a.seqTime){ const inp=(k,l)=>{const i=h("input",{type:"number",min:"0",step:"5",value:String(Number(a[k])||0),style:"width:5rem"});i.addEventListener("change",()=>setSeqMins(a.id,k,i.value));return h("label",{class:"mins2",style:"margin-right:1rem"},l+" ",i," min")};
    timing.append(h("p",{},inp("seqSetup","Setup"),inp("seqShoot","Shoot")),h("p",{class:"note"},"One setup and shoot for the whole sequence. "+(sp?fmt(sp.start)+" → "+fmt(sp.end)+". ":""),h("button",{class:"go",onclick:()=>setSeqTime(a.id,false)},"Time per shot instead"))); }
  else timing.append(h("p",{},sp?`${fmt(sp.start)} → ${fmt(sp.end)} · setup ${dur(sp.su)} · shoot ${dur(sp.sh)} (adding up each shot's own times)`:""),h("button",{class:"btn small",onclick:()=>setSeqTime(a.id,true)},"Time the sequence as one"));
  shots.classList.add("sqshots"); takes.classList.add("sqtk");
  for(const sec of [shots,takes,timing,dit,notes]) body.insertBefore(sec,host);
  if(body.parentNode!==v) v.append(body); v.insertBefore(head,body);
  updateVideoHost(a,{field:"seqVideo",host:"#sqVideoHost"});
  v.append(h("p",{class:"keyhint"},"Keys: R roll / cut · T log a take · G N H S mark the last take · ← → sequences · F full screen · Esc close"));
}

/* ---------- Note View panels: drag ⠿ to move, drag the corner to resize (kept per device) ----------
   Panels are reordered with CSS order and sized with grid spans, never moved in the page, so a playing video carries on. */
const NV_CARDS=["what","video","takes","notes","scribble"];
function nvLayout(){P.nvLayout=P.nvLayout||{};return P.nvLayout}
function nvCustom(){const L=P.nvLayout||{};return !!((L.order&&L.order.length)||Object.keys(L.span||{}).length||Object.keys(L.h||{}).length)}
// how many columns the panel grid has room for (the same sum the grid does: 26rem panels and their gaps), whatever is spanning now
function nvCols(body){const cs=getComputedStyle(body),gap=parseFloat(cs.columnGap)||16,inner=body.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0);
  const rem=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,min=Math.min(inner,26*rem);return Math.max(1,Math.floor((inner+gap)/(min+gap)))}
function applyNvLayout(){
  const body=$("#nvBody"); if(!body) return; const L=nvLayout(), cols=nvCols(body);
  for(const c of body.children){ const k=c.dataset.card; if(!k) continue;
    const i=(L.order||[]).indexOf(k); c.style.order=i>=0?String(i):"";
    const sp=Math.min(cols,Number((L.span||{})[k])||1); c.style.gridColumn=sp>1?`span ${sp}`:"";
    const hh=Number((L.h||{})[k]); c.style.height=hh&&cols>1?hh+"px":""; c.classList.toggle("sized",!!(hh&&cols>1)); }
  const rb=$("#noteView .nvreset"); if(rb) rb.hidden=!nvCustom();
}
function resetNvLayout(){P.nvLayout={};savePrefs();applyNvLayout();toast("Note View layout reset")}
function cardControls(sec){
  sec.querySelectorAll(":scope > .cardgrip, :scope > .cardsize").forEach(x=>x.remove());
  const grip=h("button",{class:"cardgrip",title:"Drag to move this panel","aria-label":"Move panel"},"⠿");
  const size=h("span",{class:"cardsize",title:"Drag to resize. Double-click to reset this panel's size","aria-hidden":"true"});
  grip.addEventListener("pointerdown",e=>moveCard(e,sec)); size.addEventListener("pointerdown",e=>sizeCard(e,sec));
  size.addEventListener("dblclick",()=>{const L=nvLayout();if(L.span)delete L.span[sec.dataset.card];if(L.h)delete L.h[sec.dataset.card];savePrefs();applyNvLayout()});
  // keyboard: arrow keys move the panel earlier or later
  grip.addEventListener("keydown",e=>{const d=e.key==="ArrowLeft"||e.key==="ArrowUp"?-1:e.key==="ArrowRight"||e.key==="ArrowDown"?1:0;if(!d)return;e.preventDefault();e.stopPropagation();
    const ord=currentCardOrder(),i=ord.indexOf(sec.dataset.card),j=i+d;if(j<0||j>=ord.length)return;ord.splice(j,0,ord.splice(i,1)[0]);nvLayout().order=ord;savePrefs();applyNvLayout();grip.focus()});
  sec.append(grip,size);
}
function currentCardOrder(){const body=$("#nvBody");return [...body.children].filter(c=>c.dataset.card).sort((a,b)=>{const r1=a.getBoundingClientRect(),r2=b.getBoundingClientRect();return Math.abs(r1.top-r2.top)>20?r1.top-r2.top:r1.left-r2.left}).map(c=>c.dataset.card)}
function moveCard(e,sec){
  e.preventDefault(); const body=$("#nvBody"); const g=e.currentTarget; try{g.setPointerCapture(e.pointerId)}catch(err){}
  document.body.classList.add("nvdragging"); sec.classList.add("nvmoving"); let target=null, after=false;
  const others=()=>[...body.children].filter(c=>c.dataset.card&&c!==sec);
  const mv=ev=>{ let best=null,dist=1e9; for(const c of others()){const r=c.getBoundingClientRect();const dx=Math.max(r.left-ev.clientX,0,ev.clientX-r.right),dy=Math.max(r.top-ev.clientY,0,ev.clientY-r.bottom);const d=dx*dx+dy*dy;if(d<dist){dist=d;best=c}}
    $$(".nvdrop").forEach(x=>x.classList.remove("nvdrop","nvdrop-after")); target=best; if(!best) return;
    const r=best.getBoundingClientRect(); after=ev.clientX>r.left+r.width/2; best.classList.add("nvdrop"); if(after) best.classList.add("nvdrop-after"); };
  const up=()=>{ g.removeEventListener("pointermove",mv); g.removeEventListener("pointerup",up); g.removeEventListener("pointercancel",up);
    document.body.classList.remove("nvdragging"); sec.classList.remove("nvmoving"); $$(".nvdrop").forEach(x=>x.classList.remove("nvdrop","nvdrop-after"));
    if(!target) return; const ord=currentCardOrder().filter(k=>k!==sec.dataset.card); let i=ord.indexOf(target.dataset.card); if(after) i++;
    ord.splice(i,0,sec.dataset.card); nvLayout().order=ord; savePrefs(); applyNvLayout(); };
  g.addEventListener("pointermove",mv); g.addEventListener("pointerup",up); g.addEventListener("pointercancel",up);
}
function sizeCard(e,sec){
  e.preventDefault(); const body=$("#nvBody"); const g=e.currentTarget; try{g.setPointerCapture(e.pointerId)}catch(err){}
  const cols=nvCols(body), gap=parseFloat(getComputedStyle(body).columnGap)||16, inner=body.clientWidth-(parseFloat(getComputedStyle(body).paddingLeft)||0)-(parseFloat(getComputedStyle(body).paddingRight)||0);
  const colW=(inner-gap*(cols-1))/cols, r0=sec.getBoundingClientRect(); document.body.classList.add("nvdragging"); sec.classList.add("nvsizing");
  const L=nvLayout(); L.span=L.span||{}; L.h=L.h||{}; const k=sec.dataset.card;
  const mv=ev=>{ const w=ev.clientX-r0.left, hh=Math.max(160,Math.round(ev.clientY-r0.top));
    const sp=Math.max(1,Math.min(cols,Math.round((w+gap)/(colW+gap)))); L.span[k]=sp; if(cols>1) L.h[k]=hh; applyNvLayout(); };
  const up=()=>{ g.removeEventListener("pointermove",mv); g.removeEventListener("pointerup",up); g.removeEventListener("pointercancel",up);
    document.body.classList.remove("nvdragging"); sec.classList.remove("nvsizing"); savePrefs(); applyNvLayout(); };
  g.addEventListener("pointermove",mv); g.addEventListener("pointerup",up); g.addEventListener("pointercancel",up);
}
addEventListener("resize",()=>{if($("#noteView").classList.contains("open"))applyNvLayout()});

/* ---------- stay in Slate / Note View across a reload (this browser tab only) ---------- */
function rememberView(view,id){ try{ if(view&&id) sessionStorage.setItem("shotlist-view",JSON.stringify({view,id,pid:pid(),day:(D()||{}).id})); else sessionStorage.removeItem("shotlist-view"); }catch(e){} }
let viewRestored=false;
function restoreView(){
  if(viewRestored||BOOT_VIEW) return; viewRestored=true;
  let s=null; try{ s=JSON.parse(sessionStorage.getItem("shotlist-view")||"null"); }catch(e){}
  if(!s||s.pid!==pid()) return;
  let n=0; const t=setInterval(()=>{ n++;
    if(S&&S.days&&S.days.some(d=>d.rows.some(r=>r.id===s.id))){ clearInterval(t);
      const f=findRow(s.id); if(f&&!f.d.archived){ P.activeByProject[pid()]=f.d.id; renderAll(); s.view==="slate"?openSlate(s.id):s.view==="seq"?openSeqView(s.id):openNotes(s.id); } }
    else if(n>60) clearInterval(t); },150);
}

/* ---------- wiring ---------- */
$("#freezeBtn").onclick=toggleFreeze;
$("#callSheetBtn").onclick=openCallSheet;
$("#wrapRepBtn").onclick=openWrapReport;
$("#takesBtn").onclick=()=>exportTakes();
$("#readyBtn").onclick=openReady;
$("#runOrderBtn").onclick=openRunningOrder;
$("#dedupeBtn").onclick=()=>dedupePictures();
$("#docPrint").onclick=printDoc;
$("#docCopy").onclick=async()=>{if(await copyText(docText()))toast("Copied as text, ready to paste into an email or message")};

// ---- Actual timeline: what really happened, on the same scale as the plan ----
// a moment (epoch ms) as minutes on this day's clock (past midnight runs on past 24:00, like the plan)
function dayMinOf(d,ms){ const base=new Date((d.date||todayISO())+"T00:00").getTime(); return (ms-base)/60000; }
// one entry per shot or sequence that has started: setting up, shooting, and a break (planned length) where one sits in between
function actualUnits(d,C){
  if(!d) return [];
  const now=dayClock(d), L=liveStatus(d,C);
  const curId=L&&L.cur?(L.cur.seq&&R(L.cur.seq)?seqAnchor(L.cur).id:L.cur.id):null;
  const ok=m=>m!=null&&isFinite(m)&&m>-720&&m<2880;
  const units=[], seen=new Set();
  d.rows.forEach((r,idx)=>{
    if(isBlock(r)||r.cut) return;
    const a=r.seq&&R(r.seq)?seqAnchor(r):r; if(seen.has(a.id)) return; seen.add(a.id);
    const mem=a.seq?seqMembers(a,d).filter(x=>!x.cut):[r];
    const takes=takeList(a).filter(t=>t.at&&ok(dayMinOf(d,t.at)));
    const allDone=mem.length&&mem.every(x=>x.done), isCur=a.id===curId&&now!=null;
    const setupAt=a.setupAt&&ok(dayMinOf(d,a.setupAt))?dayMinOf(d,a.setupAt):(isCur&&d.onRow===a.id&&d.onSince&&ok(dayMinOf(d,d.onSince))?dayMinOf(d,d.onSince):null);
    if(!takes.length&&!allDone&&!(isCur&&setupAt!=null)) return;
    const ends=mem.filter(x=>x.done&&ok(x.doneAt)).map(x=>Number(x.doneAt));
    const shootS=takes.length?Math.min(...takes.map(t=>dayMinOf(d,t.at))):null;
    let shootE=null;
    if(allDone&&ends.length) shootE=Math.max(...ends);
    else if(isCur) shootE=now;
    else if(takes.length) shootE=Math.max(...takes.map(t=>dayMinOf(d,t.at+(t.ms||0))));
    if(shootS!=null&&shootE!=null&&shootE<shootS) shootE=shootS;
    const cs=mem.map(x=>C.rows[x.id]).filter(Boolean);
    const pSu=cs.reduce((t,c)=>t+(c.su||0),0), pSh=cs.reduce((t,c)=>t+(c.sh||0),0);
    const name=a.seq?seqTitle(a):"Shot "+(a.shot||a.action||"-");
    units.push({a,idx,name,shootS,shootE,setupAt,isCur,done:allDone,rolling:!!rollingTake(a),pSu,pSh,first:setupAt!=null?setupAt:shootS!=null?shootS:shootE});
  });
  units.sort((x,y)=>(x.first??1e9)-(y.first??1e9));
  let prev=null;
  for(const u of units){
    const setupE=u.shootS!=null?u.shootS:(u.isCur?now:null);
    let s=u.setupAt;
    if(s==null&&prev&&prev.end!=null&&setupE!=null){
      // set up from when the last one finished, less any break / tech rows that sit between them in the list
      s=prev.end;
      if(u.idx>prev.idx){ const blk=d.rows.slice(prev.idx+1,u.idx).filter(isBlock).reduce((t,b)=>t+((C.rows[b.id]||{}).sh||0),0);
        if(blk>0){ const be=Math.min(setupE,s+blk); u.brk=[s,be]; s=be; } }
    }
    if(s!=null&&setupE!=null&&s<=setupE) u.setup=[s,setupE];
    if(u.shootS!=null&&u.shootE!=null) u.shoot=[u.shootS,u.shootE];
    else if(u.shootS==null&&u.done&&u.shootE!=null&&prev&&prev.end!=null&&!u.setup){ const s0=u.brk?u.brk[1]:prev.end; if(s0<u.shootE) u.nolog=[s0,u.shootE]; }
    u.end=u.shoot?u.shoot[1]:u.nolog?u.nolog[1]:u.setup?u.setup[1]:null;
    u.idx=Math.max(u.idx,prev?prev.idx:0); prev=u.end!=null?u:prev;
  }
  return units.filter(u=>u.setup||u.shoot||u.nolog);
}
// the timelines share one scale: call to the later of the planned wrap, target wrap and what's actually happened
function tlRange(d,C){
  const start=toMin(d.call||"09:00");
  let end=Math.max(C.wrap,wrapMin(d))+15;
  if(P.showActual!==false){ const u=actualUnits(d,C); for(const x of u) if(x.end!=null) end=Math.max(end,x.end+10); }
  return {start,end,span:Math.max(60,end-start)};
}
let ACT_SUM="";
function renderActual(C){
  const tl=$("#actualTl"); if(!tl) return 0; tl.innerHTML=""; ACT_SUM=""; const d=D(); if(!d) return 0;
  const units=actualUnits(d,C); if(!units.length){ $("#actualSum").textContent=""; return 0; }
  const {start,end,span}=tlRange(d,C); const pct=m=>((m-start)/span*100)+"%", w=(a,b)=>(Math.max(0,b-a)/span*100)+"%";
  const pxHr=(tl.clientWidth||($("#timeline").clientWidth)||800)/span*60, every=pxHr<26?180:pxHr<46?120:60;
  for(let hr=Math.ceil(start/60)*60;hr<=end;hr+=60){if(hr%every){tl.append(h("div",{class:"tickline",style:"left:"+pct(hr)}));continue}const f=(hr-start)/span;tl.append(h("div",{class:"tickline",style:"left:"+pct(hr)}),h("div",{class:"tick"+(f<0.04?" first":f>0.96?" last":""),style:"left:"+pct(hr)},fmt(hr)))}
  const mins=x=>Math.round(x[1]-x[0]);
  let su=0, sh=0, pSu=0, pSh=0, nDone=0;
  for(const u of units){
    const go=()=>jump(u.a.id), live=u.isCur&&!u.done;
    if(u.brk) tl.append(h("div",{class:"seg break",style:`left:${pct(u.brk[0])};width:${w(...u.brk)}`,title:`Break / tech before ${u.name}, at its planned length (${mins(u.brk)} min)`}));
    if(u.setup){ const s=h("div",{class:"seg setup"+(live&&!u.shoot?" live":""),style:`left:${pct(u.setup[0])};width:${w(...u.setup)}`,title:`${u.name} - setting up ${fmt(u.setup[0])} to ${fmt(u.setup[1])}${live&&!u.shoot?" (so far)":""}: ${mins(u.setup)} min, planned ${Math.round(u.pSu)}`}); s.onclick=go; tl.append(s); }
    if(u.shoot){ const s=h("div",{class:"seg shoot"+(live?" live":""),style:`left:${pct(u.shoot[0])};width:${w(...u.shoot)};border-left:1px solid var(--panel)`,title:`${u.name} - shooting ${fmt(u.shoot[0])} to ${fmt(u.shoot[1])}${live?" (so far)":""}: ${mins(u.shoot)} min, planned ${Math.round(u.pSh)}`}); s.onclick=go; tl.append(s); }
    if(u.nolog){ const s=h("div",{class:"seg nolog",style:`left:${pct(u.nolog[0])};width:${w(...u.nolog)};border-left:1px solid var(--panel)`,title:`${u.name} - shot by ${fmt(u.nolog[1])}, no takes logged so setup and shooting can't be split (${mins(u.nolog)} min, planned ${Math.round(u.pSu+u.pSh)})`}); s.onclick=go; tl.append(s); }
    if(u.done&&(u.setup||u.shoot)){ nDone++; if(u.setup){su+=mins(u.setup);pSu+=u.pSu} if(u.shoot){sh+=mins(u.shoot);pSh+=u.pSh} }
  }
  const wrapT=wrapMin(d); tl.append(h("div",{class:"wrapline",style:"left:"+pct(wrapT),title:"Target wrap "+fmt(wrapT)}));
  { const n=dayClock(d); if(n!=null&&n>=start&&n<=end) tl.append(h("div",{class:"nowline",style:"left:"+pct(n),title:"Now "+fmt(n)})); }
  const vs=(a,p)=>{const x=Math.round(a-p);return x===0?"on plan":(x>0?"+":"-")+dur(Math.abs(x))};
  ACT_SUM=nDone?`${nDone} done · setting up ${dur(su)} (${vs(su,pSu)}) · shooting ${dur(sh)} (${vs(sh,pSh)})`:"under way";
  $("#actualSum").textContent=nDone?`Done so far: setting up ${dur(su)} against ${dur(Math.round(pSu))} planned, shooting ${dur(sh)} against ${dur(Math.round(pSh))}`:"";
  return units.length;
}
// pace, recovery plan and both timelines: each can be turned off (Display settings) and folded (its header bar), per device
const PANELS={pace:"Pace",timeline:"Planned timeline",actual:"Actual timeline"};
function renderPanels(C){
  const d=D(); P.panelFold=P.panelFold||{};
  const plan=$("#plan"); if(plan) plan.hidden=P.showPlan===false;
  const nAct=P.showActual!==false?renderActual(C||compute()):0;
  for(const key of Object.keys(PANELS)){
    const head=$(`.phead[data-panel="${key}"]`); if(!head) continue;
    const body=key==="pace"?$("#pace"):$(`.pbody[data-panel="${key}"]`);
    const on=key==="pace"?(P.showPace!==false&&body.classList.contains("on")):key==="timeline"?(P.showTl!==false&&!!d):(nAct>0);
    const fold=!!P.panelFold[key];
    head.hidden=!on; if(key!=="pace") body.hidden=!on;
    body.classList.toggle("pfold",on&&fold);
    let sum="";
    if(key==="pace"&&on){ const n=$(".pacenum",body), wd=$(".pacewords b",body); sum=(n?n.textContent:"")+(wd?" · "+wd.textContent:""); }
    if(key==="timeline"&&on&&C) sum=`${fmt(toMin(d.call||"09:00"))} to ${fmt(C.wrap)} planned · target wrap ${fmt(wrapMin(d))}`;
    if(key==="actual"&&on) sum=ACT_SUM;
    head.replaceChildren(h("b",{},PANELS[key]),h("span",{class:"note"},sum),h("span",{class:"chev"},fold?"▾ show":"▴ hide"));
    head.setAttribute("aria-expanded",String(!fold));
    head.onclick=()=>{ P.panelFold[key]=!P.panelFold[key]; savePrefs(); const C2=compute(); if(key==="timeline"&&!P.panelFold[key]) renderTimeline(C2); renderPanels(C2); };
  }
}
// back to the top: a round button bottom right once you've scrolled down the list
(function(){ const b=$("#topBtn"); if(!b) return;
  const upd=()=>b.classList.toggle("show",window.scrollY>500);
  window.addEventListener("scroll",upd,{passive:true}); upd();
  b.onclick=()=>window.scrollTo({top:0,behavior:P.calm?"auto":"smooth"});
})();
