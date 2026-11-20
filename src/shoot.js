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

/* ---------- reference / rehearsal video, by link (Google Drive first) ---------- */
// a shot's links are kept one per line in r.video; videos stay in Drive (or wherever) and play from there
// links are kept one per line; with a project base address a plain file name (SH030_rehearsal.mp4) is enough
function videoLinks(r){return String((r&&r.video)||"").split(/\s*[\n,]\s*|\s+(?=https?:|ftp:|<iframe)/i).map(s=>s.trim()).filter(Boolean).filter(s=>/^(https?:|ftp:)\/\//i.test(s)||/<iframe/i.test(s)||(vidBase()&&/\.\w{2,5}$/.test(s)))}
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
const VID={i:0,rowId:null};
function setVideoLinks(id,links){const x=R(id);if(!x)return;x.video=links.join("\n");commit()}
function videoSection(r){
  const links=videoLinks(r); if(VID.rowId!==r.id){VID.rowId=r.id;VID.i=0} if(VID.i>=links.length) VID.i=Math.max(0,links.length-1);
  const sec=h("div",{class:"nvvideo"},h("h3",{},"Reference video"));
  const stage=h("div",{class:"vstage"}), ctl=h("div",{class:"vctl"});
  const main=h("div",{});
  if(links.length>1) main.append(h("div",{class:"vtabs",role:"tablist"},...links.map((u,i)=>h("button",{role:"tab","aria-selected":String(i===VID.i),onclick:()=>{VID.i=i;updateVideoHost(R(r.id))}},"Video "+(i+1)))));
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
      if(e.kind==="drive") ctl.append(h("span",{class:"note"},"Playing from Google Drive"+(vidAccount()?" as "+vidAccount():"")+". Speed, quality and full screen are in Drive's own player; it only plays for people who can open the file. ",h("a",{href:"#",onclick:ev=>{ev.preventDefault();closeNotes();openSettings&&openSettings("project")}},vidAccount()?"Change account":"Pick which Google account")));
      if(e.kind==="folder") ctl.append(h("span",{class:"note"},"A Drive folder: pick a video and it opens in a new tab. Link each shot to its own file to play it here."));
    }
  }
  // the links: add, open, remove
  const list=h("div",{class:"vlist"});
  links.forEach((u,i)=>list.append(h("div",{},h("a",{href:videoEmbed(u).open,target:"_blank",rel:"noopener noreferrer",title:videoUrl(u)},"Video "+(i+1)+": "+(/^https?:|<iframe/i.test(u)?videoEmbed(u).name:u)),
    h("button",{title:"Remove this link","aria-label":"Remove video "+(i+1),onclick:()=>{setVideoLinks(r.id,links.filter((x,j)=>j!==i));renderNotes()}},"✕"))));
  const ph={drive:"Paste a Google Drive link",dropbox:"Paste a Dropbox link",onedrive:"Paste the OneDrive embed code",box:"Paste a Box link",server:"Type a file name or paste a link"}[S.project.vidSource]||"Paste a Google Drive or other video link";
  const inp=h("input",{type:"text",placeholder:ph,spellcheck:"false"});
  const add=()=>{const v=inp.value.trim(); if(!v) return; if(!videoLinks({video:v}).length){toast(vidBase()?"Type a file name with its extension, or paste a link":"That doesn't look like a link. To type file names, set a web address in Settings, Project");return}
    setVideoLinks(r.id,[...links,v]); VID.i=links.length; renderNotes(); toast(videoEmbed(v).kind==="link"?"Link saved: it opens in a new tab":"Video added to shot "+(r.shot||""))};
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();add()}});
  inp.addEventListener("paste",()=>setTimeout(add,30));
  sec.append(h("div",{class:"vwrap"},main,h("div",{class:"vside"},list,inp,h("button",{class:"btn small",onclick:add},links.length?"+ Add another video":"Add video"),
    S.project.vidFolder?h("a",{class:"btn small",href:withAccount(S.project.vidFolder),target:"_blank",rel:"noopener noreferrer"},"Open the project's video folder"):null,
    h("p",{class:"note",style:"margin:0"},(S.project.vidSource==="server"?"Type the file's name as it is in the project folder.":S.project.vidSource==="onedrive"?"In OneDrive: the video, Embed, then copy the code.":"In Drive: right-click the video, Share, then Copy link. Share it with the team (or set it to Anyone with the link) so it plays for everyone.")+" Each shot can have several videos. Where they're kept is set per project in Settings, Project.")) ));
  return sec;
}
function updateVideoHost(r){
  const host=$("#nvVideoHost"); if(!host) return; const pr=S.project||{}; const key=r.id+"|"+(r.video||"")+"|"+VID.i+"|"+[pr.vidSource,vidAccount(),pr.vidFolder,pr.vidBase].join("|");
  host.classList.toggle("has-video",videoLinks(r).length>0);
  if(host.dataset.key===key) return; host.dataset.key=key; host.innerHTML=""; host.append(...videoSection(r).childNodes); cardControls(host); applyNvLayout();
}
// in the table: the links, plus ▶ to open the shot in Note View
function videoCell(r){
  const w=h("div",{class:"videocell"});
  const i=h("input",{class:"cell",type:"text",placeholder:vidBase()?"File name or link":"Video link",value:videoLinks(r).join(", "),"data-k":"video",spellcheck:"false",title:"Video links (or file names, with a web address set in Settings, Project), separated by commas"});
  i.addEventListener("change",()=>{const x=R(r.id);if(!x)return;x.video=videoLinks({video:i.value}).join("\n");commit();renderBody()});
  w.append(i); if(videoLinks(r).length) w.append(h("button",{class:"play",title:"Play in Note View",onclick:()=>{NV.id=r.id;openNotes(r.id)}},"▶"+(videoLinks(r).length>1?" "+videoLinks(r).length:"")));
  return w;
}

