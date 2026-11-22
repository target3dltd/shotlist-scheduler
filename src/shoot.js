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
  // leave out optional parts nobody filled in, and standard sections that are switched off
  $$("#docBody .csopt").forEach(el=>{if(![...el.querySelectorAll("textarea")].some(t=>t.value.trim()))el.classList.add("printhide")});
  $$("#docBody .csrow").forEach(el=>{const t=el.querySelector("textarea");if(t&&!t.value.trim())el.classList.add("printhide")});
  $$("#docBody .cstable tbody tr").forEach(tr=>{if(![...tr.querySelectorAll("textarea")].some(t=>t.value.trim()))tr.classList.add("printhide")});
  const done=()=>{document.body.classList.remove("printdoc");$$("#docBody .ta-print").forEach(x=>x.remove());$$("#docBody .printhide").forEach(x=>x.classList.remove("printhide"));removeEventListener("afterprint",done)};
  addEventListener("afterprint",done); window.print(); setTimeout(()=>{if(!matchMedia("print").matches&&document.body.classList.contains("printdoc"))done()},1500);
}
function docText(){
  const out=[]; const walk=el=>{
    for(const n of el.childNodes){
      if(n.nodeType===3){const t=n.textContent.replace(/\s+/g," ");if(t.trim())out.push(t);continue}
      if(n.nodeType!==1||n.classList.contains("noprint")||n.tagName==="BUTTON") continue;
      if(n.tagName==="TEXTAREA"||n.tagName==="INPUT"){if(n.value)out.push(n.value);continue}
      if(n.tagName==="TR"){const cells=[...n.children].filter(c=>!c.classList.contains("noprint")).map(c=>{const ta=c.querySelector("textarea");return (ta?ta.value:c.innerText).replace(/\s+/g," ").trim()}).filter(Boolean);if(cells.length)out.push("\n"+cells.join("  |  "));continue}
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
  if(pr.csCompany) b.append(h("p",{class:"docco"},pr.csCompany));
  b.append(h("section",{class:"docsec csopt"},h("h3",{},"Call times"),csBox(d,"csCalls","One per line, e.g.\n07:00 Production & runners\n07:30 Hair & make-up, talent\n08:00 Main unit\n09:30 Client",false)));
  b.append(emergencySection(d));
  const sky=skyLine(d,true);
  b.append(h("section",{class:"docsec"},h("h3",{},"Location"),
    h("div",{class:"doc2"},h("div",{},h("label",{class:"doclabel"},"Address and access"),dayNoteBox(d,"address","Address, postcode, unit base, what3words, access notes")),
      h("div",{},h("label",{class:"doclabel"},"Weather and daylight"),sky||h("p",{class:"note"},"No location set for this day."),locationButton(d,"noprint"))),
    h("div",{class:"csopt",style:"margin-top:.5rem"},h("label",{class:"doclabel"},"Travel and parking"),csBox(d,"csTravel","Nearest stations and walk times, parking (and who it's booked for), load-in",false))));
  b.append(h("section",{class:"docsec csopt"},h("h3",{},"Notes"),dayNoteBox(d,"callNotes","Catering, wardrobe, what to bring, anything else for the day")));
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
  b.append(tableSection(d,CS_KIT));
  for(const s of CS_STD) b.append(stdSection(s));
  b.append(tableSection(d,CS_RISK));
  b.append(h("details",{class:"noprint cssetup"},h("summary",{},"Company line"),h("p",{class:"note"},"Shown under the title on every call sheet in this project, e.g. production company, address and phone."),csBox(null,"csCompany","e.g. Target3D Ltd · 11C Dock Street, London E1 8JN · 0203 488 2575",true)));
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
    const marks=[...a.filter(t=>t.mark==="hero"||t.mark==="safety"||t.mark==="good").map(t=>`T${t.n} ${t.mark}${t.tc?" @ "+t.tc:""}`),
      ...a.flatMap(t=>(t.resets||[]).filter(x=>x.mark==="hero"||x.mark==="safety"||x.mark==="good").map(x=>`T${t.n} R${x.n} ${x.mark} @ ${x.tc}`))].join(", ");
    const vs=r.done&&r.doneAt!=null?Math.round(r.doneAt-c.end):null;
    tb.append(h("tr",{class:r.done?"":"undone"},h("td",{class:"nowrap"},h("b",{},r.shot||"-")),h("td",{},String((capture?r.action:r.description)||r.description||r.action||"").slice(0,120)),
      h("td",{class:"num"},String(Number(r.takes)||0)),h("td",{},marks||""),h("td",{class:"nowrap"},r.done?(r.doneAt!=null?fmt(r.doneAt):"done"):"not shot"),
      h("td",{class:"nowrap "+(vs>0?"bad":vs<0?"good":"")},vs==null?"":vs===0?"on plan":(vs>0?"+":"−")+dur(Math.abs(vs)))));
  }
  t.append(tb); b.append(h("section",{class:"docsec"},h("h3",{},"Shots"),t));
  b.append(planVsActual(d,W.C));
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
  const head=["Day","Date","Shot #","Take","Clip name","Mark","TC in","TC out","Duration (s)","Duration","Logged at","Take note","Resets","Shot description","Action","Location / setup","Shot notes","Hero URL","Safety URL","Frame rate"];
  const lines=[head.map(csvEsc).join(",")]; let n=0;
  const fps=Number(S.project.fps)||"";
  for(const d of days) for(const r of d.rows){ if(isBlock(r)) continue;
    for(const t of takeList(r)){ n++; const ms=takeMs(t);
      lines.push([d.name,d.date||"",r.shot||"",t.n,t.name||shotName(r,d,t.n)||"",t.mark?t.mark[0].toUpperCase()+t.mark.slice(1):"",t.tc||"",t.out||"",ms?Math.round(ms/100)/10:"",ms?durSecs(ms):"",
        t.at?new Date(t.at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"}):(t.t||""),t.note||"",resetText(t),r.description||"",r.action||"",r.location||"",r.notes||r.director||"",r.heroUrl||"",r.safetyUrl||"",fps].map(csvEsc).join(","));
    } }
  if(!n){toast("No takes logged yet. Takes come from Slate View or Details.");return}
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
  item("awake","Screens stay on","wakeLock" in navigator?"Slate View and Details keep the screen awake on this device. Plug in or charge the slating device.":"This browser can't keep the screen awake: set auto-lock to Never on this device.","wakeLock" in navigator?true:false);
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
  if((m=url.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]{10,})/))) return {kind:"drive",src:withAccount(`https://drive.google.com/file/d/${m[1]}/preview`),open:withAccount(`https://drive.google.com/file/d/${m[1]}/view`),name:"Drive video",id:m[1]};
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
  const tips={drive:"Paste Drive file links into each shot (Details or the Reference video column). If you're signed into several Google accounts, enter the one that can see this project's files: Drive then opens them with it instead of whichever account is first. That's your own setting; each person enters theirs, and nobody else sees it.",
    dropbox:"Paste Dropbox file links; they play with speed, frame steps, loop and mirror.",
    onedrive:"In OneDrive or SharePoint choose the video, then Embed, and paste the whole embed code into the shot. Plain share links open in a new tab.",
    box:"Paste Box shared links; they play in Box's own player.",
    server:"Give the web address of the project's folder (https://…). The team can then type just a file name for each shot, such as SH030_rehearsal.mp4. Browsers can't play from FTP: most NAS and FTP hosts can also share over HTTPS, which is what's needed here.",
    other:"Paste any link. Video files (.mp4, .mov, .webm) play in place; embed codes (<iframe…>) play in their own player; anything else opens in a new tab."};
  if(src==="drive"){ const i=h("input",{type:"email",value:vidAccount(),placeholder:"you@company.com",spellcheck:"false"});
    i.addEventListener("change",()=>{setVidAccount(i.value);const vh=$("#nvVideoHost");if(vh)vh.dataset.key="";toast(i.value.trim()?"Drive videos will open with "+i.value.trim()+" on this device":"Drive videos open with your default Google account")});
    f.append(h("label",{},"Your Google account for this project",i,h("small",{class:"note"},"Just for you, on this device. Everyone sets their own.")));
    f.append(h("label",{},"Google API key for playing Drive videos in Edit (optional)",(()=>{const k=h("input",{type:"text",value:pr.driveKey||"",placeholder:"AIza…",spellcheck:"false",autocomplete:"off"});bindDoc(k,null,v=>{S.project.driveKey=v.trim()});return k})(),
      h("small",{class:"note"},"Drive's own player can't be timed from the page. With a key, Drive files shared as 'Anyone with the link' play straight into the Edit tool, on time and with in points. Make the key in Google Cloud Console (APIs & Services > Credentials), turn on the Google Drive API, and restrict the key to this site's address. It's shared with the team."))); }
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
  w.append(i); if(videoLinks(r).length) w.append(h("button",{class:"play",title:"Play in Details",onclick:()=>{NV.id=r.id;openNotes(r.id)}},"▶"+(videoLinks(r).length>1?" "+videoLinks(r).length:"")));
  return w;
}

/* ---------- Status in the first column: To do / Setting up / Rolling / Shooting / Shot / Cut ---------- */
let NOWCUR=null;
// the shot (or sequence's first shot) we're on: the live one on the shoot day, otherwise only one picked by hand
function nowCurId(d,C){ if(d&&d.onRow==="none") return null; const L=liveStatus(d,C); if(L&&L.phase==="break") return null; const c=L?L.cur:(d.onRow&&R(d.onRow)); if(!c||c.done) return null; return c.seq&&R(c.seq)?seqAnchor(c).id:c.id; }
function rowStatus(r,cur){
  if(r.cut) return "cut"; if(r.done) return "shot";
  const t=r.seq&&R(r.seq)?seqAnchor(r):r; if(rollingTake(t)) return "rolling";
  if(cur&&t.id===cur){ const tk=takeList(t).filter(x=>x.at&&Date.now()-x.at<16*3600e3); if(!tk.length) return "setup";
    // set back to Setting up after takes (a reset or re-rig): setting up again until the next take rolls
    const d=D(), last=Math.max(...tk.map(x=>x.at+(x.ms||0))); return d&&d.onRow===t.id&&d.onSince>last?"setup":"shooting"; }
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
    item("To do",()=>{const x=R(id);if(rollingTake(t))cutTake(t.id);undone(x);x.cut=false;t.setupAt=null;
      // step back: nobody's on this one now (so it doesn't show Setting up just because it's next)
      if(d.onRow===t.id||st==="setup"||st==="shooting"||st==="rolling"){d.onRow="none";d.onSince=null}afterStatus()},st==="todo"?"":"not started, step back",st==="todo"),
    item("Setting up",()=>{const x=R(id);const had=takeList(t).length>0;if(rollingTake(t))cutTake(t.id);undone(x);x.cut=false;d.onRow=t.id;d.onSince=Date.now();if(!had||!t.setupAt)t.setupAt=Date.now();afterStatus();toast(had?"Setting up again (reset): back to Shooting when the next take rolls":"Setting up: ahead / behind counts from now until you roll")},st==="shooting"||st==="rolling"?"reset between takes, not rolling":"we're on it, not rolling yet",st==="setup"),
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
  const fromA=r.seq?seqAnchor(r):null, fromGrp=fromA?fromA.seqDup:"", wasAnchor=fromA&&fromA.id===r.id;
  const SEQF=["seqName","takeLog","seqNotes","seqTime","seqSetup","seqShoot","seqVideo"], blank={seqName:"",takeLog:"",seqNotes:"",seqTime:false,seqSetup:0,seqShoot:0,seqVideo:""};
  // leaving: if it was the sequence's first shot, the sequence's takes, name and timing pass to the next one
  if(r.seq){ const a=seqAnchor(r), rest=seqMembers(a,d).filter(x=>x.id!==r.id);
    if(a.id===r.id&&rest.length){ const na=rest[0]; for(const k of SEQF) na[k]=r[k]; na.takes=r.takes; na.seqDup=r.seqDup; r.seqDup=""; rest.forEach(x=>x.seq=na.id); if(SQV.id===r.id) SQV.id=na.id; }
    // its takes went with the sequence; a sequence of one keeps them on the shot
    if(a.id===r.id){ if(rest.length){ Object.assign(r,blank); r.takes=0; } else Object.assign(r,{seqName:"",seqNotes:"",seqTime:false,seqSetup:0,seqShoot:0}); }
    r.seq=""; }
  let msg="";
  if(target==="new"){ const names=new Set(daySeqs(d).map(x=>x.seqName)); let n=1; while(names.has("Sequence "+n)) n++; r.seq=r.id; r.seqName="Sequence "+n; msg=`Shot ${r.shot||""} starts ${r.seqName}: double-click its name to rename it`; }
  else if(target){ const ta=R(target); if(ta){ r.seq=ta.seq; msg=`Shot ${r.shot||""} moved to ${seqTitle(ta)}`; } }
  else msg=`Shot ${r.shot||""} taken out of the sequence`;
  commit(); renderAll(); if($("#seqView").classList.contains("open")) renderSeqView(); toast(msg+" - Undo to put it back");
  // it left a duplicated sequence: offer the same to the copies (the sequence it left is the one in the group on this day that isn't r)
  if(fromGrp){ const left=wasAnchor?d.rows.find(x=>x.seq===x.id&&x.seqDup===fromGrp&&x.id!==r.id&&x.seq!==r.seq&&seqMembers(x,d).length):fromA;
    if(left&&left.seqDup===fromGrp&&r.seq!==left.seq) offerSeqPush(left.id,"its shots (Shot "+(r.shot||"?")+" taken out)",c=>seqPushMembers(c,[],[r])); }
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
  // the sequence's own shots first (ticked), then the rest of the day
  const mine=cur?shots.filter(x=>pick.has(x.id)):[], rest=cur?shots.filter(x=>!pick.has(x.id)):shots;
  const rowFor=x=>{ const cb=h("input",{type:"checkbox"}); cb.checked=pick.has(x.id); cb.addEventListener("change",()=>{cb.checked?pick.add(x.id):pick.delete(x.id);upd()});
    const other=x.seq&&(!cur||x.seq!==cur.seq)?h("small",{class:"note"}," (in "+seqTitle(seqAnchor(x))+")"):null;
    list.append(h("label",{},cb,h("b",{},x.shot||"-"),h("span",{}," "+String(x.action||x.description||"").slice(0,70)),other)); };
  if(cur){ list.append(h("div",{class:"seqpickhd"},`In ${seqTitle(cur)} (${mine.length})`)); mine.forEach(rowFor); list.append(h("div",{class:"seqpickhd"},"Other shots on this day")); }
  rest.forEach(rowFor);
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
  const before=cur?seqMembers(cur,d).map(x=>x.id):[], grp=cur?cur.seqDup:"";
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
  if(grp&&!anchor.seqDup) anchor.seqDup=grp;
  if(cur&&cur.id!==anchor.id) cur.seqDup="";
  commit(); renderAll(); toast(`${cur?"Updated":"Grouped"} ${keep.length} shots as ${name||"a sequence"} - Undo to take it back`);
  if(cur){ const added=keep.filter(x=>!before.includes(x.id)), removed=before.filter(id=>!ids.includes(id)).map(id=>R(id)).filter(Boolean);
    if(added.length||removed.length) offerSeqPush(anchor.id,"its shots ("+[added.length?`${added.length} added`:"",removed.length?`${removed.length} taken out`:""].filter(Boolean).join(", ")+")",c=>seqPushMembers(c,added,removed)); }
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
  offerSeqPush(a.id,"its timing",(c,x)=>{c.seqTime=x.seqTime;c.seqSetup=x.seqSetup;c.seqShoot=x.seqShoot});
  toast(on?`${seqTitle(a)} is timed as one: setup ${a.seqSetup} min, shoot ${a.seqShoot} min`:`${seqTitle(a)} back to per-shot timings`); }
function setSeqMins(id,k,v){ if(frozenNo()) return; const a=R(id); if(!a) return; a[k]=Math.max(0,Math.round(Number(v)||0)); commit(); renderAll(); if($("#seqView").classList.contains("open")) renderSeqView();
  offerSeqPush(a.id,k==="seqSetup"?"its setup time":"its shoot time",(c,x)=>{c[k]=x[k];c.seqTime=x.seqTime}); }
function dupSeq(id){
  if(frozenNo()) return; const f=findRow(id); if(!f) return; const d=f.d, a=f.r, mem=seqMembers(a,d); if(!mem.length) return;
  commit();
  const copies=mem.map(m=>Object.assign({},m,{id:uid("r"),done:false,doneAt:null,takes:0,takeLog:"",cut:false,origStart:"",setupAt:null,dupSrc:twinKey(m)}));
  const na=copies[0]; for(const c of copies) c.seq=na.id;
  const group=a.seqDup||a.id; a.seqDup=group;
  const base=String(a.seqName||"Sequence").replace(/\s*\(\d+\)$/,""); let n=2; const names=new Set(d.rows.filter(x=>x.seq===x.id).map(x=>x.seqName)); while(names.has(`${base} (${n})`)) n++;
  na.seqName=`${base} (${n})`; na.seqTime=a.seqTime; na.seqSetup=a.seqSetup; na.seqShoot=a.seqShoot; na.seqNotes=a.seqNotes;
  for(const c of copies.slice(1)){ c.seqName=""; c.seqTime=false; c.seqSetup=0; c.seqShoot=0; c.seqNotes=""; c.seqDup=""; }
  na.seqDup=group;
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
      ...(inside.some(r=>!isBlock(r))?[
        // other shots in the way: bring the sequence's own shots together, the rest stay where they are
        h("button",{class:"lnk noprint",title:"Move the sequence's shots up to sit together where its first shot is; the other shots stay put",onclick:()=>gatherSeq(id,"first")},"gather at Shot "+(all[lo].shot||"-")),
        h("button",{class:"lnk noprint",title:"Move the sequence's shots down to sit together where its last shot is; the other shots stay put",onclick:()=>gatherSeq(id,"last")},"gather at Shot "+(all[hi].shot||"-"))]
      :[ // only breaks in the way: move them out, after or before
        h("button",{class:"lnk noprint",title:"Put "+names.join(", ")+" straight after the sequence's last shot",onclick:()=>moveRowsTo(inside.map(r=>r.id),all[hi].id,true)},"move "+(inside.length===1?names[0]:"them")+" out after"),
        h("button",{class:"lnk noprint",title:"Put "+names.join(", ")+" straight before the sequence's first shot",onclick:()=>moveRowsTo(inside.map(r=>r.id),all[lo].id,false)},"out before")])); }
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
    viewSwitch());
  // DIT name for the next take
  const dit=h("section",{},h("h3",{},"DIT name"),h("div",{class:"seqdit"},h("code",{},name||"-"),h("button",{class:"btn small",onclick:async()=>{if(await copyText(name))toast("Copied "+name)}},"Copy")),
    h("p",{class:"note"},"Covers shots "+seqRange(a,d)+". "+(la?"Every storyboard shot still needs catching: tick what each take got.":"Mocap: each take records the whole action; framing is set in post.")));
  // the shots
  const shots=h("section",{class:"seqshots"},h("h3",{},`Shots (${mem.length})`));
  for(const m of mem){ const got=cov.caught.get(m.id); const im=h("img",{alt:""}); if(m.ref1) imgSrc(m.ref1).then(s=>{if(s)im.src=s});
    shots.append(h("div",{class:"seqshot"+(la?(got?" got":" miss"):""),"data-id":m.id},
      h("button",{class:"sqgrip",type:"button",title:"Drag to reorder (or use the arrow keys)","aria-label":"Reorder shot "+(m.shot||""),onpointerdown:e=>sqDrag(e,m.id),onkeydown:e=>{if(e.key==="ArrowUp"||e.key==="ArrowDown"){e.preventDefault();e.stopPropagation();sqMove(m.id,e.key==="ArrowUp"?-1:1,true)}}},"⠿"),
      m.ref1?im:h("div",{class:"noimg"}),
      h("div",{},h("b",{},"Shot "+(m.shot||"-")),m.vcs?h("span",{class:"pill"},"VCS"):null,h("p",{},String(m.action||m.description||"").slice(0,120)),
        la?h("small",{},got?"Caught in "+got.map(n=>"T"+n).join(", "):"Not caught yet"):null,
        h("button",{class:"go",onclick:()=>{closeSeqView();openNotes(m.id)}},"Details"),
        h("button",{class:"go",style:"margin-left:.6rem",title:"Move this shot to another sequence, or start a new one",onclick:e=>seqMenu(e.currentTarget,m.id)},"Move…"),
        h("button",{class:"go",style:"margin-left:.6rem",title:"Take this shot out of the sequence (it stays on the day)",onclick:()=>moveToSeq(m.id,"")},"Remove"),
        videoLinks(m).length?h("button",{class:"go",style:"margin-left:.6rem",title:"This shot has its own reference video",onclick:()=>{closeSeqView();openNotes(m.id)}},"▶ shot video"):null)));
  }
  if(la) shots.append(h("p",{class:"seqcov "+(cov.missing.length?"miss":"got")},cov.missing.length?`Still to get: ${cov.missing.map(m=>m.shot||"?").join(", ")}`:"Every shot caught"+(takeList(a).length?"":" (no takes yet)")));
  // takes
  const takes=h("section",{},h("h3",{},"Takes"));
  const rolling=rollingTake(a); const extra=()=>la?{caught:[]}:{};
  const clock=h("span",{class:"mono nvclock"},rolling?fmtDur(Date.now()-rolling.at):"0:00");
  clearInterval(SQV.timer); if(rolling) SQV.timer=setInterval(()=>{const t=rollingTake(R(a.id));if(t)clock.textContent=fmtDur(Date.now()-t.at);else{clearInterval(SQV.timer);renderSeqView()}},250);
  takes.append(h("div",{class:"toolbar"},h("button",{class:"btn"+(rolling?" rolling":""),onclick:()=>{rollingTake(R(a.id))?cutTake(a.id):logTake(a.id,extra());renderSeqView()}},rolling?"■ Cut":"● Roll"),
    h("button",{class:"btn resetb",disabled:!rolling,title:"Reset: go again without cutting. Marks R1, R2... with the timecode on the take that's rolling (E)",onclick:()=>{resetTake(a.id);renderSeqView()}},resetLabel(a)),clock,
    h("button",{class:"btn",title:"Add a take you didn't roll on (fills in a missing take number, nothing starts rolling). Double-click its timecode to fill it in.",onclick:()=>{addMissedTake(a.id,extra());renderSeqView()}},"+ Take"),
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
    row.append(resetChips(a.id,t,()=>renderSeqView()));
    row.append(h("button",{class:"nvdel",title:"Remove this take (you can undo it)",onclick:()=>deleteTake(a.id,t.n,()=>renderSeqView())},"✕"));
    takes.append(row);
  }
  const notes=h("section",{},h("h3",{},"Sequence notes"));
  const ta=h("textarea",{rows:"4",placeholder:"Blocking, what to watch for, pickups needed"}); ta.value=a.seqNotes||"";
  ta.addEventListener("input",()=>{const x=R(a.id);if(x){x.seqNotes=ta.value;softCommit()}}); ta.addEventListener("change",()=>{commit();offerSeqPush(a.id,"its notes",(c,x)=>{c.seqNotes=x.seqNotes})}); notes.append(ta);
  const C=compute(d), sp=seqSpan(a,C,d);
  const timing=h("section",{},h("h3",{},"Timing"));
  if(a.seqTime){ const inp=(k,l)=>{const i=h("input",{type:"number",min:"0",step:"5",value:String(Number(a[k])||0),style:"width:5rem"});i.addEventListener("change",()=>setSeqMins(a.id,k,i.value));return h("label",{class:"mins2",style:"margin-right:1rem"},l+" ",i," min")};
    timing.append(h("p",{},inp("seqSetup","Setup"),inp("seqShoot","Shoot")),h("p",{class:"note"},"One setup and shoot for the whole sequence. "+(sp?fmt(sp.start)+" → "+fmt(sp.end)+". ":""),h("button",{class:"go",onclick:()=>setSeqTime(a.id,false)},"Time per shot instead"))); }
  else timing.append(h("p",{},sp?`${fmt(sp.start)} → ${fmt(sp.end)} · setup ${dur(sp.su)} · shoot ${dur(sp.sh)} (adding up each shot's own times)`:""),h("button",{class:"btn small",onclick:()=>setSeqTime(a.id,true)},"Time the sequence as one"));
  shots.classList.add("sqshots"); takes.classList.add("sqtk");
  for(const sec of [shots,takes,timing,dit,notes]) body.insertBefore(sec,host);
  if(body.parentNode!==v) v.append(body); v.insertBefore(head,body);
  updateVideoHost(a,{field:"seqVideo",host:"#sqVideoHost"});
  v.append(h("p",{class:"keyhint"},"Keys: R roll / cut · E reset · T add a missed take · G N H S mark the last take · ← → sequences · F full screen · Esc close"));
}

