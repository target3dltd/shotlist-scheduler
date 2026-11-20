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
function rebuildDoc(){const ae=document.activeElement;if(ae&&ae.closest&&ae.closest("#docBody")&&/TEXTAREA|INPUT/.test(ae.tagName))return;if($("#docModal").classList.contains("open")&&DOC.build){const sc=$("#docModal .box").scrollTop;$("#docBody").innerHTML="";DOC.build($("#docBody"));$("#docModal .box").scrollTop=sc}}
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
      lines.push([d.name,d.date||"",r.shot||"",t.n,shotName(r,d,t.n)||"",t.mark?t.mark[0].toUpperCase()+t.mark.slice(1):"",t.tc||"",t.out||"",ms?Math.round(ms/100)/10:"",ms?durSecs(ms):"",
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

/* ---------- wiring ---------- */
$("#freezeBtn").onclick=toggleFreeze;
$("#callSheetBtn").onclick=openCallSheet;
$("#wrapRepBtn").onclick=openWrapReport;
$("#takesBtn").onclick=()=>exportTakes();
$("#readyBtn").onclick=openReady;
$("#docPrint").onclick=printDoc;
$("#docCopy").onclick=async()=>{if(await copyText(docText()))toast("Copied as text, ready to paste into an email or message")};