/* ---------- sequences: shots grouped and shot in one go ----------
   A sequence is the shots sharing r.seq; its first shot (the anchor, whose id is the sequence id) carries the
   sequence's takes, name and notes, so Slate, Roll / Cut, timecode, take counts and exports all work as for a shot.
   Its DIT name uses the shot range. On Live Action days each take records which shots it caught. */
function seqMembers(r,d){ if(!r||!r.seq) return []; const f=findRow(r.id); d=d||(f&&f.d); if(!d) return []; return d.rows.filter(x=>x.seq===r.seq&&!isBlock(x)); }
function seqAnchor(r){ if(!r||!r.seq) return r; const f=findRow(r.seq); return f&&f.r.seq===r.seq?f.r:r; }
function seqRange(a,d){ const f=findRow(a.id); d=d||(f&&f.d); if(!d) return ""; const m=seqMembers(a,d); if(m.length<2) return "";
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
  if(!r.seq) return h("button",{class:"seqadd",title:"Group this shot with others into a sequence",onclick:()=>openSeqDialog(r.id)},"+");
  const a=seqAnchor(r);
  return h("button",{class:"seqchip",style:`--seq:${seqColor(r.seq)}`,title:"Open Sequence View",onclick:()=>openSeqView(r.seq)},seqTitle(a),r.id===a.id?h("small",{}," · "+takeList(a).length+" take"+(takeList(a).length===1?"":"s")):null);
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
  if(cur&&cur.id!==anchor.id){ for(const k of ["takeLog","seqNotes"]) {anchor[k]=cur[k]||"";cur[k]=""} anchor.takes=cur.takes; cur.takes=0; cur.seqName=""; }
  // shots taken from another sequence leave it (that sequence keeps going if it still has two shots)
  for(const x of keep){ if(x.seq&&x.seq!==(cur&&cur.seq)){ const other=seqAnchor(x); x.seq=""; const rest=seqMembers(other,d).filter(y=>y.id!==x.id); if(rest.length<2) rest.forEach(y=>y.seq=""); else if(other.id===x.id){ const na=rest[0]; for(const y of rest) y.seq=na.id; na.seqName=x.seqName; na.takeLog=x.takeLog; na.takes=x.takes; na.seqNotes=x.seqNotes; x.takeLog=""; x.takes=0; x.seqName=""; x.seqNotes=""; } } }
  for(const x of keep) x.seq=anchor.id;
  anchor.seqName=name;
  commit(); renderAll(); toast(`${cur?"Updated":"Grouped"} ${keep.length} shots as ${name||"a sequence"} - Undo to take it back`);
}
/* Sequence View: the grouped shots in one place, with the sequence's takes and what each caught */
const SQV={id:null};
function daySeqs(d){d=d||D();return d?d.rows.filter(x=>x.seq&&x.seq===x.id&&!isBlock(x)):[]}
function openSeqView(id){ const a=R(id); if(!a) return; const f=findRow(id); if(f&&D()&&f.d.id!==D().id){P.activeByProject[pid()]=f.d.id;savePrefs();renderAll()}
  SQV.id=id; $("#seqView").classList.add("open"); document.body.classList.add("viewopen"); keepAwake(true); renderSeqView(); }