/* ---------- Note View panels: drag ⠿ to move, drag the corner to resize (kept per device) ----------
   Panels are reordered with CSS order and sized with grid spans, never moved in the page, so a playing video carries on. */
const NV_CARDS=["what","video","takes","notes","edit","scribble"];
function nvLayout(){P.nvLayout=P.nvLayout||{};return P.nvLayout}
function nvCustom(){const L=P.nvLayout||{};return !!((L.order&&L.order.length)||Object.keys(L.span||{}).length||Object.keys(L.h||{}).length)}
// how many columns the panel grid has room for (the same sum the grid does: 26rem panels and their gaps), whatever is spanning now
function nvCols(body){const cs=getComputedStyle(body),gap=parseFloat(cs.columnGap)||16,inner=body.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0);
  const rem=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,min=Math.min(inner,26*rem);return Math.max(1,Math.floor((inner+gap)/(min+gap)))}
function applyNvLayout(){
  const body=$("#nvBody"); if(!body) return; const L=nvLayout(), cols=nvCols(body);
  for(const c of body.children){ const k=c.dataset.card; if(!k) continue;
    const i=(L.order||[]).indexOf(k); c.style.order=i>=0?String(i):(L.order&&L.order.length?String(100+NV_CARDS.indexOf(k)):"");
    const sp=Math.min(cols,Number((L.span||{})[k])||1); c.style.gridColumn=sp>1?`span ${sp}`:"";
    const hh=Number((L.h||{})[k]); c.style.height=hh&&cols>1?hh+"px":""; c.classList.toggle("sized",!!(hh&&cols>1)); }
  const rb=$("#noteView .nvreset"); if(rb) rb.hidden=!nvCustom();
}
function resetNvLayout(){P.nvLayout={};savePrefs();applyNvLayout();toast("Details layout reset")}
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
      const f=findRow(s.id); if(f&&!f.d.archived){ P.activeByProject[pid()]=f.d.id; renderAll(); s.view==="slate"?openSlate(s.id):s.view==="seq"?openSeqView(s.id):s.view==="edit"?openEdit():openNotes(s.id); } }
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
    if(r.cut) return;
    if(isBlock(r)){ // a break / tech row that was marked: its real times
      const c=C.rows[r.id]||{}, sA=r.setupAt&&ok(dayMinOf(d,r.setupAt))?dayMinOf(d,r.setupAt):null, eA=r.done&&ok(r.doneAt)?Number(r.doneAt):null;
      if(sA==null&&eA==null) return;
      const s=sA!=null?sA:eA-(c.sh||0), e=eA!=null?eA:(now!=null?Math.max(s,now):null); if(e==null) return;
      units.push({blockU:true,a:r,idx,name:blockName(r),blk:[s,e],live:eA==null,est:sA==null,pLen:c.sh||0,first:s}); return; }
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
    if(u.blockU){ u.end=u.blk[1]; prev=u; continue; }
    const setupE=u.shootS!=null?u.shootS:(u.isCur?now:null);
    let s=u.setupAt;
    if(s==null&&prev&&prev.end!=null&&setupE!=null){
      // set up from when the last one finished, less any break / tech rows that sit between them in the list
      s=prev.end;
      if(u.idx>prev.idx){ const blk=d.rows.slice(prev.idx+1,u.idx).filter(b=>isBlock(b)&&!b.cut&&!b.setupAt&&!b.done).reduce((t,b)=>t+((C.rows[b.id]||{}).sh||0),0);
        if(blk>0){ const be=Math.min(setupE,s+blk); u.brk=[s,be]; s=be; } }
    }
    if(s!=null&&setupE!=null&&s<=setupE) u.setup=[s,setupE];
    if(u.shootS!=null&&u.shootE!=null) u.shoot=[u.shootS,u.shootE];
    else if(u.shootS==null&&u.done&&u.shootE!=null&&prev&&prev.end!=null&&!u.setup){ const s0=u.brk?u.brk[1]:prev.end; if(s0<u.shootE) u.nolog=[s0,u.shootE]; }
    u.end=u.shoot?u.shoot[1]:u.nolog?u.nolog[1]:u.setup?u.setup[1]:null;
    u.idx=Math.max(u.idx,prev?prev.idx:0); prev=u.end!=null?u:prev;
  }
  return units.filter(u=>u.blockU||u.setup||u.shoot||u.nolog);
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
    if(u.blockU){ const s=h("div",{class:"seg "+(u.a.type==="tech"?"tech":"break")+(u.live?" live":""),style:`left:${pct(u.blk[0])};width:${w(...u.blk)};border-left:1px solid var(--panel)`,title:`${u.name} - ${u.est?"ended":fmt(u.blk[0])+" to"} ${fmt(u.blk[1])}${u.live?" (so far)":""}: ${mins(u.blk)} min, planned ${Math.round(u.pLen)}${u.est?" (start not marked, drawn at its planned length)":""}`}); s.onclick=go; tl.append(s); continue; }
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
    const on=key==="pace"?(P.showPace!==false&&body.classList.contains("on")):key==="timeline"?(P.showTl!==false&&!P.focus&&!!d):(nAct>0);
    const merged=key==="pace"&&on&&paceMerged()&&!!$("#stats .stat.live");
    const fold=merged?!P.paceOpen:!!P.panelFold[key];
    head.hidden=!on||merged; if(key!=="pace") body.hidden=!on;
    body.classList.toggle("pfold",on&&fold);
    let sum="";
    if(key==="pace"&&on){ const n=$(".pacenum",body), wd=$(".pacewords b",body); sum=(n?n.textContent:"")+(wd?" · "+wd.textContent:""); }
    if(key==="timeline"&&on&&C) sum=`${fmt(toMin(d.call||"09:00"))} to ${fmt(C.wrap)} planned · target wrap ${fmt(wrapMin(d))}`;
    if(key==="actual"&&on) sum=ACT_SUM;
    head.replaceChildren(h("b",{},PANELS[key]),h("span",{class:"note"},sum),h("span",{class:"chev"},fold?"▾ show":"▴ hide"));
    head.setAttribute("aria-expanded",String(!fold));
    head.onclick=()=>{ if(merged){P.paceOpen=!P.paceOpen;savePrefs();const C2=compute();renderStats(C2);renderPanels(C2);return} P.panelFold[key]=!P.panelFold[key]; savePrefs(); const C2=compute(); if(key==="timeline"&&!P.panelFold[key]) renderTimeline(C2); renderPanels(C2); };
  }
}
// back to the top: a round button bottom right once you've scrolled down the list
(function(){ const b=$("#topBtn"); if(!b) return;
  const upd=()=>b.classList.toggle("show",window.scrollY>500);
  window.addEventListener("scroll",upd,{passive:true}); upd();
  b.onclick=()=>window.scrollTo({top:0,behavior:P.calm?"auto":"smooth"});
})();

// ---- Summary cards: choose which show (per device) ----
const STAT_CARDS=[["running","Running","ahead / behind on the shoot day"],["wrap","Calculated wrap","and how far over / under target"],["length","Day length",""],["setup","Setup total",""],["shooting","Shooting total",""],["breaks","Breaks / moves",""],["tech","Tech / turnaround","when the day has any"],["shots","Shots","shot, to go, cut"],["takes","Takes",""],["footage","Raw footage / Captured","timed takes"],["hero","Hero selects","Mocap"],["orig","Original wrap","when one is set"]];
function statKey(label){ return ({"Running":"running","Calculated wrap":"wrap","Day length":"length","Setup total":"setup","Shooting total":"shooting","Breaks / moves":"breaks","Tech / turnaround":"tech","Shots":"shots","Takes":"takes","Raw footage":"footage","Captured":"footage","Hero selects":"hero","Original wrap":"orig"})[label]||label; }
function statHidden(){ return Array.isArray(P.statHidden)?P.statHidden:[]; }
function setStatShown(k,on){ const H=statHidden().filter(x=>x!==k); if(!on) H.push(k); P.statHidden=H; savePrefs(); }
function statCardMenu(anchor){
  $$(".locpop").forEach(x=>x.remove());
  const pop=h("div",{class:"locpop seqmenu statmenu",role:"menu"});
  const draw=()=>{ pop.replaceChildren(h("div",{class:"note",style:"margin:0 .3rem .3rem"},"Show these cards (this device)"));
    for(const [k,label] of STAT_CARDS){ const cb=h("input",{type:"checkbox"}); cb.checked=!statHidden().includes(k);
      cb.addEventListener("change",()=>{setStatShown(k,cb.checked);renderStats(compute())}); pop.append(h("label",{class:"mi"},cb," ",label)); }
    const hb=h("input",{type:"checkbox"}); hb.checked=P.showHints!==false; hb.addEventListener("change",()=>{P.showHints=hb.checked;savePrefs();renderStats(compute())});
    pop.append(h("label",{class:"mi",style:"border-top:1px solid var(--line);margin-top:.2rem;padding-top:.4rem"},hb," Hints under the cards"));
    pop.append(h("button",{class:"mi",onclick:()=>{P.statHidden=[];P.showHints=true;savePrefs();renderStats(compute());draw();pop.prepend(statMenuTop())}},"Show all")); };
  draw(); pop.prepend(statMenuTop()); document.body.append(pop);
  const b=anchor.getBoundingClientRect(); pop.style.top=Math.max(8,Math.min(b.bottom+6,innerHeight-pop.offsetHeight-8))+"px"; pop.style.left=Math.max(8,Math.min(b.left,innerWidth-pop.offsetWidth-8))+"px";
  setTimeout(()=>document.addEventListener("pointerdown",function off(e){if(!pop.contains(e.target)&&e.target.isConnected){pop.remove();document.removeEventListener("pointerdown",off)}}),0);
}

// ---- Shoot-day focus, layouts by role, pace in the Running card, phone mini-bar ----
const FOCUS_CARDS=["length","setup","shooting","breaks","tech","orig"], FOCUS_COLS=["orig","duration","heroUrl","safetyUrl"];
function statHiddenEff(){ const H=statHidden().slice(); if(P.focus) for(const k of FOCUS_CARDS) if(!H.includes(k)) H.push(k); return H; }
function hintsOn(){ return P.showHints!==false&&!P.focus; }
function hiddenView(){ const H=hidden(); return P.focus?[...new Set([...H,...FOCUS_COLS])]:H; }
function toggleFocus(on){ P.focus=on==null?!P.focus:!!on; savePrefs(); renderAll(); toast(P.focus?"Shoot-day focus on: planning cards, hints, planned timeline and planning columns tucked away":"Focus off: everything's back"); }

// layouts: the built-in ones set cards, panels and focus; your own also keep your columns
const LAYOUT_KEYS=["statHidden","showHints","showPace","paceMerge","showPlan","showTl","showActual","panelFold","focus"];
const LAYOUTS_BUILTIN={
  "1st AD":{statHidden:["takes","footage","hero"],showHints:true,showPace:true,paceMerge:true,showPlan:true,showTl:true,showActual:true,panelFold:{},focus:false},
  "DIT / data":{statHidden:["wrap","length","setup","shooting","breaks","tech","orig"],showHints:false,showPace:false,paceMerge:true,showPlan:false,showTl:false,showActual:true,panelFold:{},focus:true},
  "Director":{statHidden:["length","setup","shooting","breaks","tech","orig","takes","footage"],showHints:false,showPace:true,paceMerge:true,showPlan:false,showTl:true,showActual:false,panelFold:{},focus:true},
  "Everything":{statHidden:[],showHints:true,showPace:true,paceMerge:false,showPlan:true,showTl:true,showActual:true,panelFold:{},focus:false}};
function layoutSnap(withCols){ const o={}; for(const k of LAYOUT_KEYS) o[k]=clone(P[k]===undefined?null:P[k]); if(withCols){o.hiddenBy=clone(P.hiddenBy||{});o.colOrder=clone(P.colOrder||[])} return o; }
function applyLayout(name){
  const L=(P.layouts||{})[name]||LAYOUTS_BUILTIN[name]; if(!L) return;
  for(const k of LAYOUT_KEYS){ if(L[k]===null||L[k]===undefined) delete P[k]; else P[k]=clone(L[k]); }
  if(L.hiddenBy){ P.hiddenBy=clone(L.hiddenBy); P.colOrder=clone(L.colOrder||[]); if(typeof invalidateCols==="function") invalidateCols(); }
  P.layout=name; savePrefs(); renderAll(); toast("Layout: "+name);
}
function layoutChanged(){ const n=P.layout; if(!n) return false; const L=(P.layouts||{})[n]||LAYOUTS_BUILTIN[n]; if(!L) return false; const now=layoutSnap(false);
  const norm=v=>JSON.stringify(v==null?null:v); return LAYOUT_KEYS.some(k=>norm(now[k])!==norm(L[k]===undefined?null:L[k])); }
function layoutChooser(after){
  const box=h("div",{class:"layouts"});
  const draw=()=>{ box.replaceChildren();
    const row=h("div",{class:"laychips"});
    const chip=(name,own)=>{ const on=P.layout===name; const b=h("button",{class:"laychip"+(on?" on":""),type:"button",title:own?"Your layout: cards, panels, focus and columns":"Built-in: cards, panels and focus (your columns stay as they are)",onclick:()=>{applyLayout(name);draw();after&&after()}},name+(on&&layoutChanged()?" *":""));
      if(!own) return b;
      return h("span",{class:"laychip-wrap"},b,h("button",{class:"laydel",type:"button",title:"Delete this layout","aria-label":"Delete layout "+name,onclick:async()=>{if(!await ask("Delete layout?",`"${name}" will be removed from this device.`,"Delete"))return;delete P.layouts[name];if(P.layout===name)P.layout="";savePrefs();draw()}},"×")); };
    for(const n of Object.keys(LAYOUTS_BUILTIN)) row.append(chip(n,false));
    for(const n of Object.keys(P.layouts||{})) row.append(chip(n,true));
    box.append(row);
    const inp=h("input",{type:"text",placeholder:"Save current as… e.g. Josh DIT",maxlength:"30","aria-label":"Name for this layout"});
    const save=()=>{ const n=inp.value.trim(); if(!n) return inp.focus(); if(LAYOUTS_BUILTIN[n]){toast("Pick a different name from the built-in layouts");return}
      P.layouts=Object.assign({},P.layouts,{[n]:layoutSnap(true)}); P.layout=n; savePrefs(); toast(`Saved layout "${n}" (cards, panels, focus and columns)`); draw(); after&&after(); };
    inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();save()}});
    box.append(h("div",{class:"laysave"},inp,h("button",{class:"btn small",type:"button",onclick:save},"Save")));
    if(P.layout&&layoutChanged()) box.append(h("div",{class:"note"},`* changed since you picked "${P.layout}". Click it to go back, or save as a new layout.`));
  };
  draw(); return box;
}
// the ⋯ menu: layouts first, then the cards
function statMenuTop(){
  const top=h("div",{class:"statlay"},h("div",{class:"note",style:"margin:0 .3rem .3rem"},"Layout"),layoutChooser(()=>{}));
  const fc=h("input",{type:"checkbox"}); fc.checked=!!P.focus; fc.addEventListener("change",()=>{P.focus=fc.checked;savePrefs();renderAll()});
  top.append(h("label",{class:"mi",title:"tuck away planning cards, hints, the planned timeline and planning columns"},fc," Shoot-day focus"));
  return top;
}
// pace inside the Running card: streak and won / lost on the card, tap it to open the full pace panel
function paceMerged(){ return P.showPace!==false&&P.paceMerge!==false&&!statHiddenEff().includes("running"); }
function runningPace(card,d,C){
  if(!paceMerged()) return; const p=paceData(d,C); if(!p) return;
  const open=!!P.paceOpen;
  card.classList.add("haspace"); card.setAttribute("role","button"); card.tabIndex=0; card.setAttribute("aria-expanded",String(open));
  card.append(h("div",{class:"sub pacesub"},`${p.streak} on pace · won ${dur(p.won)} · lost ${dur(p.lost)} `,h("span",{class:"pacechev"},open?"▴ pace":"▾ pace")));
  const go=()=>{P.paceOpen=!P.paceOpen;savePrefs();const C2=compute();renderStats(C2);renderPanels(C2)};
  card.onclick=go; card.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go()}};
}
// phone: a thin bar pinned to the top once the cards scroll away
function updateMiniBar(d,C,L){
  const bar=$("#miniBar"); if(!bar) return;
  if(!d){bar.replaceChildren();return}
  if(L){ const s=L.slip, cur=L.cur?(L.cur.seq&&R(L.cur.seq)?seqTitle(seqAnchor(L.cur)):"Shot "+(L.cur.shot||"-")):"";
    const ph={setup:"setting up",rolling:"● rolling",shooting:"shooting"}[L.phase]||"";
    if(L.phase==="break"){ bar.replaceChildren(h("b",{class:"mbdelta "+(s>0?"bad":s<0?"ok":"")},s===0?"On time":(s>0?"+":"-")+dur(Math.abs(s))),h("span",{class:"mbcur"},blockName(L.block)+" · "+(L.blockLeft>=0?dur(L.blockLeft)+" left":dur(-L.blockLeft)+" over")),h("span",{class:"mbwrap"},"wrap "+fmt(L.proj)),h("span",{class:"mbup","aria-hidden":"true"},"↑")); miniBarScroll(); return; }
    bar.replaceChildren(h("b",{class:"mbdelta "+(s>0?"bad":s<0?"ok":"")},s===0?"On time":(s>0?"+":"-")+dur(Math.abs(s))),
      h("span",{class:"mbcur"},cur?cur+(ph?" · "+ph:""):"every shot done"),h("span",{class:"mbwrap"},"wrap "+fmt(L.proj)),h("span",{class:"mbup","aria-hidden":"true"},"↑"));
  } else {
    const shots=d.rows.filter(r=>!isBlock(r)&&!r.cut), left=shots.filter(r=>!r.done).length;
    bar.replaceChildren(h("b",{},d.name||"Day"),h("span",{class:"mbcur"},left+" to go"),h("span",{class:"mbwrap"},"wrap "+fmt(C.wrap)),h("span",{class:"mbup","aria-hidden":"true"},"↑"));
  }
  miniBarScroll();
}
function miniBarScroll(){ const bar=$("#miniBar"), st=$("#stats"); if(!bar||!st) return;
  const show=window.innerWidth<=760&&!!S&&!!D()&&st.getBoundingClientRect().bottom<0&&!document.body.classList.contains("viewopen");
  bar.classList.toggle("show",show); document.body.classList.toggle("hasminibar",show); }
window.addEventListener("scroll",miniBarScroll,{passive:true}); window.addEventListener("resize",miniBarScroll);
(function(){ const bar=$("#miniBar"); if(bar) bar.onclick=()=>window.scrollTo({top:0,behavior:P.calm?"auto":"smooth"}); })();

// ---- breaks and tech rows: Not yet / On now / Done, so lunch running long shows straight away ----
function blockStatus(r){ return r.done?"bdone":r.setupAt?"bon":"btodo"; }
const BLOCK_LABEL={btodo:"Not yet",bon:"On now",bdone:"Done ✓"};
function blockChip(r){ const st=blockStatus(r), L=BLOCK_LABEL[st];
  return h("button",{class:"stchip st-"+st,"data-k":"status","data-status":st,"data-short":{btodo:"○",bon:"◐",bdone:"✓"}[st],title:`${blockName(r)}: ${L}. Click to start or end it, so ahead / behind and the actual timeline use the real times`,"aria-label":"Status "+L,onclick:e=>{e.stopPropagation();blockMenu(e.currentTarget,r.id)}},L); }
function startBlock(id){ const d=D(), b=R(id); if(!d||!b) return;
  for(const x of d.rows) if(x!==b&&isBlock(x)&&x.setupAt&&!x.done){ x.done=true; x.doneAt=dayClock(d); }
  for(const x of d.rows){ const t=!isBlock(x)&&rollingTake(x); if(t) cutTake(x.id); }
  b.setupAt=Date.now(); b.done=false; b.doneAt=null; if(d.onRow&&d.onRow!=="none"){ d.onRow=""; d.onSince=null; }
  afterStatus(); toast(`${blockName(b)} started: back about ${fmt(dayClock(d)+((compute().rows[b.id]||{}).sh||0))}`); }
function endBlock(id){ const d=D(), b=R(id); if(!d||!b) return; b.done=true; b.doneAt=dayClock(d); afterStatus(); toast(`${blockName(b)} over: setting up from now`); }
function blockMenu(anchor,id){
  $$(".locpop").forEach(x=>x.remove()); const r=R(id); if(!r) return; const st=blockStatus(r);
  const pop=h("div",{class:"locpop seqmenu",role:"menu"}); const close=()=>pop.remove();
  const item=(label,fn,sub,on)=>h("button",{class:"mi"+(on?" on":""),role:"menuitem",onclick:()=>{close();fn()}},label,sub?h("small",{}," "+sub):null);
  pop.append(h("div",{class:"note",style:"margin:0 .3rem .3rem"},blockName(r)+" · planned "+dur((compute().rows[id]||{}).sh||0)),
    item("Not yet",()=>{const x=R(id);x.setupAt=null;x.done=false;x.doneAt=null;afterStatus()},"",st==="btodo"),
    item("On now",()=>startBlock(id),"started now",st==="bon"),
    item("Done ✓",()=>endBlock(id),st==="bon"?"ended now":"ended now (start not marked)",st==="bdone"));
  document.body.append(pop);
  const b=anchor.getBoundingClientRect(); const top=b.bottom+6+pop.offsetHeight>innerHeight?Math.max(8,b.top-pop.offsetHeight-6):b.bottom+6;
  pop.style.top=top+"px"; pop.style.left=Math.max(8,Math.min(b.left,innerWidth-pop.offsetWidth-8))+"px";
  setTimeout(()=>document.addEventListener("pointerdown",function off(e){if(!pop.contains(e.target)){pop.remove();document.removeEventListener("pointerdown",off)}}),0);
}
// the Running card: End lunch while it's on, Start lunch when it's next up
function runningBreakBtn(card,d,C,L){
  let b=null, start=false;
  if(L.phase==="break") b=L.block;
  else { const rows=d.rows.filter(r=>!r.cut); let li=-1; rows.forEach((r,i)=>{if(!isBlock(r)&&r.done)li=i});
    const nx=rows.slice(li+1).find(r=>!isBlock(r)?!r.done:true); if(nx&&isBlock(nx)&&!nx.done&&!nx.setupAt&&!(L.cur&&L.phase!=="setup")){ b=nx; start=true; } }
  if(!b) return;
  card.append(h("div",{class:"sub"},h("button",{class:"btn small breakbtn",type:"button",title:start?`Mark ${blockName(b)} as started now`:`Mark ${blockName(b)} as over now`,onclick:e=>{e.stopPropagation();start?startBlock(b.id):endBlock(b.id)}},(start?"Start ":"End ")+blockName(b))));
}

// ---- Call sheet: emergency details, travel, call times, and the standard sections every call sheet carries ----
// a text box on the day (key on the day) or on the project (shared by every day); single-line style when short
function csBox(d,key,ph,project,def){
  const t=h("textarea",{class:"docnote csnote",placeholder:ph,rows:"1","data-key":key}); const src=()=>project?S.project:S.days.find(y=>y.id===d.id);
  t.value=(src()||{})[key]||def||"";
  const fit=()=>{t.style.height="auto";t.style.height=Math.max(34,t.scrollHeight+2)+"px"};
  t.addEventListener("input",()=>{const x=src();if(x)x[key]=t.value;fit();softCommit()}); t.addEventListener("change",commit);
  requestAnimationFrame(fit); return t;
}
const CS_EMERG=[["csHospital","Nearest A&E","Hospital name, address, phone"],["csPolice","Police station","Name, address, phone"],["csFire","Fire station","Name, address, phone"],["csMedic","First aid","First aider / medic on set, where the first aid kit is"],["csAssembly","Fire assembly point","Where to go if the alarm sounds"]];
function emergencySection(d){
  const pr=S.project, no=pr.csEmergNo||"999";
  const sec=h("section",{class:"docsec csemerg"});
  const noIn=h("input",{type:"text",class:"csno noprint",value:no,"aria-label":"Emergency number",title:"Emergency number for this project (999 in the UK, 112 in the EU, 911 in the US)"});
  noIn.addEventListener("change",()=>{S.project.csEmergNo=noIn.value.trim()||"999";commit();const n=sec.querySelector(".csnum");if(n)n.textContent=S.project.csEmergNo});
  sec.append(h("h3",{},"Emergency"),h("div",{class:"csdial"},"In an emergency dial ",h("b",{class:"csnum"},no),noIn));
  const grid=h("div",{class:"csgrid"});
  for(const [k,label,ph] of CS_EMERG) grid.append(h("div",{class:"csrow"},h("label",{class:"doclabel"},label),csBox(d,k,ph,false)));
  sec.append(grid);
  // fill in: the nearest from the map, or copy another day's
  const tools=h("div",{class:"toolbar noprint",style:"margin-top:.4rem"});
  const has=d.lat!==""&&d.lat!=null;
  tools.append(h("button",{class:"btn small",title:"Look up the nearest A&E, police and fire station from this day's location (OpenStreetMap). Check them before you send the call sheet.",onclick:e=>findNearest(d,e.currentTarget)},"Find nearest A&E, police, fire"));
  tools.append(h("span",{class:"note csfindmsg",id:"csFindMsg"},has?"":"Uses the day's location: set it under Weather and daylight, or put a postcode in the address."));
  const empty=CS_EMERG.every(([k])=>!String(d[k]||"").trim());
  const other=S.days.filter(x=>x.id!==d.id&&!x.archived&&CS_EMERG.some(([k])=>String(x[k]||"").trim())).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  if(other.length){ const same=other.find(x=>x.lat!==""&&x.lat!=null&&Math.abs(x.lat-d.lat)<0.002&&Math.abs(x.lon-d.lon)<0.002)||other[0];
    tools.append(h("button",{class:"btn small",title:`Copy the emergency details, travel and parking from ${same.name||"another day"}`,onclick:async()=>{if(!empty&&!await ask("Replace these details?",`Copy the emergency details, travel and parking from ${same.name||"that day"} over this day's?`,"Copy"))return;const x=S.days.find(y=>y.id===d.id);for(const [k] of CS_EMERG)x[k]=same[k]||"";if(same.csTravel)x.csTravel=same.csTravel;commit();rebuildDoc();toast("Copied from "+(same.name||"the other day"))}},`Copy from ${same.name||"another day"}`)); }
  sec.append(tools);
  return sec;
}
// nearest A&E, police station and fire station, from OpenStreetMap (Overpass). The public servers are often busy, so try a few in turn.
const OVERPASS=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter","https://overpass.private.coffee/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
async function overpass(q){
  let last="";
  for(const url of OVERPASS){
    const ctl=new AbortController(), tm=setTimeout(()=>ctl.abort(),25000);
    try{ const r=await fetch(url,{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:ctl.signal});
      if(!r.ok){ last=new URL(url).host+" "+r.status; continue; }
      const j=await r.json(); if(j.remark&&/error|timed out/i.test(j.remark)&&!(j.elements||[]).length){ last=new URL(url).host+": "+j.remark.slice(0,60); continue; }
      return j.elements||[];
    }catch(e){ last=new URL(url).host+(e.name==="AbortError"?" timed out":" unreachable"); }
    finally{ clearTimeout(tm); }
  }
  throw new Error(last||"no server answered");
}
async function findNearest(d,btn){
  const msg=t=>{const m=$("#csFindMsg");if(m)m.textContent=t};
  const x0=S.days.find(y=>y.id===d.id)||d;
  let lat=Number(x0.lat), lon=Number(x0.lon);
  if(x0.lat===""||x0.lat==null||!isFinite(lat)||!isFinite(lon)){
    // no location yet: use a postcode from the address if there is one, and keep it as the day's location
    const pc=String(x0.address||"").toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/);
    if(pc){ msg("Finding "+pc[1]+" "+pc[2]+"…"); try{ const g=(await geocode(pc[1]+pc[2]))[0]; if(g){ x0.lat=Math.round(g.lat*1e4)/1e4; x0.lon=Math.round(g.lon*1e4)/1e4; x0.place=g.name; commit(); lat=x0.lat; lon=x0.lon; } }catch(e){} }
    if(!isFinite(lat)||x0.lat===""||x0.lat==null){ msg("Set the day's location first (Weather and daylight > Set location), then press again."); openLocation(d,btn); return; }
  }
  const old=btn.textContent; btn.disabled=true; btn.textContent="Looking…"; msg("Asking OpenStreetMap (can take up to half a minute)…");
  const q=`[out:json][timeout:25];(nwr["amenity"="hospital"](around:15000,${lat},${lon});nwr["healthcare"="hospital"](around:15000,${lat},${lon});nwr["amenity"="police"](around:6000,${lat},${lon});nwr["amenity"="fire_station"](around:6000,${lat},${lon}););out center tags;`;
  try{
    const found=nearestPlaces(await overpass(q),lat,lon);
    const x=S.days.find(y=>y.id===d.id); let n=0;
    for(const [k,f] of [["csHospital",found.hospital],["csPolice",found.police],["csFire",found.fire]]){
      if(!f) continue; if(String(x[k]||"").trim()&&!await ask("Replace?",`Replace "${String(x[k]).split("\n")[0]}" with ${f.split("\n")[0]}?`,"Replace")) continue; x[k]=f; n++; }
    commit(); rebuildDoc();
    const miss=[["hospital","A&E"],["police","police station"],["fire","fire station"]].filter(([k])=>!found[k]).map(([,l])=>l);
    toast(n?`Filled ${n} from OpenStreetMap: please check them (especially that the hospital has a 24-hour A&E)`:"Nothing new found nearby");
    setTimeout(()=>msg(n?`Filled from OpenStreetMap: check before sending.${miss.length?" None found nearby for: "+miss.join(", ")+".":""}`:"Nothing found nearby: type them in."),50);
  }catch(e){ btn.disabled=false; btn.textContent=old; msg("Couldn't reach OpenStreetMap just now ("+(e.message||e)+"). Try again in a minute, or type them in."); }
}
function nearestPlaces(els,lat,lon){
  const km=(a,b)=>{const R=6371,dl=(a.lat-lat)*Math.PI/180,dn=(a.lon-lon)*Math.PI/180,x=Math.sin(dl/2)**2+Math.cos(lat*Math.PI/180)*Math.cos(a.lat*Math.PI/180)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))};
  const pts=els.map(e=>{const t=e.tags||{}, p={lat:e.lat??(e.center&&e.center.lat),lon:e.lon??(e.center&&e.center.lon),t}; p.km=p.lat!=null?km(p):1e9; return p}).filter(p=>p.km<1e8&&p.t.name);
  const best=f=>pts.filter(f).sort((a,b)=>a.km-b.km)[0];
  const fmtP=(p,note)=>{ if(!p) return ""; const t=p.t;
    const addr=[[t["addr:housenumber"],t["addr:street"]].filter(Boolean).join(" "),t["addr:city"],t["addr:postcode"]].filter(Boolean).join(", ");
    const tel=t.phone||t["contact:phone"]||"";
    return [t.name+(note?" ("+note+")":""),addr,tel,`about ${p.km<1?Math.round(p.km*1000)+" m":p.km.toFixed(1)+" km"} away`].filter(Boolean).join("\n"); };
  const isH=p=>p.t.amenity==="hospital"||p.t.healthcare==="hospital", ae=best(p=>isH(p)&&(p.t.emergency==="yes"||/a\s*&\s*e|accident|emergency/i.test(p.t.name+" "+(p.t.healthcare_speciality||""))));
  return {hospital:ae?fmtP(ae):fmtP(best(isH),"check it has an A&E"),police:fmtP(best(p=>p.t.amenity==="police")),fire:fmtP(best(p=>p.t.amenity==="fire_station"))};
}
// standard sections: shared by every call sheet in the project; untick to leave one off
const CS_STD=[
  {key:"csSafety",title:"Health and safety",def:`Report all accidents, illness and near misses straight away to the producer or production manager, who will record them.
Don't move an injured person unless leaving them puts them at further risk.
Keep fire exits, doorways and walkways clear at all times. Cables matted or ramped; overhead kit properly secured.
Lift with care and use trolleys or lifting gear where available. Don't operate equipment if you're overtired or unwell.
No alcohol or non-prescription drugs during the working day. No smoking on set.
Phones on silent, and off while sound is recording.
Heads of department are responsible for safe working in their department: raise any risk with the producer early.
Everyone on set has a duty of care for their own health and safety and that of others (Health and Safety at Work etc. Act 1974, sections 7 and 8).
A safety briefing will take place before the shoot starts. Please read the risk assessment.`},
  {key:"csConfid",title:"Confidentiality",def:`By attending this shoot you agree to keep all project details, client assets, scripts, cast and production activity confidential. No photos, videos or details on social media or shared outside the production without written permission from production.`},
  {key:"csConduct",title:"Code of conduct",def:`Treat everyone fairly and with respect. Bullying, harassment, discrimination or abuse of any kind won't be tolerated: report anything you see or experience to the producer, in confidence.`},
  {key:"csGreen",title:"Green note",def:`Please bring a labelled reusable water bottle and coffee cup. Water and hot drinks are provided; we avoid single-use plastic where we can.`},
  {key:"csInvoice",title:"Invoicing",def:"",ph:"Who to send invoices to, address, job / PO number to quote, what to include and payment terms"}];
function csHidden(){ return String(S.project.csHide||"").split(",").filter(Boolean); }
function stdSection(s){
  const off=csHidden().includes(s.key);
  const cb=h("input",{type:"checkbox"}); cb.checked=!off;
  cb.addEventListener("change",()=>{const H=csHidden().filter(k=>k!==s.key);if(!cb.checked)H.push(s.key);S.project.csHide=H.join(",");commit();rebuildDoc()});
  const head=h("h3",{},s.title,h("label",{class:"csinc noprint",title:"Include this section on every call sheet in this project"},cb," include"));
  const sec=h("section",{class:"docsec csopt csstd"+(off?" csoff noprint":"")},head);
  if(!off) sec.append(csBox(null,s.key,s.ph||"",true,s.def), h("div",{class:"note noprint csshared"},"Shared by every call sheet in this project."+(s.def?" ":""),s.def&&S.project[s.key]&&S.project[s.key]!==s.def?h("a",{href:"#",onclick:e=>{e.preventDefault();S.project[s.key]="";commit();rebuildDoc()}},"Back to the standard wording"):null));
  return sec;
}

// ---- Call sheet tables: kit and suppliers (per day), risk assessment (shared by the project) ----
const CS_KIT={key:"csKit",title:"Kit, suppliers and deliveries",project:false,add:"+ Add supplier",
  cols:[{k:"who",label:"Supplier / department",ph:"e.g. Emmyland, catering"},{k:"kit",label:"Kit",ph:"What's coming",wide:true},{k:"contact",label:"Contact",ph:"Name, phone"},{k:"when",label:"Delivery / collection",ph:"e.g. In 07:00, out 20:00"}],def:[]};
const CS_RISK={key:"csRisk",title:"Risk assessment",project:true,add:"+ Add risk",
  cols:[{k:"risk",label:"Hazard",ph:"e.g. Slips, trips and falls"},{k:"who",label:"Who may be harmed",ph:"Crew, talent"},{k:"rate",label:"Risk",ph:"Low / Moderate / High",narrow:true},{k:"ctrl",label:"Controls",ph:"What's done to reduce it",wide:true},{k:"after",label:"After",ph:"Low",narrow:true}],
  def:[
    {risk:"Slips, trips and falls",who:"Crew, talent, others in the area",rate:"Moderate",ctrl:"Cables run overhead or along walls, covered or ramped where they cross walkways. Kit stored off walkways. Spills cleaned straight away. Suitable footwear.",after:"Low"},
    {risk:"Electrical equipment",who:"Crew, talent",rate:"Moderate",ctrl:"PAT-tested kit only, set up by competent crew. No liquids near power. Circuits not overloaded; connections checked through the day.",after:"Low"},
    {risk:"Falling stands, rigs and kit",who:"Crew, talent, others in the area",rate:"Moderate",ctrl:"Stands weighted with sandbags, put up by competent crew, not overloaded and checked through the day. Overhead kit secured with safety bonds.",after:"Low"},
    {risk:"Burns from hot lights",who:"Crew",rate:"Moderate",ctrl:"Only designated crew move lights, once cool or with heat-resistant gloves. Blown bulbs: power off, gloves on, glass cleared up.",after:"Low"},
    {risk:"Manual handling",who:"Crew",rate:"High",ctrl:"Correct lifting technique; two people or trolleys for heavy items; nothing over 25 kg carried alone; walking pace on the agreed route.",after:"Low"},
    {risk:"Working at height",who:"Crew",rate:"Low",ctrl:"Avoided where possible. Ladders put up by competent crew, footed by a second person, used for short periods only.",after:"Low"},
    {risk:"Fire",who:"Everyone on site",rate:"High",ctrl:"Fire exits and extinguishers kept clear. No smoking or naked flames. Follow venue staff in an evacuation; meet at the assembly point.",after:"Low"},
    {risk:"Fatigue and welfare",who:"Crew, talent",rate:"Low",ctrl:"Breaks scheduled, food and water available. Anyone feeling unwell tells the producer straight away.",after:"Low"}]};