function closeSeqView(){ rememberView(null); $("#seqView").classList.remove("open"); document.body.classList.remove("viewopen"); clearInterval(SQV.timer); keepAwake(false); renderBody(); }
function seqStep(dir){ const l=daySeqs(); if(!l.length) return; let i=l.findIndex(x=>x.id===SQV.id); i=Math.max(0,Math.min(l.length-1,(i<0?0:i)+dir)); SQV.id=l[i].id; renderSeqView(); }
function renderSeqView(){
  const v=$("#seqView"); v.innerHTML=""; const d=D(), a=SQV.id&&R(SQV.id);
  if(!a||!a.seq){ closeSeqView(); return; }
  rememberView("seq",a.id);
  const la=d.kind!=="capture", mem=seqMembers(a,d), cov=seqCoverage(a), take=nextTake(a,d), name=shotName(a,d,take);
  v.append(h("div",{class:"nvhead"},
    h("button",{title:"Previous sequence",onclick:()=>seqStep(-1)},"‹"),
    h("div",{class:"nvtitle"},h("b",{},seqTitle(a)),h("span",{class:"pill",style:`background:${seqColor(a.seq)};color:#fff`},seqRange(a,d)),seqAnyVcs(a)?h("span",{class:"pill"},"VCS"):null,h("span",{class:"note"},d.name+" · next take "+take)),
    h("button",{title:"Next sequence",onclick:()=>seqStep(1)},"›"),
    h("button",{class:"nvreset",onclick:()=>openSeqDialog(a.id)},"Edit shots"),
    h("button",{title:"Close",onclick:closeSeqView},"✕")));
  const body=h("div",{class:"nvbody"});
  // DIT name for the next take
  const dit=h("section",{},h("h3",{},"DIT name"),h("div",{class:"seqdit"},h("code",{},name||"-"),h("button",{class:"btn small",onclick:async()=>{if(await copyText(name))toast("Copied "+name)}},"Copy")),
    h("p",{class:"note"},"Covers shots "+seqRange(a,d)+". "+(la?"Every storyboard shot still needs catching: tick what each take got.":"Mocap: each take records the whole action; framing is set in post.")));
  // the shots
  const shots=h("section",{class:"seqshots"},h("h3",{},`Shots (${mem.length})`));
  for(const m of mem){ const got=cov.caught.get(m.id); const im=h("img",{alt:""}); if(m.ref1) imgSrc(m.ref1).then(s=>{if(s)im.src=s});
    shots.append(h("div",{class:"seqshot"+(la?(got?" got":" miss"):"")},m.ref1?im:h("div",{class:"noimg"}),
      h("div",{},h("b",{},"Shot "+(m.shot||"-")),m.vcs?h("span",{class:"pill"},"VCS"):null,h("p",{},String(m.action||m.description||"").slice(0,120)),
        la?h("small",{},got?"Caught in "+got.map(n=>"T"+n).join(", "):"Not caught yet"):null,
        h("button",{class:"go",onclick:()=>{closeSeqView();openNotes(m.id)}},"Notes"))));
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
    const row=h("div",{class:"nvtake"},h("b",{},"T"+t.n),h("span",{class:"mono note nvtc"},t.tc?"in "+t.tc:"",t.out?" → out "+t.out:(rollingTake(a)===t?" ● rolling":""),t.len?" · "+t.len:""),marks);
    if(la){ const ticks=h("span",{class:"seqticks"},h("small",{class:"note"},"Caught:"));
      for(const m of mem){ const on=(t.caught||[]).includes(m.id); ticks.append(h("button",{class:"tick"+(on?" on":""),title:(on?"Caught":"Not caught")+": shot "+(m.shot||""),onclick:()=>edit(t.n,z=>{const c=new Set(z.caught||[]);c.has(m.id)?c.delete(m.id):c.add(m.id);z.caught=mem.map(y=>y.id).filter(id=>c.has(id))})},m.shot||"?")); }
      ticks.append(h("button",{class:"tick all",onclick:()=>edit(t.n,z=>{z.caught=(z.caught||[]).length===mem.length?[]:mem.map(y=>y.id)})},(t.caught||[]).length===mem.length?"None":"All"));
      row.append(ticks); }
    const note=h("input",{value:t.note||"",placeholder:"note"}); note.addEventListener("change",()=>edit(t.n,z=>{z.note=note.value})); row.append(note);
    takes.append(row);
  }
  const notes=h("section",{},h("h3",{},"Sequence notes"));
  const ta=h("textarea",{rows:"4",placeholder:"Blocking, what to watch for, pickups needed"}); ta.value=a.seqNotes||"";
  ta.addEventListener("input",()=>{const x=R(a.id);if(x){x.seqNotes=ta.value;softCommit()}}); ta.addEventListener("change",commit); notes.append(ta);
  body.append(shots,takes,dit,notes); v.append(body,h("p",{class:"keyhint"},"Keys: R roll / cut · T log a take · G N H S mark the last take · ← → sequences · F full screen · Esc close"));
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
$("#dedupeBtn").onclick=()=>dedupePictures();
$("#docPrint").onclick=printDoc;
$("#docCopy").onclick=async()=>{if(await copyText(docText()))toast("Copied as text, ready to paste into an email or message")};