function csRows(d,T){ const src=T.project?S.project:S.days.find(y=>y.id===d.id); let a=null; try{a=JSON.parse((src||{})[T.key]||"null")}catch(e){} return Array.isArray(a)?a:null; }
function tableSection(d,T){
  const off=csHidden().includes(T.key), src=()=>T.project?S.project:S.days.find(y=>y.id===d.id);
  const cb=h("input",{type:"checkbox"}); cb.checked=!off;
  cb.addEventListener("change",()=>{const H=csHidden().filter(k=>k!==T.key);if(!cb.checked)H.push(T.key);S.project.csHide=H.join(",");commit();rebuildDoc()});
  const sec=h("section",{class:"docsec csopt cstab"+(off?" csoff noprint":"")},h("h3",{},T.title,h("label",{class:"csinc noprint",title:T.project?"Include this section on every call sheet in this project":"Include this section on call sheets"},cb," include")));
  if(off) return sec;
  let rows=csRows(d,T); const usingDef=!rows; if(!rows) rows=T.def.map(r=>Object.assign({},r));
  const save=()=>{const x=src();if(x)x[T.key]=JSON.stringify(rows)};
  const t=h("table",{class:"doctable cstable"},h("thead",{},h("tr",{},...T.cols.map(c=>h("th",{class:c.wide?"wide":c.narrow?"narrow":""},c.label)),h("th",{class:"noprint"},""))));
  const tb=h("tbody",{});
  rows.forEach((r,i)=>{ const tr=h("tr",{});
    for(const c of T.cols){ const ta=h("textarea",{class:"docnote cscell",rows:"1",placeholder:c.ph,"aria-label":c.label}); ta.value=r[c.k]||"";
      const fit=()=>{ta.style.height="auto";ta.style.height=Math.max(30,ta.scrollHeight+2)+"px"};
      ta.addEventListener("input",()=>{r[c.k]=ta.value;save();fit();softCommit()}); ta.addEventListener("change",commit); requestAnimationFrame(fit);
      tr.append(h("td",{},ta)); }
    tr.append(h("td",{class:"noprint"},h("button",{class:"x",title:"Remove this row","aria-label":"Remove row",onclick:()=>{rows.splice(i,1);save();commit();rebuildDoc()}},"×")));
    tb.append(tr); });
  t.append(tb); sec.append(t);
  const tools=h("div",{class:"toolbar noprint",style:"margin-top:.3rem"},h("button",{class:"btn small",onclick:()=>{rows.push({});save();commit();rebuildDoc();setTimeout(()=>{const sc=[...$$("#docBody .cstab")].find(x=>x.querySelector("h3").textContent.startsWith(T.title));const f=sc&&sc.querySelector("tbody tr:last-child textarea");if(f)f.focus()},60)}},T.add));
  if(T.project){
    tools.append(h("span",{class:"note"},usingDef?"Starter risks: edit them to fit your shoot. Shared by every call sheet in this project.":"Shared by every call sheet in this project."));
    if(!usingDef) tools.append(h("a",{href:"#",class:"note",onclick:async e=>{e.preventDefault();if(!await ask("Back to the starter risks?","Your edits to this risk assessment will be replaced by the starter list.","Replace"))return;S.project[T.key]="";commit();rebuildDoc()}},"Back to the starter risks"));
  } else if(!rows.some(r=>T.cols.some(c=>String(r[c.k]||"").trim()))){
    const other=S.days.filter(x=>x.id!==d.id&&!x.archived&&(csRows(x,T)||[]).some(r=>T.cols.some(c=>String(r[c.k]||"").trim()))).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    if(other.length){ const o=other[0]; tools.append(h("button",{class:"btn small",onclick:()=>{const x=src();x[T.key]=o[T.key];commit();rebuildDoc();toast("Copied from "+(o.name||"the other day"))}},"Copy from "+(o.name||"another day"))); }
  }
  sec.append(tools);
  if(T.key==="csRisk") sec.append(h("div",{class:"csopt",style:"margin-top:.4rem"},h("label",{class:"doclabel"},"Full risk assessment"),csBox(null,"csRiskLink","Link to the full risk assessment, or where to find it on set",true)));
  return sec;
}

/* ---------- Edit / animatic: time a cut from boards, takes and video, play it, export an EDL or FCP XML ---------- */
// Cuts are shared with the team (S.cuts: each cut and clip is its own record). Clips: {id,row,src:"board"|"take"|"video",take,url,f (frames),inF,name,note}
const ED={sel:null,t:0,playing:false,zoom:60,raf:0,last:0,cur:"",aud:null,localAudio:"",thumbs:new Map(),tab:"shots",binDay:""};
function edFps(){const f=Number(S.project.fps);return f>0?f:25}
function edNom(){return Math.round(edFps())||25}
// cuts live in S.cuts (each cut and clip its own record). Cuts made before v2.43 were one block in the project: bring them across once
function edMigrate(){
  if(!Array.isArray(S.cuts)) S.cuts=[];
  if(!S.project.cutJson) return;
  let o=null; try{o=JSON.parse(S.project.cutJson)}catch(e){}
  const have=new Set(S.cuts.map(c=>c.id));
  if(o&&Array.isArray(o.cuts)) for(const c of o.cuts) if(!have.has(c.id)) S.cuts.push({id:c.id||uid("c"),name:c.name||"Cut",audio:c.audio||"",target:c.target||null,notes:c.notes||"",clips:(c.clips||[]).map(k=>({id:k.id||uid("k"),row:k.row,src:k.src||"board",take:k.take??null,reset:k.reset??null,url:k.url||"",f:k.f||1,inF:k.inF||0,name:k.name||"",note:k.note||""}))});
  S.project.cutJson=""; commit();
}
function edData(){ edMigrate(); return {get cuts(){return S.cuts}, set cuts(v){S.cuts=v}}; }
function edSave(o,soft){ soft?softCommit():commit(); }
function edCut(o){ o=o||edData(); const id=(P.edCut||{})[pid()]; let c=o.cuts.find(x=>x.id===id)||o.cuts[0];
  if(!c){c={id:uid("c"),name:"Cut 1",clips:[],audio:"",target:null,notes:""};o.cuts.push(c);edSave(o)} return c; }
// change the current cut: fn(cut, all) then save
function edDo(fn,soft){ const o=edData(), c=edCut(o); fn(c,o); edSave(o,soft); }
function edTc(fr){ const n=edNom(); fr=Math.max(0,Math.round(fr)); return [Math.floor(fr/(n*3600)),Math.floor(fr/(n*60))%60,Math.floor(fr/n)%60,fr%n].map(x=>String(x).padStart(2,"0")).join(":"); }
function edTcToF(tc){ const ms=parseTc(tc,edFps()); return ms==null?null:Math.round(ms*edNom()/1000); }
function edSecs(fr){ const s=fr/edFps(); return s<60?s.toFixed(s<10?2:1).replace(/\.?0+$/,"")+"s":Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"); }
function edA(r){ return r&&r.seq&&R(r.seq)?seqAnchor(r):r; }
function edTakes(r){ return r?takeList(edA(r)).filter(t=>t.n!=null):[]; }
function edTake(cl,r){ return cl.src==="take"?edTakes(r).find(t=>t.n==cl.take)||null:null; }
function edPic(r){ return r?(r.ref1||r.ref2||r.ref3||""):""; }
function edVidUrl(cl,r){ return cl.url||(r&&videoLinks(r)[0])||""; }
function edBest(r){ const tk=edTakes(r).filter(t=>t.out||takeMs(t));
  const rz=m=>{ for(const t of tk.slice().reverse()){ const x=(t.resets||[]).filter(y=>y.mark===m).pop(); if(x) return {src:"take",take:t.n,reset:x.n}; } return null; };
  const t=tk.filter(x=>x.mark==="hero").pop(); if(t) return {src:"take",take:t.n};
  const rh=rz("hero"); if(rh) return rh;
  const g=tk.filter(x=>x.mark==="good").pop(); if(g) return {src:"take",take:g.n};
  const rg=rz("good"); if(rg) return rg;
  if(videoLinks(r).length) return {src:"video"}; return {src:"board"}; }
// a reset within a take: where it starts (frames into the take) and how long it runs (to the next reset or the cut)
function edResetSpan(t,rn){ const rs=(t.resets||[]).slice().sort((a,b)=>a.at-b.at), i=rs.findIndex(x=>x.n==rn); if(i<0) return null; const x=rs[i], fps=edFps();
  const a=edTcToF(t.tc), b=edTcToF(x.tc); const inF=a!=null&&b!=null&&b>=a?b-a:Math.max(0,Math.round((x.at-t.at)/1000*fps));
  const endMs=i+1<rs.length?rs[i+1].at:(t.at&&takeMs(t)?t.at+takeMs(t):0); const f=endMs?Math.max(1,Math.round((endMs-x.at)/1000*fps)):0; return {inF,f}; }
// where the clap is, in frames into the take (or null): on the reset if the clip is a reset, else on the take
function edClapF(t,rn){ if(!t) return null; const x=rn?(t.resets||[]).find(y=>y.n==rn):null, tc=x?x.clap:t.clap; if(!tc) return null;
  const a=edTcToF(t.tc), b=edTcToF(tc); if(a!=null&&b!=null&&b>=a) return b-a; const at=x?x.clapAt:t.clapAt; return at&&t.at?Math.max(0,Math.round((at-t.at)/1000*edFps())):null; }
const ED_AFTER_CLAP=0.5;   // seconds after the clap that a clip starts
function edNewClip(r,opt){ const fps=edFps(), b=Object.assign(edBest(r),opt||{}); if(opt&&opt.src&&!("reset" in opt)) delete b.reset; let f=Math.round((durSec(r.duration)||3)*fps), inF=0;
  const t=b.src==="take"?edTakes(r).find(x=>x.n==b.take):null;
  if(t&&b.reset){ const sp=edResetSpan(t,b.reset); if(sp){ inF=sp.inF; if(!durSec(r.duration)&&sp.f) f=sp.f; } }
  else if(t&&!durSec(r.duration)){ const ms=takeMs(t); if(ms) f=Math.round(ms/1000*fps); }
  const cf=t?edClapF(t,b.reset):null;
  if(cf!=null&&cf+Math.round(ED_AFTER_CLAP*fps)>inF){ const nin=cf+Math.round(ED_AFTER_CLAP*fps); if(!durSec(r.duration)) f=Math.max(1,f-(nin-inF)); inF=nin; }
  return Object.assign({id:uid("k"),row:r.id,f:Math.max(1,f),inF},b); }
function edShotLabel(r){ return r?(r.shot||r.action||"-"):"Missing shot"; }
function edClipName(cl,r){ if(cl.name) return cl.name; if(!r) return "Missing";
  const t=edTake(cl,r); if(t){ const rs=cl.reset?"_R"+cl.reset:""; if(t.name) return t.name+rs; const f=findRow(r.id); try{return shotName(edA(r),f?f.d:D(),t.n)+rs}catch(e){return (r.shot||"Shot")+"_T"+t.n+rs} }
  return (r.shot||"Shot")+(cl.src==="video"?"_video":"_board"); }
function edSrcLabel(cl,r){ const t=edTake(cl,r); if(cl.src==="take"&&t&&cl.reset){ const x=(t.resets||[]).find(y=>y.n==cl.reset); return "Take "+t.n+" R"+cl.reset+(x&&x.mark==="hero"?" ★":x&&x.mark==="good"?" ✓":""); }
  return cl.src==="take"?(t?"Take "+t.n+(t.mark==="hero"?" ★":t.mark==="good"?" ✓":""):"Take "+cl.take+" (gone)"):cl.src==="video"?"Video":"Board"; }
function edClips(c){ c=c||edCut(); let s=0; return c.clips.map(cl=>{const o={cl,r:R(cl.row),start:s,end:s+cl.f}; s+=cl.f; return o}); }
function edTotal(c){ return (c||edCut()).clips.reduce((t,x)=>t+x.f,0); }
function edThumb(r,cb){ const ref=edPic(r); if(!ref) return cb(""); if(ED.thumbs.has(ref)) return cb(ED.thumbs.get(ref)); imgSrc(ref).then(u=>{ED.thumbs.set(ref,u||"");cb(u||"")}); }

function openEdit(){ commit(); $("#editView").classList.add("open"); document.body.classList.add("viewopen"); const d=D(); ED.binDay=ED.binDay||(d?d.id:""); edCut(); renderEdit(); const r=d&&d.rows.find(x=>!isBlock(x)); if(r) rememberView("edit",r.id); }
function closeEdit(){ edStop(); rememberView(null); $("#editView").classList.remove("open"); document.body.classList.remove("viewopen"); const st=$("#edStage"); if(st) st.innerHTML=""; ED.cur=""; }
function renderEdit(){
  // a redraw can start while one is under way (a field's change fires as the old panel is removed): run it once that finishes
  if(ED.rendering){ ED.again=true; return; }
  ED.rendering=true; try{ renderEditNow(); } finally { ED.rendering=false; }
  if(ED.again){ ED.again=false; setTimeout(renderEdit,0); }
}
function renderEditNow(){
  const v=$("#editView"); if(!v.classList.contains("open")) return;
  const o=edData(), c=edCut(o), fps=edFps(), total=edTotal(c);
  if(ED.sel&&!c.clips.some(x=>x.id===ED.sel)) ED.sel=null;
  ED.t=Math.min(ED.t,total);
  let stage=$("#edStage"); if(!stage) stage=h("div",{class:"edstage",id:"edStage"});
  // top bar: cut picker, running time, export, close
  const cutSel=h("select",{class:"edcutsel","aria-label":"Cut"},...o.cuts.map(x=>h("option",{value:x.id,selected:x.id===c.id},x.name||"Cut")),h("option",{value:"__new"},"+ New cut"));
  cutSel.onchange=()=>{ if(cutSel.value==="__new"){ const n={id:uid("c"),name:"Cut "+(o.cuts.length+1),clips:[],audio:"",target:null,notes:""}; o.cuts.push(n); edSave(o); P.edCut=Object.assign({},P.edCut,{[pid()]:n.id}); }
    else P.edCut=Object.assign({},P.edCut,{[pid()]:cutSel.value}); savePrefs(); edStop(); ED.t=0; ED.sel=null; ED.cur=""; renderEdit(); };
  const cutMenu=h("button",{class:"btn small",title:"Import, export, rename, duplicate or delete this cut",onclick:e=>edCutMenu(e.currentTarget)},"⋯");
  const top=h("div",{class:"edtop"},h("b",{class:"edtitle"},"Edit"),cutSel,cutMenu,
    h("span",{class:"edrt",title:"Running time of the cut"},edTc(total)+" · "+c.clips.length+" clip"+(c.clips.length===1?"":"s")+" · "+(Number.isInteger(fps)?fps:fps.toFixed(3))+" fps"),
    edTargetBox(c,total),
    h("span",{style:"flex:1"}),
    h("button",{class:"btn small edwide",title:"Swap boards (and older takes) for each shot's hero or good take where there is one",onclick:edUpgrade},"Swap in latest takes"),
    h("button",{class:"btn small edwide",title:"Bring in a cut from the edit (EDL or FCP XML): clip names are matched to shots and takes",onclick:edImport},"Import EDL / XML"),
    h("button",{class:"btn small edwide",title:"CMX3600 EDL for Premiere, Resolve or Avid",onclick:()=>edExport("edl")},"Export EDL"),
    h("button",{class:"btn small edwide",title:"Final Cut Pro 7 XML: opens in Premiere and Resolve",onclick:()=>edExport("xml")},"Export FCP XML"),
    viewSwitch());
  // player
  const tcBox=h("span",{class:"edtc",id:"edTcNow"},edTc(ED.t));
  const btn=(label,title,fn)=>h("button",{class:"btn small",title,"aria-label":title,onclick:fn},label);
  const transport=h("div",{class:"edtransport"},
    btn("⏮","Start (Home)",()=>edSeek(0)),btn("◀","Previous clip (↑)",()=>edJump(-1)),
    h("button",{class:"btn edplay",id:"edPlay",title:"Play / pause (Space)",onclick:edToggle},ED.playing?"❚❚":"▶"),
    btn("▶","Next clip (↓)",()=>edJump(1)),btn("⏭","End (End)",()=>edSeek(edTotal())),tcBox,h("span",{class:"note"},"/ "+edTc(total)),
    h("label",{class:"edchk",title:"Show the shot name over the picture"},(()=>{const x=h("input",{type:"checkbox"});x.checked=P.edCaption!==false;x.onchange=()=>{P.edCaption=x.checked;savePrefs();ED.cur="";edShow()};return x})()," Captions"),
    h("label",{class:"edchk",title:"Play the sound on video clips"},(()=>{const x=h("input",{type:"checkbox"});x.checked=!!P.edClipSound;x.onchange=()=>{P.edClipSound=x.checked;savePrefs();const vv=$("#edStage video");if(vv)vv.muted=!x.checked};return x})()," Clip sound"));
  const player=h("div",{class:"edplayer"},stage,transport,edAudioRow(c));
  // side: shots bin / clip inspector
  const tabs=h("div",{class:"edtabs",role:"tablist"},...[["shots","Shots"],["clip","Clip"]].map(([k,l])=>h("button",{class:"edtab"+(ED.tab===k?" on":""),role:"tab","aria-selected":String(ED.tab===k),onclick:()=>{ED.tab=k;renderEdit()}},l)));
  const side=h("div",{class:"edside"},tabs,ED.tab==="clip"?edInspector(c):edBin(c));
  // timeline
  const tl=edTimeline(c);
  const keepScroll=($(".edscroll")||{}).scrollLeft||0, keepSide=($(".edbin,.edinsp")||{}).scrollTop||0;
  v.replaceChildren(h("div",{class:"edwrap"},top,h("div",{class:"edmain"},player,side),tl));
  const sc=$(".edscroll"); if(sc) sc.scrollLeft=keepScroll; const sd=$(".edbin,.edinsp"); if(sd) sd.scrollTop=keepSide;
  edShow(true);
}
function edCutMenu(anchor){
  $$(".locpop").forEach(x=>x.remove()); const pop=h("div",{class:"locpop seqmenu",role:"menu"}); const close=()=>pop.remove();
  const item=(l,fn)=>h("button",{class:"mi",role:"menuitem",onclick:()=>{close();fn()}},l);
  pop.append(
    item("Swap in latest takes",edUpgrade), item("Import EDL / XML…",edImport), item("Export EDL",()=>edExport("edl")), item("Export FCP XML",()=>edExport("xml")), h("hr"),
    item("Rename…",()=>{ const c=edCut(); const box=h("div",{class:"locpop seqmenu"}); const inp=h("input",{type:"text",value:c.name||"","aria-label":"Cut name"});
      const ok=()=>{edDo(x=>{x.name=inp.value.trim()||x.name});box.remove();renderEdit()};
      inp.onkeydown=e=>{if(e.key==="Enter")ok();if(e.key==="Escape")box.remove()}; box.append(inp,h("button",{class:"btn small",onclick:ok},"Save"));
      document.body.append(box); const b=anchor.getBoundingClientRect(); box.style.top=b.bottom+6+"px"; box.style.left=Math.max(8,b.left-120)+"px"; inp.focus(); inp.select();
      setTimeout(()=>document.addEventListener("pointerdown",function off(e){if(!box.contains(e.target)){box.remove();document.removeEventListener("pointerdown",off)}}),0); }),
    item("Duplicate",()=>{ const o=edData(), c=edCut(o), n=clone(c); n.id=uid("c"); n.name=(c.name||"Cut")+" copy"; n.clips.forEach(k=>k.id=uid("k")); o.cuts.push(n); edSave(o); P.edCut=Object.assign({},P.edCut,{[pid()]:n.id}); savePrefs(); renderEdit(); toast("Duplicated: "+n.name); }),
    item("Delete cut",async()=>{ const o=edData(), c=edCut(o); if(!await ask("Delete this cut?",`"${c.name}" and its ${c.clips.length} clips will be removed for everyone (Undo brings it back).`,"Delete")) return;
      o.cuts=o.cuts.filter(x=>x.id!==c.id); edSave(o); edStop(); ED.t=0; ED.sel=null; ED.cur=""; renderEdit(); }));
  document.body.append(pop); const b=anchor.getBoundingClientRect(); pop.style.top=b.bottom+6+"px"; pop.style.left=Math.max(8,Math.min(b.left,innerWidth-pop.offsetWidth-8))+"px";
  setTimeout(()=>document.addEventListener("pointerdown",function off(e){if(!pop.contains(e.target)){pop.remove();document.removeEventListener("pointerdown",off)}}),0);
}
// music / VO to time against: a shared link (direct audio file) or a file on this device (not uploaded)
function edAudioRow(c){
  const has=!!(ED.localAudio||c.audio);
  const url=h("input",{type:"url",placeholder:"Music or VO: link to an audio file (mp3, wav, m4a)",value:c.audio||"","aria-label":"Audio link"});
  url.onchange=()=>{edDo(x=>{x.audio=url.value.trim()});ED.localAudio="";edAudioLoad(true)};
  const file=h("input",{type:"file",accept:"audio/*",style:"display:none"});
  file.onchange=()=>{const f=file.files[0];if(!f)return;if(ED.localAudio)URL.revokeObjectURL(ED.localAudio);ED.localAudio=URL.createObjectURL(f);ED.localName=f.name;edAudioLoad(true);renderEdit();toast("Playing "+f.name+" from this device (not uploaded or shared)")};
  return h("div",{class:"edaudio"},h("span",{class:"note"},"♪"),url,file,h("button",{class:"btn small",title:"Use an audio file from this device (not uploaded; only on this device)",onclick:()=>file.click()},"From this device…"),
    ED.localAudio?h("span",{class:"note",title:"From this device"},(ED.localName||"local file")+" "):null,
    ED.localAudio?h("button",{class:"x",title:"Stop using the local file",onclick:()=>{URL.revokeObjectURL(ED.localAudio);ED.localAudio="";edAudioLoad(true);renderEdit()}},"×"):null,
    has?null:h("span",{class:"note"},"optional"));
}
function edAudioLoad(reset){ const c=edCut(), src=ED.localAudio||c.audio||"";
  if(!src){ if(ED.aud){ED.aud.pause();ED.aud=null} return null; }
  if(!ED.aud||reset||ED.aud.dataset.src!==src){ if(ED.aud) ED.aud.pause(); ED.aud=new Audio(); ED.aud.preload="auto"; ED.aud.src=src; ED.aud.dataset.src=src; ED.aud.onerror=()=>toast("Couldn't play that audio. It needs to be a direct link to an audio file, or use From this device."); }
  return ED.aud; }

function edBin(c){
  const box=h("div",{class:"edbin"});
  const days=S.days.filter(d=>!d.archived);
  const sel=h("select",{"aria-label":"Day"},...days.map(d=>h("option",{value:d.id,selected:d.id===ED.binDay},d.name||"Day")));
  sel.onchange=()=>{ED.binDay=sel.value;renderEdit()};
  const d=days.find(x=>x.id===ED.binDay)||D()||days[0]; if(!d) return box;
  const shots=d.rows.filter(r=>!isBlock(r)&&!r.cut);
  const inCut=new Set(c.clips.map(k=>k.row));
  const onlyMissing=h("label",{class:"edchk",title:"Show only shots that aren't in this cut yet"},(()=>{const x=h("input",{type:"checkbox"});x.checked=!!ED.binMissing;x.onchange=()=>{ED.binMissing=x.checked;renderEdit()};return x})()," Not in this cut");
  box.append(h("div",{class:"edbinhead"},sel,onlyMissing,h("button",{class:"btn small",title:"Add every shot of this day, in order, each with its best picture (hero take, video or board)",onclick:()=>{edAdd(shots.filter(r=>!inCut.has(r.id)).map(r=>edNewClip(r)));}},"+ Add all ("+shots.filter(r=>!inCut.has(r.id)).length+")")),
    h("p",{class:"note"},"Click a picture to add it after the selected clip, or drag it onto the timeline. The best source is picked for you: hero take, then good take, then video, then board."));
  const list=h("div",{class:"edbinlist"});
  for(const r of shots){
    if(ED.binMissing&&inCut.has(r.id)) continue;
    const tk=edTakes(r).filter(t=>t.out||takeMs(t)), vids=videoLinks(r), pic=edPic(r), best=edBest(r);
    const th=h("div",{class:"edthumb"}); edThumb(r,u=>{if(u)th.style.backgroundImage=`url("${u}")`;else th.textContent=r.shot||"-"});
    const add=o=>()=>edAdd([edNewClip(r,o)]);
    const opts=h("div",{class:"edbinopts"},
      pic?h("button",{class:"chip",title:"Add the storyboard frame",onclick:add({src:"board"})},"Board"):null,
      ...tk.slice(-6).flatMap(t=>[h("button",{class:"chip"+(t.mark==="hero"?" hero":t.mark==="good"?" good":""),title:`Take ${t.n}${t.mark?" ("+t.mark+")":""} · in ${t.tc||"-"}${t.out?" · out "+t.out:""}`,onclick:add({src:"take",take:t.n})},"T"+t.n+(t.mark==="hero"?"★":t.mark==="good"?"✓":"")),
        ...(t.resets||[]).filter(x=>x.mark==="hero"||x.mark==="good").map(x=>h("button",{class:"chip"+(x.mark==="hero"?" hero":" good"),title:`Take ${t.n}, reset R${x.n} (${x.mark}) at ${x.tc}`,onclick:add({src:"take",take:t.n,reset:x.n})},"T"+t.n+"·R"+x.n+(x.mark==="hero"?"★":"✓")))]),
      vids.length?h("button",{class:"chip",title:"Add the video link (rushes or previz)",onclick:add({src:"video"})},"Video"):null);
    const it=h("div",{class:"edbinitem"+(inCut.has(r.id)?" used":""),draggable:"true",title:(r.description||r.action||"")+(inCut.has(r.id)?" (already in the cut)":"")},
      h("button",{class:"edthumbbtn",title:"Add with the best source ("+(best.src==="take"?"take "+best.take:best.src)+")",onclick:add()},th),
      h("div",{class:"edbininfo"},h("b",{},r.shot||"-"),h("span",{class:"note"},String(r.description||r.action||"").slice(0,70)),opts));
    it.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/x-edshot",r.id);e.dataTransfer.effectAllowed="copy"});
    list.append(it);
  }
  if(!shots.length) list.append(h("p",{class:"note"},"No shots on this day."));
  box.append(list); return box;
}
function edAdd(clips,at){ if(!clips.length) return; let firstId=clips[0].id;
  edDo(c=>{ let i=at!=null?at:(ED.sel?c.clips.findIndex(x=>x.id===ED.sel)+1:c.clips.length); if(i<0) i=c.clips.length; c.clips.splice(i,0,...clips); });
  ED.sel=clips[clips.length-1].id; renderEdit(); toast(clips.length===1?"Added "+edClipName(clips[0],R(clips[0].row)):"Added "+clips.length+" clips"); }
function edUpgrade(){ let n=0;
  edDo(c=>{ for(const k of c.clips){ const r=R(k.row); if(!r) continue; const b=edBest(r);
    if(b.src==="take"&&(k.src!=="take"||k.take!=b.take||(k.reset||0)!=(b.reset||0))){ const was=k.src; k.src="take"; k.take=b.take;
      if(b.reset){ k.reset=b.reset; const t=edTakes(r).find(z=>z.n==b.take), sp=t&&edResetSpan(t,b.reset); k.inF=sp?sp.inF:0; } else { delete k.reset; if(was!=="take") k.inF=0; } n++; }
    else if(b.src==="video"&&k.src==="board"){ k.src="video"; n++; } } });
  ED.cur=""; renderEdit(); toast(n?`Swapped in ${n} newer source${n===1?"":"s"} (durations kept)`:"Everything's already on its latest take"); }

function edInspector(c){
  const box=h("div",{class:"edinsp"}); const k=c.clips.find(x=>x.id===ED.sel);
  if(!k){ box.append(h("p",{class:"note"},"Click a clip on the timeline to set its source, length and in point.")); return box; }
  const r=R(k.row), fps=edFps(), tk=edTakes(r), vids=r?videoLinks(r):[], t=edTake(k,r);
  const upd=(fn,soft)=>{edDo(cc=>{const x=cc.clips.find(y=>y.id===k.id);if(x)fn(x)},soft);};
  box.append(h("div",{class:"edinsphead"},h("b",{},"Shot "+edShotLabel(r)),h("span",{class:"note"},r?String(r.description||r.action||""):(k.name?"Not matched: "+k.name:"This shot was deleted"))));
  { const shotSel=h("select",{"aria-label":"Shot for this clip"},h("option",{value:""},"(no shot)"),...live().flatMap(d=>d.rows.filter(x=>!isBlock(x)).map(x=>h("option",{value:x.id,selected:x.id===k.row},`${d.name} · ${x.shot||"-"} ${String(x.description||x.action||"").slice(0,40)}`))));
    shotSel.onchange=()=>{edDo(cc=>{const x=cc.clips.find(y=>y.id===k.id);if(x){x.row=shotSel.value;if(x.note&&/^Not matched/.test(x.note))x.note=""}});ED.cur="";renderEdit()};
    box.append(h("label",{class:"edfield"},h("span",{},"Shot"),shotSel)); }
  // source
  const src=h("select",{"aria-label":"Source"},
    h("option",{value:"board",selected:k.src==="board"},"Board"+(edPic(r)?"":" (no picture)")),
    ...tk.flatMap(x=>[h("option",{value:"take:"+x.n,selected:k.src==="take"&&k.take==x.n&&!k.reset},`Take ${x.n}${x.mark?" · "+x.mark:""}${x.tc?" · "+x.tc:""}${x.len?" · "+x.len:""}`),
      ...(x.resets||[]).map(y=>h("option",{value:"take:"+x.n+":"+y.n,selected:k.src==="take"&&k.take==x.n&&k.reset==y.n},`   Take ${x.n} · R${y.n}${y.mark?" · "+y.mark:""} · ${y.tc}`))]),
    h("option",{value:"video",selected:k.src==="video"},"Video link"+(vids.length?"":" (none yet)")));
  src.onchange=()=>{const v=src.value;upd(x=>{delete x.reset;x.inF=0;if(v.startsWith("take:")){const [,tn,rn]=v.split(":");x.src="take";x.take=Number(tn);if(rn){x.reset=Number(rn);const tt=edTakes(r).find(z=>z.n==x.take),sp=tt&&edResetSpan(tt,x.reset);if(sp){x.inF=sp.inF;if(sp.f)x.f=sp.f}}}else{x.src=v;delete x.take}});ED.cur="";renderEdit()};
  // length
  const durIn=h("input",{type:"number",step:String(1/fps),min:String(1/fps),value:(k.f/fps).toFixed(3).replace(/\.?0+$/,""),"aria-label":"Length in seconds"});
  durIn.onchange=()=>{const s=Number(durIn.value);if(s>0){upd(x=>{x.f=Math.max(1,Math.round(s*fps))});renderEdit()}};
  const nudge=d=>()=>{upd(x=>{x.f=Math.max(1,x.f+d)});renderEdit()};
  // in point (into the take or video)
  const inIn=h("input",{type:"number",step:String(1/fps),min:"0",value:(k.inF/fps).toFixed(3).replace(/\.?0+$/,""),"aria-label":"In point, seconds into the source"});
  inIn.onchange=()=>{const s=Number(inIn.value);if(s>=0){upd(x=>{x.inF=Math.round(s*fps)});ED.cur="";renderEdit()}};
  const tIn=t&&edTcToF(t.tc);
  const srcTc=t&&tIn!=null?edTc(tIn+k.inF)+" to "+edTc(tIn+k.inF+k.f):"";
  const tLen=t&&takeMs(t)?Math.round(takeMs(t)/1000*fps):0;
  const urlIn=h("input",{type:"url",value:k.url||"",placeholder:vids[0]?"Using the shot's video: "+vids[0].slice(0,40)+"…":"Paste a link to the rushes or previz for this clip","aria-label":"Video link for this clip"});
  urlIn.onchange=()=>{upd(x=>{x.url=urlIn.value.trim()});ED.cur="";renderEdit()};
  const nameIn=h("input",{type:"text",value:k.name||"",placeholder:edClipName(Object.assign({},k,{name:""}),r),"aria-label":"Clip name for the EDL"});
  nameIn.onchange=()=>{upd(x=>{x.name=nameIn.value.trim()});renderEdit()};
  const noteIn=h("textarea",{rows:"2",placeholder:"Note (goes into the EDL and XML as a comment)","aria-label":"Clip note"}); noteIn.value=k.note||"";
  noteIn.onchange=()=>upd(x=>{x.note=noteIn.value});
  const i=c.clips.findIndex(x=>x.id===k.id);
  box.append(...[
    h("label",{class:"edfield"},h("span",{},"Source"),src),
    h("div",{class:"edfield"},h("span",{},"Length"),h("div",{class:"edrow"},durIn,h("span",{class:"note"},"s · "+k.f+" frames"),h("button",{class:"btn small",title:"One frame shorter",onclick:nudge(-1)},"−1f"),h("button",{class:"btn small",title:"One frame longer",onclick:nudge(1)},"+1f"),
      tLen?h("button",{class:"btn small",title:"Use the whole take ("+edSecs(tLen)+")",onclick:()=>{upd(x=>{x.f=Math.max(1,tLen-x.inF)});renderEdit()}},"Whole take"):null)),
    k.src!=="board"?h("div",{class:"edfield"},h("span",{},"In point"),h("div",{class:"edrow"},inIn,h("span",{class:"note"},"s in"+(srcTc?" · source "+srcTc:"")),h("button",{class:"btn small",title:"Set the in point to where the playhead is in this clip",onclick:()=>{const at=edClips(c).find(x=>x.cl.id===k.id);if(!at)return;const off=Math.max(0,Math.min(k.f-1,Math.round(ED.t)-at.start));upd(x=>{x.inF=x.inF+off;x.f=Math.max(1,x.f-off)});ED.t=at.start;ED.cur="";renderEdit()}},"In at playhead"))):null,
    k.src!=="board"?h("label",{class:"edfield"},h("span",{},"Video"),urlIn):null,
    h("label",{class:"edfield"},h("span",{},"Clip name"),nameIn),
    h("label",{class:"edfield"},h("span",{},"Note"),noteIn),
    h("div",{class:"edrow",style:"margin-top:.5rem;flex-wrap:wrap"},
      h("button",{class:"btn small",disabled:i<=0,onclick:()=>{edDo(cc=>{const j=cc.clips.findIndex(x=>x.id===k.id);if(j>0)cc.clips.splice(j-1,0,cc.clips.splice(j,1)[0])});renderEdit()}},"◀ Move"),
      h("button",{class:"btn small",disabled:i>=c.clips.length-1,onclick:()=>{edDo(cc=>{const j=cc.clips.findIndex(x=>x.id===k.id);if(j<cc.clips.length-1)cc.clips.splice(j+1,0,cc.clips.splice(j,1)[0])});renderEdit()}},"Move ▶"),
      h("button",{class:"btn small",onclick:()=>{const n=Object.assign(clone(k),{id:uid("k")});edDo(cc=>{const j=cc.clips.findIndex(x=>x.id===k.id);cc.clips.splice(j+1,0,n)});ED.sel=n.id;renderEdit()}},"Duplicate"),
      h("button",{class:"btn small",title:"Split this clip at the playhead",onclick:edSplit},"Split at playhead"),
      h("button",{class:"btn small danger",onclick:()=>edRemove(k.id)},"Remove")),
    r?h("button",{class:"btn small",style:"margin-top:.4rem",onclick:()=>{closeEdit();jump(r.id)}},"Go to the shot in the list"):null].filter(Boolean));
  return box;
}
function edRemove(id){ edDo(c=>{c.clips=c.clips.filter(x=>x.id!==id)}); ED.sel=null; ED.cur=""; renderEdit(); toast("Clip removed",{label:"Undo",fn:()=>{undo();renderEdit()}}); }
function edSplit(){ const c=edCut(), at=edClips(c).find(x=>ED.t>x.start&&ED.t<x.end); if(!at){toast("Put the playhead inside a clip to split it");return}
  const off=Math.round(ED.t)-at.start; if(off<1||off>=at.cl.f) return;
  const b=Object.assign(clone(at.cl),{id:uid("k"),f:at.cl.f-off,inF:(at.cl.inF||0)+(at.cl.src==="board"?0:off)});
  edDo(cc=>{const j=cc.clips.findIndex(x=>x.id===at.cl.id);cc.clips[j].f=off;cc.clips.splice(j+1,0,b)}); ED.sel=b.id; ED.cur=""; renderEdit(); }

function edTimeline(c){
  const fps=edFps(), pps=ED.zoom, total=edTotal(c), W=Math.max(total/fps*pps+200,600);
  const wrap=h("div",{class:"edtl"});
  const zoom=h("input",{type:"range",min:"8",max:"240",value:String(ED.zoom),"aria-label":"Timeline zoom"}); zoom.oninput=()=>{ED.zoom=Number(zoom.value);const sc=$(".edscroll");const keep=sc?sc.scrollLeft/(sc.scrollWidth||1):0;renderEdit();const s2=$(".edscroll");if(s2)s2.scrollLeft=keep*s2.scrollWidth};
  wrap.append(h("div",{class:"edtlbar"},h("span",{class:"note"},"Drag clips to reorder, drag a clip's right edge to trim. Drop shots from the list."),h("span",{style:"flex:1"}),h("span",{class:"note"},"Zoom"),zoom));
  const sc=h("div",{class:"edscroll"}), inner=h("div",{class:"edinner",style:`width:${W}px`});
  // ruler
  const ruler=h("div",{class:"edruler"}); const step=pps<14?10:pps<30?5:pps<70?2:1;
  for(let s=0;s<=total/fps+3;s+=step) ruler.append(h("span",{class:"edtick",style:`left:${s*pps}px`},s%60===0&&s?Math.floor(s/60)+"m":s>=60?Math.floor(s/60)+":"+String(s%60).padStart(2,"0"):s+"s"));
  const scrub=e=>{const rc=inner.getBoundingClientRect();edSeek(Math.max(0,Math.min(total,Math.round((e.clientX-rc.left)/pps*fps))))};
  ruler.addEventListener("pointerdown",e=>{scrub(e);const mv=ev=>scrub(ev),up=()=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up)};addEventListener("pointermove",mv);addEventListener("pointerup",up)});
  const track=h("div",{class:"edtrack"});
  for(const x of edClips(c)){
    const k=x.cl, r=x.r, w=Math.max(4,k.f/fps*pps);
    const blk=h("div",{class:"edclip src-"+k.src+(k.id===ED.sel?" sel":"")+(r?"":" missing"),style:`left:${x.start/fps*pps}px;width:${w}px`,draggable:"true","data-id":k.id,title:`${edClipName(k,r)} · ${edSrcLabel(k,r)} · ${edSecs(k.f)}`},
      h("div",{class:"edcliplabel"},h("b",{},edShotLabel(r)),w>70?h("span",{}," "+edSrcLabel(k,r)):null),
      w>40?h("div",{class:"edclipdur"},edSecs(k.f)):null,
      r&&k.src==="board"&&edBest(r).src==="take"?h("span",{class:"ednewer",title:"A hero or good take is in: Swap in latest takes, or choose it under Clip"},"★"):null,
      h("div",{class:"edtrim",title:"Drag to trim"}));
    if(r) edThumb(r,u=>{if(u&&(k.src==="board"||!videoLinks(r).length))blk.style.backgroundImage=`linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.55)),url("${u}")`});
    blk.addEventListener("click",e=>{if(e.target.classList.contains("edtrim"))return;ED.sel=k.id;ED.tab="clip";if(!ED.playing)ED.t=x.start;ED.cur="";renderEdit()});
    blk.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/x-edclip",k.id);e.dataTransfer.effectAllowed="move"});
    // trim the right edge
    const trim=blk.querySelector(".edtrim");
    trim.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();blk.draggable=false;const x0=e.clientX,f0=k.f;let nf=f0;
      const lab=blk.querySelector(".edclipdur");
      const mv=ev=>{nf=Math.max(1,Math.round(f0+(ev.clientX-x0)/pps*fps));blk.style.width=Math.max(4,nf/fps*pps)+"px";if(lab)lab.textContent=edSecs(nf);$("#edTcNow").textContent="len "+edSecs(nf)};
      const up=()=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up);blk.draggable=true;if(nf!==f0){edDo(cc=>{const y=cc.clips.find(z=>z.id===k.id);if(y)y.f=nf})}ED.sel=k.id;renderEdit()};
      addEventListener("pointermove",mv);addEventListener("pointerup",up)});
    track.append(blk);
  }
  // drop: reorder clips, or add shots from the list, at the mouse position
  const dropIndex=e=>{const rc=inner.getBoundingClientRect(), fr=(e.clientX-rc.left)/pps*fps; const L=edClips(c); for(let i=0;i<L.length;i++) if(fr<(L[i].start+L[i].end)/2) return i; return L.length;};
  const marker=h("div",{class:"eddrop",hidden:true}); track.append(marker);
  track.addEventListener("dragover",e=>{e.preventDefault();const i=dropIndex(e),L=edClips(c);marker.hidden=false;marker.style.left=((i<L.length?L[i].start:edTotal(c))/fps*pps)+"px"});
  track.addEventListener("dragleave",()=>{marker.hidden=true});
  track.addEventListener("drop",e=>{e.preventDefault();marker.hidden=true;const i=dropIndex(e);
    const cid=e.dataTransfer.getData("text/x-edclip"), sid=e.dataTransfer.getData("text/x-edshot");
    if(cid){edDo(cc=>{const j=cc.clips.findIndex(x=>x.id===cid);if(j<0)return;const [m]=cc.clips.splice(j,1);cc.clips.splice(i>j?i-1:i,0,m)});ED.sel=cid;ED.cur="";renderEdit()}
    else if(sid){const r=R(sid);if(r)edAdd([edNewClip(r)],i)}});
  if(!c.clips.length) track.append(h("div",{class:"edempty"},"Add shots from the list on the right, or drag them here."));
  inner.append(ruler,track,h("div",{class:"edhead",id:"edHead",style:`left:${ED.t/fps*pps}px`}));
  sc.append(inner); wrap.append(sc); return wrap;
}
// ---- playback ----
function edMount(x){
  const st=$("#edStage"); if(!st) return null; ED.cur=x?x.cl.id+"|"+x.cl.src+"|"+(x.cl.take||"")+"|"+(x.cl.url||"")+"|"+x.cl.inF:"";
  st.innerHTML=""; if(!x){ st.append(h("div",{class:"edblank"},edCut().clips.length?"End of the cut":"Empty cut: add shots from the list")); return null; }
  const k=x.cl, r=x.r, t=edTake(k,r), url=k.src==="board"?"":edVidUrl(k,r); let em=url?videoEmbed(url):null;
  // Drive + the project's API key: play the file itself, so it can be timed; if Drive says no (not shared publicly), fall back to its player
  const driveFallback=em&&em.kind==="drive"?em:null;
  if(em&&em.kind==="drive"&&em.id&&S.project.driveKey) em={kind:"file",src:`https://www.googleapis.com/drive/v3/files/${em.id}?alt=media&key=${encodeURIComponent(S.project.driveKey)}`,name:"Drive video",drive:true};
  let el=null;
  if(em&&em.kind==="file"){ el=h("video",{src:em.src,playsinline:"",preload:"auto"}); el.muted=!P.edClipSound;
    el.addEventListener("error",()=>{ if(em.drive&&driveFallback){ const fr=h("iframe",{src:driveFallback.src,allow:"autoplay; fullscreen",title:"Drive video"}); el.replaceWith(fr); st.append(h("div",{class:"edwarn"},"Drive wouldn't hand this file to the player (is it shared as 'Anyone with the link'?). Showing Drive's own player.")); return; }
      const n=h("div",{class:"edblank"},"This video won't play here: "+em.name);el.replaceWith(n)}); }
  else if(em&&["drive","youtube","vimeo","embed"].includes(em.kind)){
    let src=em.src; const s=Math.floor((k.inF||0)/edFps());
    if(em.kind==="youtube") src+=`&start=${s}&autoplay=${ED.playing?1:0}&mute=${P.edClipSound?0:1}`; if(em.kind==="vimeo") src+=(src.includes("?")?"&":"?")+`autoplay=${ED.playing?1:0}&muted=${P.edClipSound?0:1}#t=${s}s`;
    el=h("iframe",{src,allow:"autoplay; fullscreen",title:edClipName(k,r)});
    if(em.kind==="drive") st.append(h("div",{class:"edwarn"},"Drive preview: press play inside it. It can't be timed from here."));
  } else {
    const img=h("img",{alt:edClipName(k,r)}); el=img;
    if(r) edThumb(r,u=>{if(u)img.src=u;else img.replaceWith(h("div",{class:"edblank"},h("b",{},"Shot "+edShotLabel(r)),h("div",{},String(r.description||r.action||"No picture yet").slice(0,200))))});
    else img.replaceWith(h("div",{class:"edblank"},"Missing shot"));
  }
  st.append(el);
  if(P.edCaption!==false) st.append(h("div",{class:"edcap"},h("b",{},edShotLabel(r)),"  "+edSrcLabel(k,r)+(t&&t.tc?" · "+t.tc:"")+(k.src!=="board"&&!url?" · no video yet":"")));
  return el;
}
function edShow(force){
  const c=edCut(), total=edTotal(c), fps=edFps();
  const x=edClips(c).find(y=>ED.t>=y.start&&ED.t<y.end)||null;
  const key=x?x.cl.id+"|"+x.cl.src+"|"+(x.cl.take||"")+"|"+(x.cl.url||"")+"|"+x.cl.inF:"";
  let el=$("#edStage video");
  if(force||key!==ED.cur||!$("#edStage").firstChild){ edMount(x); el=$("#edStage video"); }
  if(el&&x){ const want=((x.cl.inF||0)+(ED.t-x.start))/fps;
    if(ED.playing){ if(Math.abs(el.currentTime-want)>0.3) try{el.currentTime=want}catch(e){} if(el.paused) el.play().catch(()=>{}); }
    else { el.pause(); if(Math.abs(el.currentTime-want)>0.02) try{el.currentTime=want}catch(e){} } }
  const hd=$("#edHead"); if(hd) hd.style.left=(ED.t/fps*ED.zoom)+"px";
  const tc=$("#edTcNow"); if(tc) tc.textContent=edTc(ED.t);
  const a=edAudioLoad(false); if(a){ const want=ED.t/fps; if(ED.playing){ if(Math.abs(a.currentTime-want)>0.25) try{a.currentTime=want}catch(e){} if(a.paused) a.play().catch(()=>{}); } else { a.pause(); try{a.currentTime=want}catch(e){} } }
  // keep the playhead in view
  if(ED.playing){ const sc=$(".edscroll"); if(sc){ const px=ED.t/fps*ED.zoom; if(px<sc.scrollLeft||px>sc.scrollLeft+sc.clientWidth-40) sc.scrollLeft=Math.max(0,px-60); } }
  if(total&&ED.t>=total&&ED.playing) edStop();
}
function edLoop(now){ if(!ED.playing) return; ED.t+=(now-ED.last)/1000*edFps(); ED.last=now; const tot=edTotal(); if(ED.t>=tot){ED.t=tot;edShow();edStop();return} edShow(); ED.raf=requestAnimationFrame(edLoop); }
function edPlay(){ const tot=edTotal(); if(!tot) return; if(ED.t>=tot) ED.t=0; ED.playing=true; ED.last=performance.now(); ED.cur=""; edShow(true); const b=$("#edPlay"); if(b) b.textContent="❚❚"; cancelAnimationFrame(ED.raf); ED.raf=requestAnimationFrame(edLoop); }
function edStop(){ ED.playing=false; cancelAnimationFrame(ED.raf); const b=$("#edPlay"); if(b) b.textContent="▶"; const v=$("#edStage video"); if(v) v.pause(); if(ED.aud) ED.aud.pause(); }
function edToggle(){ ED.playing?edStop():edPlay(); }
function edSeek(fr){ ED.t=Math.max(0,Math.min(edTotal(),fr)); edShow(); }
function edJump(dir){ const L=edClips(); if(!L.length) return; let i=L.findIndex(x=>ED.t>=x.start&&ED.t<x.end); if(i<0) i=L.length;
  const j=Math.max(0,Math.min(L.length-1,dir<0&&ED.t>L[Math.min(i,L.length-1)].start+2&&i<L.length?i:i+dir)); ED.t=L[j].start; if(!ED.playing){ED.sel=L[j].cl.id;renderEdit()} else edShow(); }
function edKey(e,k){
  if(e.key==="Escape"){ if($(".locpop")) $$(".locpop").forEach(x=>x.remove()); else closeEdit(); return true; }
  if(e.key===" "||k==="k"){ e.preventDefault(); edToggle(); return true; }
  const fps=edFps();
  if(e.key==="ArrowLeft"){ e.preventDefault(); edStop(); edSeek(Math.round(ED.t)-(e.shiftKey?Math.round(fps):1)); return true; }
  if(e.key==="ArrowRight"){ e.preventDefault(); edStop(); edSeek(Math.round(ED.t)+(e.shiftKey?Math.round(fps):1)); return true; }
  if(e.key==="ArrowUp"){ e.preventDefault(); edJump(-1); return true; }
  if(e.key==="ArrowDown"){ e.preventDefault(); edJump(1); return true; }
  if(e.key==="Home"){ edSeek(0); return true; } if(e.key==="End"){ edSeek(edTotal()); return true; }
  if((e.key==="Delete"||e.key==="Backspace")&&ED.sel){ e.preventDefault(); edRemove(ED.sel); return true; }
  if(k==="s"&&!ED.playing){ edSplit(); return true; }
  return true;
}
// ---- export ----
function edExport(kind){
  const c=edCut(), L=edClips(c); if(!L.length){toast("The cut is empty");return}
  const fps=edFps(), nom=edNom(), recStart=3600*nom, title=String(c.name||"Cut").replace(/[^\w .-]/g,"").slice(0,60)||"Cut";
  const proj=String(S.project.name||"Shotlist").replace(/[^\w .-]/g,"").trim()||"Shotlist";
  const srcIn=x=>{const t=edTake(x.cl,x.r), base=t?edTcToF(t.tc):null; return (base!=null?base:0)+(x.cl.src==="board"?0:(x.cl.inF||0));};
  const reelOf=x=>{const t=edTake(x.cl,x.r); if(!t&&x.cl.src==="board") return "AX"; return edClipName(x.cl,x.r).toUpperCase().replace(/[^A-Z0-9_]/g,"").slice(0,8)||"AX";};
  let out="", fn="";
  if(kind==="edl"){
    const lines=[`TITLE: ${title}`,"FCM: NON-DROP FRAME",""];
    L.forEach((x,i)=>{ const si=srcIn(x);
      lines.push(`${String(i+1).padStart(3,"0")}  ${reelOf(x).padEnd(8)} V     C        ${edTc(si)} ${edTc(si+x.cl.f)} ${edTc(recStart+x.start)} ${edTc(recStart+x.end)}`);
      lines.push(`* FROM CLIP NAME: ${edClipName(x.cl,x.r)}`);
      lines.push(`* COMMENT: SHOT ${x.r?x.r.shot||"-":"MISSING"} - ${edSrcLabel(x.cl,x.r).replace(/[★✓]/g,"").trim().toUpperCase()}${x.cl.note?" - "+x.cl.note.replace(/\s+/g," "):""}`);
      { const t=edTake(x.cl,x.r), cf=edClapF(t,x.cl.reset); if(cf!=null){ const tc=x.cl.reset?((t.resets||[]).find(y=>y.n==x.cl.reset)||{}).clap:t.clap; lines.push(`* SYNC: CLAP AT ${tc} (${cf<(x.cl.inF||0)?"before the in point":"in the clip"})`); } }
      lines.push(""); });
    out=lines.join("\r\n"); fn=`${proj} - ${title}.edl`;
  } else {
    const ntsc=Math.abs(fps-nom)>0.01, esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const rate=`<rate><timebase>${nom}</timebase><ntsc>${ntsc?"TRUE":"FALSE"}</ntsc></rate>`, total=edTotal(c);
    const tcXml=f=>`<timecode>${rate}<string>${edTc(f)}</string><frame>${f}</frame><displayformat>NDF</displayformat></timecode>`;
    const files=new Map(); let items="", markers="";
    L.forEach((x,i)=>{ const k=x.cl, r=x.r, t=edTake(k,r), name=edClipName(k,r), url=k.src==="board"?"":edVidUrl(k,r), em=url?videoEmbed(url):null;
      const fkey=(t?"take:"+(r?r.id:"")+":"+t.n:k.src+":"+(r?r.id:"")+":"+(url||""));
      let fid=files.get(fkey), fileXml;
      const base=t?(edTcToF(t.tc)||0):0, inF=k.src==="board"?0:(k.inF||0), mediaDur=Math.max(inF+k.f,t&&takeMs(t)?Math.round(takeMs(t)/1000*fps):0,k.f);
      if(fid) fileXml=`<file id="${fid}"/>`;
      else { fid="file-"+(files.size+1); files.set(fkey,fid);
        const fname=k.src==="board"?name+".png":em&&em.kind==="file"?em.name:name;
        fileXml=`<file id="${fid}"><name>${esc(fname)}</name>${em&&em.kind==="file"&&/^https?:/.test(em.src)?`<pathurl>${esc(em.src)}</pathurl>`:""}${rate}<duration>${mediaDur}</duration>${tcXml(base)}<media><video><samplecharacteristics>${rate}<width>1920</width><height>1080</height></samplecharacteristics></video></media></file>`; }
      const cf=edClapF(t,k.reset), clapMk=cf!=null?`<marker><name>Clap</name><comment>Sync point</comment><in>${cf}</in><out>-1</out></marker>`:"";
      items+=`<clipitem id="clipitem-${i+1}"><name>${esc(name)}</name><enabled>TRUE</enabled><duration>${mediaDur}</duration>${rate}<start>${x.start}</start><end>${x.end}</end><in>${inF}</in><out>${inF+k.f}</out>${fileXml}${clapMk}<comments><mastercomment1>${esc("Shot "+(r?r.shot||"-":"missing")+" - "+edSrcLabel(k,r).replace(/[★✓]/g,"").trim())}</mastercomment1>${k.note?`<mastercomment2>${esc(k.note)}</mastercomment2>`:""}</comments></clipitem>`;
      markers+=`<marker><name>${esc(r?r.shot||"-":"missing")}</name><comment>${esc((r&&(r.description||r.action))||"")}</comment><in>${x.start}</in><out>-1</out></marker>`; });
    out=`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="5"><sequence id="sequence-1"><name>${esc(title)}</name><duration>${total}</duration>${rate}<timecode>${rate}<string>01:00:00:00</string><frame>${recStart}</frame><displayformat>NDF</displayformat></timecode><in>-1</in><out>-1</out><media><video><format><samplecharacteristics>${rate}<width>1920</width><height>1080</height><pixelaspectratio>square</pixelaspectratio></samplecharacteristics></format><track>${items}<enabled>TRUE</enabled><locked>FALSE</locked></track></video></media>${markers}</sequence></xmeml>\n`;
    fn=`${proj} - ${title}.xml`;
  }
  const blob=new Blob([out],{type:kind==="edl"?"text/plain":"application/xml"}), a=h("a",{href:URL.createObjectURL(blob),download:fn}); document.body.append(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
  toast(`Exported ${fn}${L.some(x=>x.cl.src==="board")?" (boards come in as offline clips named after the shot)":""}`);
  return out;
}

/* ---------- Resets: go again without cutting. R1, R2... with their timecode, on the take that's rolling ---------- */
function resetLabel(r){ const a=r&&(r.seq&&R(r.seq)?seqAnchor(r):r), t=a&&rollingTake(a), n=t?(t.resets||[]).length+1:1; return "↺ Reset"+(t?" R"+n:""); }
function resetTake(id){
  const r0=R(id); if(!r0) return null; const r=r0.seq&&R(r0.seq)?seqAnchor(r0):r0;
  const a=takeList(r), t=a[a.length-1];
  if(!t||t.out||!t.at||Date.now()-t.at>=4*3600e3){ toast("Nothing rolling: roll (or clap) first. Reset marks each go within a take you don't cut."); return null; }
  const rs=t.resets||(t.resets=[]), x={n:rs.reduce((m,y)=>Math.max(m,y.n),0)+1,tc:tcString(nowTcMs(),slateFps()),at:Date.now(),mark:""};
  rs.push(x); setTakeList(r,a); commit(); renderBody();
  toast(`Take ${t.n} · reset R${x.n} at ${x.tc}`);
  return {take:t,reset:x};
}
function slateReset(){ if(!SLV.id) return; const res=resetTake(SLV.id); const m=$("#slMsg");
  if(!res){ if(m) m.textContent="Nothing rolling to reset: clap to log a take first"; return; }
  renderSlate(); SLV.msgUntil=Date.now()+2500; const m2=$("#slMsg"); if(m2) m2.textContent=`↺ Take ${res.take.n} · reset R${res.reset.n} at ${res.reset.tc}`; }
function resetText(t){ return (t.resets||[]).map(x=>`R${x.n} ${x.tc}${x.mark?" ("+x.mark+")":""}`).join("; "); }
const RESET_MARK={hero:"★",good:"✓",ng:"✗",safety:"S"};
function editReset(rowId,tn,rn,fn){ const r0=R(rowId); if(!r0) return; const r=r0.seq&&R(r0.seq)?seqAnchor(r0):r0; const a=takeList(r), t=a.find(z=>z.n===tn); if(!t) return;
  const x=(t.resets||[]).find(z=>z.n===rn); if(!x) return; const keep=fn(x,t); if(keep===false) t.resets=t.resets.filter(z=>z!==x); setTakeList(r,a); syncMarks(r); commit(); renderBody(); }
function resetChips(rowId,t,redraw){
  const rs=t.resets||[]; if(!rs.length&&!t.clap) return "";
  const box=h("div",{class:"nvresets"});
  if(t.clap) box.append(h("small",{class:"note clapat",title:"The clap (sync point). The Edit tool starts this take just after it."},"Clap "+t.clap));
  if(rs.length) box.append(h("small",{class:"note"},"Resets:"));
  for(const x of rs){
    const chip=h("button",{class:"rchip"+(x.mark?" m-"+x.mark:""),title:`Reset R${x.n} at ${x.tc}${x.mark?" · "+x.mark:""}. Click to mark it Hero, Good, NG or Safety`},
      h("b",{},"R"+x.n),h("span",{class:"mono"}," "+x.tc),x.mark?h("span",{class:"rmk"}," "+RESET_MARK[x.mark]):"",x.clap?h("span",{class:"note",title:"Clapped at "+x.clap}," · clap"):"");
    chip.onclick=e=>{ e.stopPropagation(); $$(".locpop").forEach(p=>p.remove());
      const pop=h("div",{class:"locpop seqmenu",role:"menu"}); const close=()=>pop.remove();
      const item=(l,fn,on)=>h("button",{class:"mi"+(on?" on":""),role:"menuitem",onclick:()=>{close();fn();redraw&&redraw()}},l);
      pop.append(h("div",{class:"note",style:"margin:0 .3rem .3rem"},`Take ${t.n} · R${x.n} · ${x.tc}`),
        ...[["hero","Hero ★"],["good","Good ✓"],["ng","NG ✗"],["safety","Safety"]].map(([m,l])=>item(l,()=>editReset(rowId,t.n,x.n,z=>{z.mark=z.mark===m?"":m}),x.mark===m)),
        item("Remove this reset",()=>{editReset(rowId,t.n,x.n,()=>false);toast(`R${x.n} removed`,{label:"Undo",fn:()=>{undo();redraw&&redraw()}})}));
      document.body.append(pop); const b=chip.getBoundingClientRect(); const top=b.bottom+6+pop.offsetHeight>innerHeight?Math.max(8,b.top-pop.offsetHeight-6):b.bottom+6;
      pop.style.top=top+"px"; pop.style.left=Math.max(8,Math.min(b.left,innerWidth-pop.offsetWidth-8))+"px";
      setTimeout(()=>document.addEventListener("pointerdown",function off(ev){if(!pop.contains(ev.target)){pop.remove();document.removeEventListener("pointerdown",off)}}),0); };
    box.append(chip);
  }
  return box;
}

// + Take: a take you forgot to roll on. It takes the next number but has no timecode and never shows as rolling
function addMissedTake(id,extra){ const t=logTake(id,Object.assign({tc:"",at:null,t:"",added:true},extra||{}));
  if(t) toast(`Take ${t.n} added (not rolled). Double-click its timecode to fill it in.`); return t; }

/* ---------- Backups: the server keeps the project as it stood at the start of each day (30 days) ---------- */
function canRestore(){ return !PROJECT_KEYS||IS_ADMIN; }
function backupsBox(){
  const box=h("div",{class:"backups"},h("h3",{},"Daily backups"),h("p",{class:"note"},"The site keeps this project as it stood before the first change of each day, for 30 days. Download one as a project file, or "+(canRestore()?"restore it: the whole project goes back to that point for everyone (Undo straight after puts it back).":"ask the admin to restore one.")));
  const list=h("div",{class:"bklist"},h("span",{class:"note"},"Loading…")); box.append(list);
  api("/api/backups").then(j=>{
    list.replaceChildren(); const days=j.backups||[];
    if(!days.length){ list.append(h("p",{class:"note"},"No backups yet: the first is made with the first change of the day.")); return; }
    for(const day of days){
      const nice=new Date(day+"T12:00").toLocaleDateString([], {weekday:"short",day:"numeric",month:"short",year:"numeric"});
      list.append(h("div",{class:"toolbar bkrow"},h("span",{},h("b",{},nice),h("span",{class:"note"}," start of the day")),
        h("button",{class:"btn small",onclick:()=>backupDownload(day)},"Download"),
        canRestore()?h("button",{class:"btn small danger",onclick:()=>backupRestore(day)},"Restore…"):null));
    }
  }).catch(e=>{ list.replaceChildren(h("p",{class:"note"},"Couldn't load the backups ("+e.message+").")); });
  return box;
}
async function backupFetch(day){ const j=await api("/api/backups?day="+encodeURIComponent(day)); return materialize(j.model); }
async function backupDownload(day){
  try{ const doc=await backupFetch(day);
    download(fileBase()+" backup "+day+".shotlist.json",JSON.stringify({app:"shotlist-scheduler",version:VERSION,saved:new Date().toISOString(),backupOf:day,doc}),"application/json");
    toast("Downloaded the "+day+" backup (pictures stay on the site)"); }catch(e){ toast("Couldn't download it: "+e.message); }
}
async function backupRestore(day){
  let doc; try{ doc=await backupFetch(day); }catch(e){ toast("Couldn't load it: "+e.message); return; }
  const n=x=>x.days.filter(d=>!d.archived).length, shots=x=>x.days.reduce((t,d)=>t+d.rows.filter(r=>!isBlock(r)).length,0);
  if(!(await ask("Restore the "+day+" backup?",`The whole project goes back to how it was at the start of that day, for everyone: ${n(doc)} day${n(doc)===1?"":"s"} and ${shots(doc)} shots (now ${n(S)} and ${shots(S)}). Takes and notes logged since then are lost unless you download a backup of today first. Undo straight after puts it all back.`,"Restore"))) return;
  commit();
  S.project=doc.project; S.cfg=doc.cfg; S.people=doc.people; S.cols=doc.cols||[]; S.days=doc.days; S.cuts=doc.cuts||[];
  commit(); renderAll(); toast("Restored the "+day+" backup",{label:"Undo",fn:()=>{undo()}});
}

/* ---------- the clap: the sync point. Kept on the rolling take (or on its latest reset), so the edit starts just after it ---------- */
function markClap(id,lagMs){
  // the moment is taken now; it's saved once the flash is over, so saving can't get in the flash's way
  const at=Date.now()+(lagMs||0), tc=tcString(nowTcMs()+(lagMs||0),slateFps());
  setTimeout(()=>saveClap(id,at,tc),(lagMs||0)+250);
}
function saveClap(id,at,tc){
  const r0=R(id); if(!r0) return; const r=r0.seq&&R(r0.seq)?seqAnchor(r0):r0; const a=takeList(r), t=a[a.length-1];
  if(!t||!t.at||at<t.at-1000||at-t.at>=4*3600e3||(t.out&&t.outAt&&at>t.outAt)) return;
  const rs=(t.resets||[]).filter(x=>x.at<=at), last=rs.length?rs.reduce((m,x)=>x.at>m.at?x:m):null;
  if(last) { last.clap=tc; last.clapAt=at; } else { t.clap=tc; t.clapAt=at; }
  setTakeList(r,a); commit();
}

// wrap report: where the day went. From the actual timeline: real setting up and shooting against the plan, and breaks at their real length
function planVsActual(d,C){
  const sec=h("section",{class:"docsec"},h("h3",{},"Plan against actual"));
  const U=actualUnits(d,C).filter(u=>u.done||u.blockU&&!u.live);
  if(!U.length){ sec.append(h("p",{class:"note"},"Nothing timed yet: set Status to Setting up when you move on to a shot, and log takes, to see where the day goes.")); return sec; }
  const m=x=>x?Math.round(x[1]-x[0]):0, sd=(a,p)=>{const x=Math.round(a-p);return x===0?"on plan":(x>0?"+":"−")+dur(Math.abs(x))}, cls=(a,p)=>Math.round(a-p)>0?"bad":Math.round(a-p)<0?"good":"";
  const t=h("table",{class:"doctable"},h("thead",{},h("tr",{},...["","Setting up","plan","Shooting","plan","Total vs plan"].map(x=>h("th",{},x)))));
  const tb=h("tbody",{}); let aSu=0,pSu=0,aSh=0,pSh=0,aB=0,pB=0; const over=[];
  for(const u of U){
    if(u.blockU){ const a=m(u.blk); aB+=a; pB+=u.pLen; tb.append(h("tr",{class:"pvbreak"},h("td",{},u.name),h("td",{colspan:"3"},`${u.est?"ended "+fmt(u.blk[1]):fmt(u.blk[0])+" to "+fmt(u.blk[1])} · ${dur(a)}`),h("td",{},dur(Math.round(u.pLen))),h("td",{class:cls(a,u.pLen)},sd(a,u.pLen)))); continue; }
    const su=u.setup?m(u.setup):null, sh=u.shoot?m(u.shoot):u.nolog?m(u.nolog):null;
    if(su!=null){aSu+=su;pSu+=u.pSu} if(sh!=null){aSh+=sh;pSh+=u.pSh+(u.nolog?u.pSu:0)}
    const tot=(su||0)+(sh||0), ptot=(su!=null?u.pSu:0)+(sh!=null?u.pSh+(u.nolog?u.pSu:0):0);
    if(tot-ptot>0) over.push({name:u.name,by:Math.round(tot-ptot)});
    tb.append(h("tr",{},h("td",{class:"nowrap"},h("b",{},u.name)),h("td",{class:"nowrap"},su!=null?dur(su):u.nolog?"(not split)":"-"),h("td",{class:"nowrap note"},su!=null?dur(Math.round(u.pSu)):""),
      h("td",{class:"nowrap"},sh!=null?dur(sh):"-"),h("td",{class:"nowrap note"},sh!=null?dur(Math.round(u.pSh+(u.nolog?u.pSu:0))):""),h("td",{class:"nowrap "+cls(tot,ptot)},ptot?sd(tot,ptot):"")));
  }
  tb.append(h("tr",{class:"pvtotal"},h("td",{},h("b",{},"Total")),h("td",{},dur(aSu)),h("td",{class:"note"},dur(Math.round(pSu))),h("td",{},dur(aSh)),h("td",{class:"note"},dur(Math.round(pSh))),h("td",{class:cls(aSu+aSh,pSu+pSh)},sd(aSu+aSh,pSu+pSh))));
  t.append(tb);
  const lines=[`Setting up ${sd(aSu,pSu)}, shooting ${sd(aSh,pSh)}`+(pB?`, breaks ${sd(aB,pB)}`:"")+"."];
  over.sort((a,b)=>b.by-a.by); if(over.length) lines.push("Ran longest over plan: "+over.slice(0,3).map(o=>`${o.name} (+${dur(o.by)})`).join(", ")+".");
  sec.append(h("p",{},lines.join(" ")),t);
  return sec;
}

/* ---------- duplicated sequences: changes to one can be pushed to its copies ---------- */
// a shot and the copies made of it share a twin key: the original shot's id
function twinKey(r){ return r?(r.dupSrc||r.id):""; }
function seqCopies(a){ if(!a||!a.seqDup) return []; return live().flatMap(d=>d.rows).filter(x=>x.seq===x.id&&x.seqDup===a.seqDup&&x.id!==a.id); }
function offerSeqPush(anchorId,what,fn){
  const a=R(anchorId); const copies=seqCopies(a); if(!copies.length) return;
  setTimeout(async()=>{
    const names=copies.map(c=>seqTitle(c)).join(", ");
    if(!await ask(`Update ${copies.length===1?"the copy":"the "+copies.length+" copies"} too?`,`You changed ${what} on ${seqTitle(a)}. Make the same change to ${names}?`,copies.length===1?"Update the copy":"Update copies")) return;
    commit(); const x=R(anchorId); for(const c of copies){ const cc=R(c.id); if(cc) fn(cc,x); }
    commit(); renderAll(); if($("#seqView").classList.contains("open")) renderSeqView(); toast(`Updated ${copies.length===1?seqTitle(copies[0]):copies.length+" copies"} - Undo to take it back`);
  },0);
}
// make a copy's shots match: copy in the shots added to the original, take out (or remove) the twins of shots taken out
function seqPushMembers(c,added,removed){
  const f=findRow(c.id); if(!f) return; const d=f.d; let anchor=c;
  for(const m of removed){
    const mem=seqMembers(anchor,d), tw=mem.find(x=>twinKey(x)===twinKey(m)); if(!tw) continue;
    const rest=mem.filter(x=>x.id!==tw.id);
    if(tw.id===anchor.id&&rest.length){ const na=rest[0]; for(const k of ["seqName","takeLog","seqNotes","seqTime","seqSetup","seqShoot","seqVideo","seqDup"]) na[k]=tw[k]; na.takes=tw.takes; rest.forEach(x=>x.seq=na.id); anchor=na; }
    // a copied shot nobody has shot yet goes; one with takes stays, just out of the sequence
    if(!Number(tw.takes)&&!takeList(tw).length&&!tw.done) d.rows.splice(d.rows.indexOf(tw),1);
    else { tw.seq=""; tw.seqDup=""; }
  }
  const mem=seqMembers(anchor,d), last=mem[mem.length-1];
  let at=last?d.rows.indexOf(last)+1:d.rows.length;
  for(const x of added){
    if(mem.some(y=>twinKey(y)===twinKey(x))) continue;
    const n=Object.assign({},x,{id:uid("r"),seq:anchor.id,dupSrc:twinKey(x),done:false,doneAt:null,takes:0,takeLog:"",cut:false,origStart:"",setupAt:null,seqName:"",seqNotes:"",seqTime:false,seqSetup:0,seqShoot:0,seqVideo:"",seqDup:""});
    d.rows.splice(at++,0,n);
  }
}

/* ---------- the four views: Clipboard (the day's list), Slate, Details (and Sequence View), Edit ---------- */
const VIEWS=[["clip","Clipboard"],["slate","Slate"],["details","Details"],["edit","Edit"]];
function curView(){ return $("#slateView").classList.contains("open")?"slate":$("#editView").classList.contains("open")?"edit":($("#noteView").classList.contains("open")||$("#seqView").classList.contains("open"))?"details":"clip"; }
function goView(v){
  const from=curView(); if(from===v){ updViewSwitch(); return; }
  // keep the shot you're on when moving between Slate and Details
  const ctx=from==="slate"?SLV.id:from==="details"?($("#seqView").classList.contains("open")?SQV.id:NV.id):(ED.sel&&R((edCut().clips.find(k=>k.id===ED.sel)||{}).row)?edCut().clips.find(k=>k.id===ED.sel).row:null);
  if(from==="slate") closeSlate(); else if(from==="details"){ if($("#seqView").classList.contains("open")) closeSeqView(); else closeNotes(); } else if(from==="edit") closeEdit();
  if(v==="slate") openSlate(ctx||undefined); else if(v==="details") openNotes(ctx||undefined); else if(v==="edit") openEdit();
  updViewSwitch();
}
function viewSwitch(){ const cur=curView();
  return h("nav",{class:"vswitch",role:"tablist","aria-label":"Views"},...VIEWS.map(([k,l])=>h("button",{class:"vsw vsw-"+k+(cur===k?" on":""),role:"tab","aria-selected":String(cur===k),title:"Switch to "+l,onclick:e=>{e.stopPropagation();goView(k)}},l))); }
function updViewSwitch(){ const cur=curView(); $$("#viewSwitch .vsw").forEach(b=>{const on=b.classList.contains("vsw-"+cur);b.classList.toggle("on",on);b.setAttribute("aria-selected",String(on))}); }

(function(){ const mo=new MutationObserver(()=>updViewSwitch()); for(const id of ["slateView","noteView","seqView","editView"]){ const el=document.getElementById(id); if(el) mo.observe(el,{attributes:true,attributeFilter:["class"]}); } })();

/* ---------- Edit: where each shot sits in the cuts (for Details), target length, import an EDL or FCP XML ---------- */
function edShotTimings(rowId){
  const out=[]; for(const c of (S.cuts||[])){ const L=edClips(c); L.forEach((x,i)=>{ if(x.cl.row===rowId) out.push({cut:c,clip:x.cl,i,start:x.start,end:x.end,total:edTotal(c)}); }); }
  return out;
}
// clip names in an imported cut -> shots and takes (DIT names, clip names, _R resets, shot_board)
function edNameIndex(){
  const ix=new Map(), put=(k,v)=>{ k=String(k||"").toLowerCase().replace(/\.(mov|mp4|mxf|wav|png|jpg|r3d|braw|ari)$/i,"").trim(); if(k&&!ix.has(k)) ix.set(k,v); };
  for(const d of live()) for(const r of d.rows){ if(isBlock(r)) continue; const a=edA(r);
    put((r.shot||"")+"_board",{row:r.id,src:"board"}); put((r.shot||"")+"_video",{row:r.id,src:"video"});
    if(a.id!==r.id) continue;
    for(const t of takeList(a)){ let nm=""; try{nm=shotName(a,d,t.n)}catch(e){}
      for(const base of [t.name,nm]){ if(!base) continue; put(base,{row:r.id,src:"take",take:t.n}); for(const x of (t.resets||[])) put(base+"_R"+x.n,{row:r.id,src:"take",take:t.n,reset:x.n}); } } }
  return ix;
}
function edMatchClip(name,comment,ix){
  const k=String(name||"").toLowerCase().replace(/\.(mov|mp4|mxf|wav|png|jpg|r3d|braw|ari)$/i,"").trim();
  if(ix.has(k)) return ix.get(k);
  const m=String(comment||"").match(/SHOT\s+([^\s-]+)/i); if(m){ const r=live().flatMap(d=>d.rows).find(x=>!isBlock(x)&&String(x.shot).toLowerCase()===m[1].toLowerCase()); if(r) return {row:r.id,src:"board"}; }
  return null;
}
function parseEdl(text){
  const ev=[]; let cur=null; const tc=/(\d\d:\d\d:\d\d[:;]\d\d)/.source;
  for(const line of text.split(/\r?\n/)){
    const m=line.match(new RegExp("^(\\d{3,})\\s+(\\S+)\\s+(\\S+)\\s+(C|D\\s*\\d*|W\\S*)\\s+"+tc+"\\s+"+tc+"\\s+"+tc+"\\s+"+tc));
    if(m){ if(!/^V/i.test(m[3])){ cur=null; continue; } cur={reel:m[2],srcIn:m[5],srcOut:m[6],recIn:m[7],recOut:m[8],name:"",comment:""}; ev.push(cur); continue; }
    if(!cur) continue;
    let c; if((c=line.match(/^\*\s*FROM CLIP NAME:\s*(.+)$/i))) cur.name=c[1].trim(); else if((c=line.match(/^\*\s*(?:COMMENT|LOC)[^:]*:\s*(.+)$/i))) cur.comment+=(cur.comment?" ":"")+c[1].trim();
  }
  return ev.map(e=>({name:e.name||e.reel,comment:e.comment,srcIn:edTcToF(e.srcIn.replace(";",":")),f:edTcToF(e.recOut.replace(";",":"))-edTcToF(e.recIn.replace(";",":")),recIn:edTcToF(e.recIn.replace(";",":"))}));
}
function parseXml(text){
  const doc=new DOMParser().parseFromString(text,"application/xml"); const out=[];
  const seq=doc.querySelector("sequence"); if(!seq) return out;
  const track=seq.querySelector("media > video > track"); if(!track) return out;
  for(const ci of track.querySelectorAll(":scope > clipitem")){
    const g=s=>{const e=ci.querySelector(":scope > "+s);return e?e.textContent.trim():""};
    const start=Number(g("start")), end=Number(g("end")), inF=Number(g("in")), outF=Number(g("out"));
    const file=ci.querySelector(":scope > file"), fid=file&&file.getAttribute("id");
    const fnode=file&&file.querySelector("name")?file:(fid?doc.querySelector(`file[id="${fid}"] > name`)?.parentNode:null);
    const ftc=fnode&&fnode.querySelector(":scope > timecode > string");
    const base=ftc?edTcToF(ftc.textContent.trim()):0;
    out.push({name:g("name")||(fnode&&fnode.querySelector(":scope > name")?.textContent)||"",comment:(ci.querySelector("comments")?.textContent||"").trim(),srcIn:(base||0)+(isFinite(inF)?inF:0),f:(isFinite(end)&&isFinite(start)&&end>start)?end-start:Math.max(1,outF-inF),recIn:start});
  }
  return out;
}
function edImport(){
  const inp=h("input",{type:"file",accept:".edl,.xml,text/plain,application/xml",style:"display:none"}); document.body.append(inp);
  inp.onchange=async()=>{ const f=inp.files[0]; inp.remove(); if(!f) return; const text=await f.text();
    const evs=/\.xml$/i.test(f.name)||/^\s*<\?xml|<xmeml/i.test(text)?parseXml(text):parseEdl(text);
    if(!evs.length){ toast("No video events found in "+f.name); return; }
    const ix=edNameIndex(); let hit=0;
    const clips=evs.map(e=>{ const m=edMatchClip(e.name,e.comment,ix); const k={id:uid("k"),row:m?m.row:"",src:m?m.src:"board",take:m&&m.take!=null?m.take:null,reset:m&&m.reset!=null?m.reset:null,url:"",f:Math.max(1,e.f||1),inF:0,name:m?"":e.name,note:m?"":"Not matched to a shot: "+e.name};
      if(m){ hit++; if(m.src==="take"){ const r=R(m.row), t=r&&edTakes(r).find(x=>x.n==m.take), b=t&&edTcToF(t.tc); if(b!=null&&e.srcIn!=null&&e.srcIn>=b) k.inF=e.srcIn-b; } }
      return k; });
    const o=edData(), base=f.name.replace(/\.(edl|xml)$/i,""); const c={id:uid("c"),name:base.slice(0,50)||"Imported cut",audio:"",target:null,notes:"Imported from "+f.name,clips};
    o.cuts.push(c); edSave(o); P.edCut=Object.assign({},P.edCut,{[pid()]:c.id}); savePrefs(); ED.t=0; ED.sel=null; ED.cur=""; renderEdit();
    toast(`Imported ${clips.length} clip${clips.length===1?"":"s"} from ${f.name}: ${hit} matched to shots${hit<clips.length?`, ${clips.length-hit} not (they show striped; set their shot under Clip)`:""}`);
  };
  inp.click();
}

// target length for the cut: running time turns red when over, with how much
function edTargetBox(c,total){
  const fps=edFps(), tgt=Number(c.target)||0;
  const inp=h("input",{type:"text",class:"edtarget",value:tgt?(Math.floor(tgt/60)+":"+String(Math.round(tgt%60)).padStart(2,"0")):"",placeholder:"m:ss",title:"Target length for this cut (minutes:seconds)","aria-label":"Target length"});
  inp.onchange=()=>{ const v=inp.value.trim(); let s=null; const m=v.match(/^(\d+):(\d{1,2})$/); if(m) s=Number(m[1])*60+Number(m[2]); else if(/^\d+(\.\d+)?$/.test(v)) s=Number(v); edDo(x=>{x.target=s&&s>0?s:null}); renderEdit(); };
  const diff=tgt?total/fps-tgt:0;
  return h("span",{class:"edtgt"},h("span",{class:"note"},"Target"),inp,tgt?h("span",{class:"edtgtdiff "+(diff>0.5?"over":diff<-0.5?"under":"on")},Math.abs(diff)<0.5?"on target":(diff>0?"+":"−")+edSecs(Math.round(Math.abs(diff)*fps))):null);
}

/* ---------- Details: the Notes card's columns (per device), and the Edit card ---------- */
const NV_FIELDS_DEFAULT=["director","camera","lighting","vfx","props"];
const NV_SKIP=new Set(["handle","shot","seq","shotId","setup","start","shoot","end","takes","refs","actions","description","video","orig"]);
function nvFieldChoices(){ return cols().filter(c=>!NV_SKIP.has(c.key)&&!c.fixed); }
function nvFieldCols(){ const keys=Array.isArray(P.nvFields)?P.nvFields:NV_FIELDS_DEFAULT; const all=nvFieldChoices(); return keys.map(k=>all.find(c=>c.key===k)).filter(Boolean); }
function nvFieldEditor(r,c){
  const k=c.key, lab=c.label||c.base||k, save=(v,soft)=>{const x=R(r.id);if(!x)return;x[k]=v;soft?softCommit():(commit(),renderBody())};
  if(c.type==="flag"){ const cb=h("input",{type:"checkbox"}); cb.checked=!!r[k]&&r[k]!=="0"; cb.addEventListener("change",()=>save(cb.checked?(c.custom?true:"Y"):"",false)); return h("label",{class:"nvflag"},cb," "+lab); }
  if(c.options&&c.options.length){ const sel=h("select",{},...c.options.map(o=>h("option",{value:o,selected:String(r[k]||"")===o},o||"-"))); sel.addEventListener("change",()=>save(sel.value,false)); return h("label",{},lab,sel); }
  if(c.type==="number"){ const i=h("input",{type:"number",value:r[k]??""}); i.addEventListener("change",()=>save(i.value===""?"":Number(i.value),false)); return h("label",{},lab,i); }
  const t=h("textarea",{rows:c.type==="note"?"2":"1",placeholder:lab}); t.value=r[k]||"";
  t.addEventListener("input",()=>{save(t.value,true);autosize(t)}); t.addEventListener("change",()=>{commit();renderBody()});
  requestAnimationFrame(()=>autosize(t)); return h("label",{},lab,t);
}
function nvFieldMenu(anchor){
  $$(".locpop").forEach(x=>x.remove());
  const pop=h("div",{class:"locpop seqmenu statmenu",role:"menu"});
  const cur=()=>Array.isArray(P.nvFields)?P.nvFields.slice():NV_FIELDS_DEFAULT.slice();
  pop.append(h("div",{class:"note",style:"margin:0 .3rem .3rem"},"Edit these in Details (this device)"));
  for(const c of nvFieldChoices()){ const cb=h("input",{type:"checkbox"}); cb.checked=cur().includes(c.key);
    cb.addEventListener("change",()=>{let L=cur().filter(k=>k!==c.key); if(cb.checked) L.push(c.key); P.nvFields=L; savePrefs(); renderNotes();});
    pop.append(h("label",{class:"mi"},cb," "+(c.label||c.base||c.key))); }
  pop.append(h("button",{class:"mi",onclick:()=>{P.nvFields=null;savePrefs();renderNotes();pop.remove()}},"Back to the usual five"));
  document.body.append(pop);
  const b=anchor.getBoundingClientRect(); pop.style.top=Math.max(8,Math.min(b.bottom+6,innerHeight-pop.offsetHeight-8))+"px"; pop.style.left=Math.max(8,Math.min(b.right-pop.offsetWidth,innerWidth-pop.offsetWidth-8))+"px";
  setTimeout(()=>document.addEventListener("pointerdown",function off(e){if(!pop.contains(e.target)&&e.target.isConnected){pop.remove();document.removeEventListener("pointerdown",off)}}),0);
}
// where this shot sits in each cut: how long it should run, where, from which take
function nvEditCard(r){
  const box=h("div",{class:"nvedit"}), T=edShotTimings(r.id), fps=edFps();
  if(!T.length){ box.append(h("p",{class:"note"},"Not in a cut yet."),h("button",{class:"btn small",onclick:()=>{closeNotes();openEdit()}},"Open Edit")); return box; }
  for(const x of T){
    const rec0=3600*edNom();
    box.append(h("div",{class:"nveditrow"},
      h("div",{class:"nveditrun"},h("b",{},edSecs(x.clip.f)),h("span",{class:"note"}," ("+x.clip.f+" frames)")),
      h("div",{},h("b",{},x.cut.name||"Cut"),h("span",{class:"note"},` · clip ${x.i+1} of ${x.cut.clips.length} · ${edSrcLabel(x.clip,r)}`)),
      h("div",{class:"mono note"},`${edTc(rec0+x.start)} → ${edTc(rec0+x.end)} in the cut`+(x.clip.src!=="board"&&x.clip.inF?` · starts ${edSecs(x.clip.inF)} into the ${x.clip.reset?"reset":"take"}`:"")),
      x.clip.note?h("div",{class:"note"},x.clip.note):null,
      h("button",{class:"btn small",onclick:()=>{closeNotes();P.edCut=Object.assign({},P.edCut,{[pid()]:x.cut.id});savePrefs();ED.sel=x.clip.id;ED.tab="clip";ED.t=x.start;openEdit()}},"Open in Edit")));
  }
  const durS=durSec(r.duration); if(durS&&T.length){ const f=T[0].clip.f/fps, d=f-durS; if(Math.abs(d)>=0.5) box.append(h("p",{class:"note"},`Planned screen duration is ${durS}s: the cut runs it ${d>0?"+":"−"}${Math.abs(d).toFixed(1)}s ${d>0?"longer":"shorter"}.`)); }
  return box;
}

/* ---------- Sequence View: drag the shots into a new order (their rows move in the day to match) ---------- */
const SEQF_ALL=["seqName","takeLog","seqNotes","seqTime","seqSetup","seqShoot","seqVideo","seqDup"];
// put a sequence's shots in this order, in the slots the sequence already holds in the day; the first shot carries the sequence
function seqReorder(anchorId,order){
  const a=R(anchorId); if(!a) return null; const d=findRow(a.id).d, mem=seqMembers(a,d);
  const slots=mem.map(x=>d.rows.indexOf(x)).sort((x,y)=>x-y), rows=order.map(id=>R(id)).filter(Boolean);
  if(rows.length!==mem.length) return null;
  slots.forEach((ix,i)=>{ d.rows[ix]=rows[i]; });
  const na=rows[0];
  if(na.id!==a.id){ for(const k of SEQF_ALL) na[k]=a[k]; na.takes=a.takes; a.takes=0; Object.assign(a,{seqName:"",takeLog:"",seqNotes:"",seqTime:false,seqSetup:0,seqShoot:0,seqVideo:"",seqDup:""}); rows.forEach(x=>x.seq=na.id); if(SQV.id===a.id) SQV.id=na.id; }
  return na.id;
}
function sqApplyOrder(order,fromId){
  if(frozenNo()) return; commit();
  const nid=seqReorder(fromId,order); if(!nid) return;
  commit(); renderAll(); renderSeqView(); toast("Shot order changed - Undo to put it back");
  offerSeqPush(nid,"its shot order",c=>{ const d=findRow(c.id).d, cm=seqMembers(c,d), want=order.map(id=>twinKey(R(id)));
    const ord=[...cm].sort((x,y)=>{const i=want.indexOf(twinKey(x)),j=want.indexOf(twinKey(y));return (i<0?999:i)-(j<0?999:j)}); seqReorder(c.id,ord.map(x=>x.id)); });
}
function sqMove(id,dir,keepFocus){
  const a=R(SQV.id); if(!a) return; const d=findRow(a.id).d, ids=seqMembers(a,d).map(x=>x.id), i=ids.indexOf(id), j=i+dir;
  if(i<0||j<0||j>=ids.length) return; ids.splice(j,0,ids.splice(i,1)[0]); sqApplyOrder(ids,a.id);
  if(keepFocus) setTimeout(()=>{const g=$(`#seqView .seqshot[data-id="${id}"] .sqgrip`);if(g)g.focus()},30);
}
function sqDrag(e,id){
  if(e.button>0) return; e.preventDefault(); const g=e.currentTarget, card=g.closest(".seqshot"), list=card.parentNode;
  try{g.setPointerCapture(e.pointerId)}catch(err){}
  card.classList.add("sqmoving"); let target=null, after=false;
  const cards=()=>[...list.querySelectorAll(".seqshot")].filter(c=>c!==card);
  const mv=ev=>{ $$(".sqdrop").forEach(x=>x.classList.remove("sqdrop","sqdrop-after")); target=null;
    // the nearest card (they wrap in rows): drop before or after it by which half you're over
    let best=null,dist=1e9; for(const c of cards()){ const r=c.getBoundingClientRect(); const dx=Math.max(r.left-ev.clientX,0,ev.clientX-r.right), dy=Math.max(r.top-ev.clientY,0,ev.clientY-r.bottom), dd=dx*dx+dy*dy; if(dd<dist){dist=dd;best=c} }
    if(!best||dist>120*120) return; const r=best.getBoundingClientRect(); target=best; after=ev.clientX>r.left+r.width/2; best.classList.add("sqdrop"); if(after) best.classList.add("sqdrop-after"); };
  const up=()=>{ g.removeEventListener("pointermove",mv); g.removeEventListener("pointerup",up); g.removeEventListener("pointercancel",up);
    card.classList.remove("sqmoving"); $$(".sqdrop").forEach(x=>x.classList.remove("sqdrop","sqdrop-after"));
    if(!target) return; const a=R(SQV.id); if(!a) return; const d=findRow(a.id).d, ids=seqMembers(a,d).map(x=>x.id);
    ids.splice(ids.indexOf(id),1); let j=ids.indexOf(target.dataset.id); if(after) j++; ids.splice(j,0,id);
    if(ids.join()!==seqMembers(a,d).map(x=>x.id).join()) sqApplyOrder(ids,a.id); };
  g.addEventListener("pointermove",mv); g.addEventListener("pointerup",up); g.addEventListener("pointercancel",up);
}

// a sequence whose shots are spread out: move them to sit together where the first (or last) one is, in their order
function gatherSeq(id,where){
  if(frozenNo()) return; const a=R(id); if(!a) return; const d=findRow(a.id).d, mem=seqMembers(a,d); if(mem.length<2) return;
  commit();
  const keep=where==="last"?mem[mem.length-1]:mem[0], moving=mem.filter(x=>x!==keep);
  const rest=d.rows.filter(x=>!moving.includes(x)); let i=rest.indexOf(keep);
  if(where==="last") rest.splice(i,0,...moving); else rest.splice(i+1,0,...moving);
  d.rows=rest; commit(); renderAll(); if($("#seqView").classList.contains("open")) renderSeqView();
  toast(`${seqTitle(a)} gathered at Shot ${keep.shot||"-"} - Undo to put it back`);
}

/* ---------- Details for tech and break rows ---------- */
// tech: notes and a checklist, each item assigned to someone and ticked off (who, when). Ticks save one item at a time (c_ck_<id>) so two people ticking don't clash.
// breaks: catering (headcount, supplier, time, notes) and everyone's dietary needs and drinks, kept on the cast & crew list for every break
function ckItems(r){ try{ const a=JSON.parse(r.checklist||"[]"); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function ckSave(r,items){ const x=R(r.id); if(x){ x.checklist=JSON.stringify(items); } }
function ckDone(r,it){ const v=r["c_ck_"+it.id]; return v&&typeof v==="object"?v:null; }
function cateringOf(r){ try{ return Object.assign({head:"",supplier:"",time:"",notes:""},JSON.parse(r.catering||"{}")); }catch(e){ return {head:"",supplier:"",time:"",notes:""}; } }
function teamNames(){ const s=new Set(); for(const p of (S.people||[])) if(p.name) s.add(p.name); if(P.name) s.add(P.name); return [...s].sort((a,b)=>a.localeCompare(b)); }
function renderBlockDetails(r,d,v,body,host){
  host.innerHTML=""; host.dataset.key=""; host.style.display="none";
  const C=compute(), c=C.rows[r.id]||{}, tech=r.type==="tech", st=blockStatus(r);
  const head=h("div",{class:"nvhead"},
    h("button",{title:"Previous",onclick:()=>notesStep(-1)},"‹"),
    h("div",{class:"nvtitle"},h("b",{},blockName(r)),h("span",{class:"note"},`${d?d.name+" · ":""}${c.start!=null?fmt(c.start)+" to "+fmt(c.end):""} · ${dur(c.sh||0)} planned`),blockChip(r)),
    h("button",{title:"Next",onclick:()=>notesStep(1)},"›"),
    viewSwitch());
  v.insertBefore(head,body); rememberView("notes",r.id);
  const cards=[];
  const timing=h("section",{class:"nvblk"},h("h3",{},tech?"Tech / turnaround":"Break"),
    h("div",{class:"toolbar"},st!=="bon"?h("button",{class:"btn",onclick:()=>{startBlock(r.id);renderNotes()}},"Start now"):h("button",{class:"btn rolling",onclick:()=>{endBlock(r.id);renderNotes()}},"End now"),
      st!=="btodo"?h("button",{class:"btn",onclick:()=>{const x=R(r.id);x.setupAt=null;x.done=false;x.doneAt=null;commit();renderBody();renderNotes()}},"Not yet"):null),
    h("p",{class:"note"},st==="bon"?`On now since ${fmt(dayMinOf(d,r.setupAt))}`:st==="bdone"?`Done${r.doneAt!=null?" at "+fmt(r.doneAt):""}`:"Not started yet. Starting and ending it keeps ahead / behind and the actual timeline right."));
  cards.push(timing);
  if(tech) cards.push(checklistCard(r));
  else { cards.push(cateringCard(r,d)); cards.push(dietCard()); }
  const nt=h("textarea",{rows:"4",placeholder:tech?"What needs doing in this turnaround, kit, who's on it":"Anything else for this break: location, timings, who's covering set"}); nt.value=r.blockNotes||"";
  nt.addEventListener("input",()=>{const x=R(r.id);if(x){x.blockNotes=nt.value;autosize(nt);softCommit()}}); nt.addEventListener("change",commit); requestAnimationFrame(()=>autosize(nt));
  cards.push(h("section",{class:"nvblk"},h("h3",{},"Notes"),nt));
  for(const s of cards) body.insertBefore(s,host);
  v.append(h("p",{class:"keyhint"},"← → move through the day's shots, breaks and tech · Esc back to the Clipboard"));
}
function checklistCard(r){
  const items=ckItems(r), names=teamNames(), sec=h("section",{class:"nvblk nvck"});
  const doneN=items.filter(it=>ckDone(r,it)).length;
  sec.append(h("h3",{},"Checklist",items.length?h("span",{class:"note ckprog"},` ${doneN} of ${items.length} done`):""));
  const list=h("div",{class:"cklist"});
  items.forEach((it,i)=>{
    const dn=ckDone(r,it), cb=h("input",{type:"checkbox","aria-label":"Done: "+it.text}); cb.checked=!!dn;
    cb.addEventListener("change",()=>{const x=R(r.id);if(!x)return;x["c_ck_"+it.id]=cb.checked?{by:P.name||"Someone",at:Date.now()}:null;commit();renderBody();renderNotes()});
    const txt=h("input",{type:"text",value:it.text,class:"cktext"+(dn?" done":""),"aria-label":"Item"}); txt.addEventListener("change",()=>{const L=ckItems(R(r.id));const y=L.find(z=>z.id===it.id);if(y){y.text=txt.value.trim()||y.text;ckSave(r,L);commit()}});
    const who=h("select",{class:"ckwho","aria-label":"Assigned to"},h("option",{value:""},"Anyone"),...names.map(n=>h("option",{value:n,selected:it.who===n},n)),...(it.who&&!names.includes(it.who)?[h("option",{value:it.who,selected:true},it.who)]:[]));
    who.addEventListener("change",()=>{const L=ckItems(R(r.id));const y=L.find(z=>z.id===it.id);if(y){y.who=who.value;ckSave(r,L);commit();renderNotes()}});
    const mine=it.who&&P.name&&it.who===P.name;
    list.append(h("div",{class:"ckrow"+(dn?" done":"")+(mine?" mine":"")},cb,txt,who,
      dn?h("span",{class:"note ckby",title:new Date(dn.at).toLocaleString()},`✓ ${dn.by}, ${new Date(dn.at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`):h("span",{class:"ckby"}),
      h("button",{class:"x",title:"Remove this item","aria-label":"Remove",onclick:()=>{const L=ckItems(R(r.id)).filter(z=>z.id!==it.id);ckSave(r,L);const x=R(r.id);delete x["c_ck_"+it.id];commit();renderNotes()}},"×")));
  });
  if(!items.length) list.append(h("p",{class:"note"},"Nothing yet. Add what needs doing, and who's doing it."));
  sec.append(list);
  const add=h("input",{type:"text",placeholder:"Add an item, e.g. Re-rig key light to stage left","aria-label":"New checklist item"});
  const addWho=h("select",{"aria-label":"Assign to"},h("option",{value:""},"Anyone"),...names.map(n=>h("option",{value:n},n)));
  const go=()=>{ const t=add.value.trim(); if(!t) return add.focus(); const L=ckItems(R(r.id)); L.push({id:uid("ck").replace(/[^a-z0-9]/gi,""),text:t,who:addWho.value}); ckSave(r,L); commit(); renderNotes(); setTimeout(()=>{const a=$("#noteView .ckadd input[type=text]");if(a)a.focus()},30); };
  add.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();go()}});
  sec.append(h("div",{class:"ckadd"},add,addWho,h("button",{class:"btn small",onclick:go},"Add")));
  // copy a checklist from another tech row (any day)
  const others=live().flatMap(dd=>dd.rows.filter(x=>x.type==="tech"&&x.id!==r.id&&ckItems(x).length).map(x=>({x,dd})));
  if(others.length){ const sel=h("select",{"aria-label":"Copy a checklist from"},h("option",{value:""},"Copy items from another tech…"),...others.map(({x,dd})=>h("option",{value:x.id},`${dd.name} · ${blockName(x)} (${ckItems(x).length})`)));
    sel.addEventListener("change",()=>{ const src=R(sel.value); if(!src) return; const L=ckItems(R(r.id)); for(const it of ckItems(src)) L.push({id:uid("ck").replace(/[^a-z0-9]/gi,""),text:it.text,who:it.who||""}); ckSave(r,L); commit(); renderNotes(); toast("Copied "+ckItems(src).length+" items (unticked)"); });
    sec.append(h("div",{class:"toolbar",style:"margin-top:.4rem"},sel)); }
  if(items.some(it=>ckDone(r,it))) sec.append(h("button",{class:"btn small",style:"margin-top:.4rem",onclick:()=>{const x=R(r.id);for(const it of ckItems(x)) x["c_ck_"+it.id]=null;commit();renderNotes()}},"Untick everything"));
  return sec;
}
function cateringCard(r,d){
  const c=cateringOf(r), sec=h("section",{class:"nvblk"}), people=(S.people||[]).filter(p=>p.name);
  const save=(k,v,soft)=>{const x=R(r.id);if(!x)return;const o=cateringOf(x);o[k]=v;x.catering=JSON.stringify(o);soft?softCommit():commit()};
  const field=(k,label,ph,type)=>{const i=h("input",{type:type||"text",value:c[k]||"",placeholder:ph});i.addEventListener("input",()=>save(k,i.value,true));i.addEventListener("change",()=>save(k,i.value,false));return h("label",{class:"stack"},label,i)};
  const notes=h("textarea",{rows:"3",placeholder:"Order details, allergies to flag, where food is served"}); notes.value=c.notes||"";
  notes.addEventListener("input",()=>{save("notes",notes.value,true);autosize(notes)}); notes.addEventListener("change",()=>save("notes",notes.value,false)); requestAnimationFrame(()=>autosize(notes));
  sec.append(h("h3",{},"Catering"),
    h("div",{class:"catgrid"},field("head","Headcount",people.length?String(people.length)+" on cast & crew":"how many","number"),field("supplier","Supplier","caterer or venue"),field("time","Order by / arrives","e.g. order 10:30, arrives 12:45")),
    h("label",{class:"stack"},"Catering notes",notes));
  return sec;
}
function dietSummary(){
  const ps=(S.people||[]).filter(p=>p.name), diet=new Map(), drinks=[];
  for(const p of ps){ const d=String(p.diet||"").trim(); if(d){ for(const k of d.split(/[,;\/]+/).map(x=>x.trim().toLowerCase()).filter(Boolean)) diet.set(k,(diet.get(k)||0)+1); } if(String(p.drink||"").trim()) drinks.push(`${p.name}: ${p.drink.trim()}`); }
  return {ps,diet,drinks};
}
function dietCard(){
  const sec=h("section",{class:"nvblk nvdiet"}), {ps,diet,drinks}=dietSummary();
  sec.append(h("h3",{},"Dietary needs and drinks"));
  sec.append(h("p",{class:"note"},ps.length?(diet.size?[...diet].map(([k,n])=>`${n} ${k}`).join(" · "):"No dietary needs noted yet")+` · ${ps.length} people`:"Add people in Settings > Cast & crew to list them here."));
  if(ps.length){
    const t=h("table",{class:"doctable diettable"},h("thead",{},h("tr",{},h("th",{},"Name"),h("th",{},"Dietary needs"),h("th",{},"Drink"))));
    const tb=h("tbody",{});
    for(const p of ps){
      const mk=(k,ph)=>{const i=h("input",{type:"text",value:p[k]||"",placeholder:ph,"aria-label":k+" for "+p.name});i.addEventListener("input",()=>{const x=(S.people||[]).find(y=>y.id===p.id);if(x){x[k]=i.value;softCommit()}});i.addEventListener("change",()=>{commit();renderNotes()});return i};
      tb.append(h("tr",{},h("td",{},h("b",{},p.name),p.role?h("div",{class:"note"},p.role):""),h("td",{},mk("diet","e.g. vegan, gluten free, nut allergy")),h("td",{},mk("drink","e.g. tea, oat milk, 1 sugar"))));
    }
    t.append(tb); sec.append(t);
    const text=()=>{const s=dietSummary();return [`Headcount: ${s.ps.length}`,s.diet.size?"Dietary: "+[...s.diet].map(([k,n])=>`${n} ${k}`).join(", "):"",...s.ps.filter(p=>p.diet).map(p=>`  ${p.name}: ${p.diet}`),s.drinks.length?"Drinks:":"",...s.drinks.map(x=>"  "+x)].filter(Boolean).join("\n")};
    sec.append(h("div",{class:"toolbar",style:"margin-top:.4rem"},h("button",{class:"btn small",onclick:async()=>{const ok=await copyText(text());toast(ok?"Copied for the caterer":"Couldn't copy")}},"Copy for the caterer")));
    sec.append(h("p",{class:"note"},"Kept on the cast & crew list, so they carry over to every break and every day."));
  }
  return sec;
}
