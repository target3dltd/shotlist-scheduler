"use strict";
const VERSION = "2.30.1";
const CHANGELOG = [
  ["2.30.1","2026-11-21","Removing a take shows Undo straight away (and Ctrl/Cmd+Z now redraws Note View, Sequence View and the slate, so an undone take reappears). Sequence View can remove takes too. Double-click a take's number to renumber it (e.g. to match the slate; the next take follows on) or give it its own clip name, used in the takes export."],
  ["2.30.0","","Sequences have their own reference videos in Sequence View (Google Drive and the rest, as in Note View); shots with their own videos are marked. Drag a break, lunch or shot onto a sequence's header row (folded or not) to put it above or below the sequence, and drag the header's ⠿ to move the whole sequence. A break or shot left between a sequence's shots is flagged on its header row, with move after / move before. Click a sequence's time on its header row to type a start time; the whole sequence moves there."],
  ["2.29.2","","Double-click a sequence's name (header row, Sequence column or Sequence View) to rename it. Each shot's ▾ in the Sequence column moves it to another sequence, takes it out, or starts a new sequence with it; + puts a shot into one."],
  ["2.29.1","","Show: Hide cut shots. Not yet shot now leaves cut shots out too."],
  ["2.29.0","","Sequences in the table get a header row: fold a sequence into it (▾, or fold all), see its times, takes and what's caught, and time it as one (a single setup and shoot for the whole sequence; each shot's own times are kept for switching back). Duplicate a sequence (same shots, no takes) from its row or Sequence View. File > Running order: a one-page running order for the day, one line per sequence, to print, save as PDF, copy or download as CSV."],
  ["2.28.2","","Tidier header on phones: one row (undo, redo, ☰ Menu, Slate, Notes). The menu holds Settings, Help, Share, Columns, DIT names and light / dark as well as the file items, and opens from the bottom of the screen. Day tabs keep their full size and scroll sideways."],
  ["2.28.1","","Import reads a Sequence column (Seq, Sequence...): shots with the same letter or name become a sequence (/, -, n/a mean none). Updating from a revised sheet regroups the shots, shows the sequences in the preview, and can put the running order in sequence order (A, B, C...) with shot numbers in order inside each. A one-shot sequence works too."],
  ["2.28.0","","Sequences: group shots you shoot in one go (Seq on a row, or + in the new Sequence column). The sequence gets one set of takes and a DIT name covering the shot range (162-166, or 162+164+166). Sequence View shows the shots together with Roll / Cut, marks and notes; on Live Action days each take records which shots it caught, and the view lists what's still to get. Slate shows and claps the sequence; Sequence done ticks every shot. VCS: a tick per shot in Camera & look, shown on the slate, in Note View and Sequence View (shown by default on Mocap days)."],
  ["2.27.1","","Who's online: Go there switches to their day, clears any filter that would hide their row, scrolls to it and outlines it in their colour; someone in Slate or Note View is shown on the shot they have open. Change your name straight from the list (it's also in Settings, Team & sync). Drive account is per person (see 2.26.1)."],
  ["2.27.0","","Columns menu: Hide all not in use hides every column that's empty on all days of this kind (Live Action or Mocap), and Show all brings them all back."],
  ["2.26.1","","The Google account Drive videos open with is now your own setting (per project, on your device), so the team no longer overwrite each other's email. Note View says which account a Drive video is playing as, with a link to change it."],
  ["2.26.0","","Note View panels can be moved and resized: drag ⠿ (top right of a panel) to move it, or use the arrow keys on it; drag the corner at the bottom right to make it wider (in whole columns) and taller. Double-click the corner to reset that panel; Reset layout in the header puts them all back. Kept on each device. A playing video carries on while you rearrange."],
  ["2.25.3","","A reload keeps you where you were: Slate View or Note View reopens on the same shot (in that browser tab). Note View puts a shot's reference video in the top row beside the storyboard, so it's visible on laptop screens without scrolling; shots without one get a small Add video box at the end."],
  ["2.25.2","","Slate and Note View shortcuts no longer fire when Ctrl, Cmd or Alt is held, so Ctrl+Shift+R (reload) doesn't roll a take."],
  ["2.25.1","","Slate View: tap the shot number to open that shot in Note View."],
  ["2.25.0","","Reference video in Note View: paste a Google Drive link (or Dropbox, Box, OneDrive embed code, Vimeo, YouTube, .mp4) for a shot and it plays in a panel under the notes, for the whole team. Several videos per shot. Marking takes doesn't restart it. Direct video files get speed (quarter, half, full), frame steps, loop and mirror. A Reference video column in the table with a play button. Settings, Project, Reference video: where each project keeps its videos, the Google account its Drive files open with, the project folder, or your own server's web address so the team can type just a file name. PDF storyboard import no longer adds pictures a shot already has, and File > Remove duplicate pictures tidies shots that got them twice."],
  ["2.24.0","","Revised shot lists from a client: Import now offers to update the shots already in the project, matched by Shot #. You see every change first (column, was, now), then apply it in one go, and one Undo takes it back. Timings, takes, ticks, notes and pictures already in place are kept. A Status column cuts shots marked CUT, and other words in it (such as HERO SHOT) set the priority. The import also finds the newest shot list tab, the heading row under a key row, and a renamed column (e.g. without [TBC])."],
  ["2.23.0","","Shoot-day tools. Freeze timings: locks a day's timings and running order once you're rolling, while ticks, takes, notes and cuts still work. Call sheet and Wrap report for each day, to print, save as PDF or copy as text. Export takes for the edit or DIT (one row per take with timecode in and out, marks and notes). Weather, sunrise, sunset and golden hour on the day banner once a day has a location. Shoot-ready check (File menu): a checklist for the night before, with a project backup, sound test and a practice dropout."],
  ["2.22.1","","Cast & crew can be reordered: drag the handle at the start of a row, or use the up and down arrows. The order is shared with the team. More space between the initials and the online count at the top."],
  ["2.22.0","","Who's online: click the letters at the top for everyone on now, the day and shot they're on, their device, Slate or Note View, how long they've been on, Go there, and who was on earlier today. Feedback button (?) in the bottom left for bug reports, feature ideas and questions, with an inbox for the admin, a badge for new ones, and optional phone, chat or email alerts."],
  ["2.21.0","","Version history shows a date on the latest update only. Hero selects card on Mocap days: the seconds in takes marked Hero, next to Captured. Tidier header: buttons grouped, with Import, Export, Print and Activity in a File menu. Display settings regrouped into Presets, Colours, Text, Layout, Table and on-set tools, and Timeline colours, with switches and compact colour swatches. Settings tabs scroll in one row on phones."],
  ["2.20.0","","Takes and Captured / Raw footage cards: the day's logged takes and the seconds recorded between each take's timecode in and out (Captured on Mocap days, Raw footage on Live Action). Pace panel on shoot days: a big +/- score, each finished shot's minutes won back or lost, your on-pace streak and best streak, and where the day will wrap against the target."],
  ["2.19.0","","Cut in Slate View: Clap logs a take with its timecode in, Cut adds the timecode out and length. Note View shows in / out for every take (its Roll / Cut does the same), the slate shows the rolling take, and the .xlsx export fills TC IN / TC OUT from the logged takes. A jam is shared with the team, so every device on the project logs takes on the same timecode."],
  ["2.18.0","","Clap sound in Slate View: a clap by default, or clapper sticks, a 1 kHz sync beep, your own sound file or none, with a volume control. Slate and Notes now sit at the end of the header as red and blue buttons."],
  ["2.17.1","","Laptops: choose which audio input carries the LTC, open the slate in its own window for a second screen, and keyboard shortcuts in Slate View and Note View."],
  ["2.17.0","","Slate View: a full-screen, customisable slate for the next shot, with time of day timecode or timecode jammed from LTC audio (e.g. a Tentacle Sync into the mic input) or typed in, free-running after the jam; clapping logs the take with its timecode. Note View: the current shot full screen with its pictures and script, editable notes, a scribble pad saved to the shot, a take logger (Roll / Cut, Good / NG / Hero / Safety) and Shot done. Both work on phones and tablets."],
  ["2.16.1","","The jump-to-time box always opens fully on screen (above the row when there's no room below)."],
  ["2.16.0","","Jump a row to a time: click a row's Start time, type when you want it to happen, and it moves to the slot where it starts closest to that time (with a preview of where it will land). Works for shots, breaks and tech rows."],
  ["2.15.0","","Move shots between days: Move on a shot (or Move… in the recovery plan) sends it, and any others you tick, to another day or a new one, at the start or end. One click picks every shot not yet shot. Copy adds fresh copies instead. Moved shots keep everything and stay the same shot for the team."],
  ["2.14.0","","Tech / turnaround rows: a purple row type for technical setups, resets and turnarounds, added with + Tech / turnaround or +Tech on a row. They take time like a break but have their own colour, total and timeline colour, and a tag on the row switches between Break and Tech."],
  ["2.13.1","","A storyboard picture that won't load now says why in its box (click to retry) instead of staying blank, and the PDF import checks its pictures load back and says which days they went on."],
  ["2.13.0","","Storyboard pictures from a PDF: Import reads a shot tracker PDF (e.g. a Google Sheets export), matches each picture to its shot number, including extra frames on rows below and across page breaks, and adds them after a preview. Shots now hold 3 pictures. Pictures now survive exports: the .xlsx export puts them in Storyboard columns and the project file packs them in, and importing either brings them back into whichever project receives them. Pictures on rows of sheets from elsewhere come in too."],
  ["2.12.1","","Fix: renaming a project in Settings > Project now also renames it in the project list (Settings > Projects, the project key prompt), for everyone."],
  ["2.12.0","","Project keys: with ADMIN_KEY set on the site, each project has its own key, people only see and open the projects whose keys they hold, and the server enforces it for the schedule, saves, activity and images. The admin opens everything. Change a key to cut someone off one job without touching the others; devices using the old key drop the project at once. Share includes the key, and Remove from this device takes a project off a machine."],
  ["2.11.1","","No project data ships with the code any more, so a new site set up from the same repository starts empty. Help explains how to give another team its own private site."],
  ["2.11.0","","Column group colours: subtle tints tie related columns together (Shot, Timing, Capture, Location, Story, Camera & look, Notes, Storyboard), adjustable or off in Settings > Display, and your own columns can join a group. Camera & lighting is now two columns, Camera and Lighting, also in the CSV and .xlsx."],
  ["2.10.0","","Share button: a link that opens this project, and a ready-written invite to copy, email or share. The site password and team key are left out unless you choose to include them (send them separately to be safe), and the password is never saved. Optionally adds the person to Cast & crew."],
  ["2.9.0","","Hero / safety links: on wrapped days a panel asks for a link (Google Drive or similar) to the file for every hero and safety take, with a reminder until they are all in. New Hero link and Safety link columns, also in the CSV and .xlsx exports. Print / PDF shows only the tab being printed, the tick box in the first column is no longer clipped, and rows stay whole across page breaks (only a row taller than a page splits) with a cell line at the bottom of every page. Help has a search box and a contents list, and reads more generally. Tabs that aren't open now sit behind the day banner."],
  ["2.8.0","","Running delta: on the shoot day a Running card shows how far ahead (-) or behind (+) you are, from when shots were ticked off and the time now, with the projected wrap and a now line on the timeline. Recovery plan panel with amber and red gates (set in Settings > Team defaults): suggests shots to cut, ranked by setup and shooting time against priority and screen time, and wins such as moving a shot next to others at the same location to skip a setup. Cut takes a shot out of the timings without deleting it, and Restore brings it back."],
  ["2.7.1","","Print / PDF uses a small, still readable text size (about 6.5pt) with tight line spacing whatever your on-screen text size is, so rows stay short."],
  ["2.7.0","","Spreadsheet round trip: an exported .xlsx imported back restores the days exactly (name, Mocap / Live Action, date, times, script, refs, your own columns and their types), while still taking any edits made in the sheet. Before, a re-imported Live Action day came back as a Mocap day with a different set of columns. Also fixed: exporting failed when a project had a dropdown column, and importing into a new project now gives it its own new columns instead of adding them to the current project."],
  ["2.6.2","","Fix: after choosing Work offline you can get back. A Rejoin team project button appears in the header (and in Settings > Team & sync) whenever the team site is reachable; adding ?team to the address also rejoins."],
  ["2.6.1","","Print / PDF squeezes the columns to fit an A4 landscape page (notes columns give way first; your on-screen widths are untouched). The − / + buttons on Setup and Shoot can be switched off in Settings > Display if you prefer to type."],
  ["2.6.0","","Days are archived instead of deleted: Archive day puts the tab away for everyone and the Archived tab restores it. The day settings and filters sit on a coloured banner that joins the open tab. Timeline and banner colours in Settings > Display (or the Timeline colours link under the timeline). Timeline hour labels no longer get cropped. Short text columns (Action, Performer(s), custom text columns such as Runner notes) now wrap. Optional highlight of the rows teammates are working in, in their badge colour, off by default. Wrapped day tabs sit in the right third of the tab bar, and tabs shrink to fit as more days are added (hover for the full name). Tablet and phone friendly: the shot number stays in view while swiping along a row, the day banner folds down to the filters (tap Day settings for the rest), extra toolbar buttons move under More, tabs and summary cards scroll sideways, bigger touch targets, and column widths can be dragged with a finger."],
  ["2.5.1","","New app icon: a clapperboard with schedule bars, for browser tabs, bookmarks and phone home screens (Add to Home Screen opens it like an app)."],
  ["2.5.0","","Drag a column heading to move the column (just for you, on every day); a click still sorts. Reset column order in the Columns menu. Display reset also restores the column order."],
  ["2.4.0","","Day tabs are grouped: Ready to roll first (soonest date first), then Wrapped to the right (most recent first). Each day has a Status: Auto (wrapped once its date has passed or every shot is ticked), Ready to roll or Wrapped. The page opens on the next day ready to roll."],
  ["2.3.0","","Priority filter next to Show (one priority, a priority and higher, or not set; just for you). Priority colours can be set for every option in Settings > Columns, shared with the team, with readable text picked automatically; the .xlsx export uses the same colours."],
  ["2.2.0","","Your own columns: Settings > Columns adds text, long text, number, tick box or dropdown columns to every day for the whole team, reorders and deletes them (Undo restores the data), and can include any of them in shot names. Built-in columns can be renamed for the team. Priority is on every day, colour-coded in its dropdown and down the row's left edge, sorts highest first, and its options are editable. Day kinds are now called Mocap and Live Action. Import can create new columns from unmatched headings; exports carry your columns and renamed headings."],
  ["2.1.0","","Spreadsheet import and export. Import sheet brings in .xlsx or .csv (Google Sheets, Excel, Numbers, the Shotlist Builder or the Shotlist tracker): pick the sheet and header row, map each column, group retakes into take counts, and send them to a new day, one day per Shoot Day, the open day or a new project. Export .xlsx writes the Shotlist Builder tracker: Project tab with cast and crew, Shotlist with one row per take and live Take # and Shot ID formulas driven by an ID Settings tab, optional timecode and frame columns, a Schedule tab and Instructions. Drop a file anywhere to import it. Easier on the eyes: Settings > Display now has colour themes (warm paper, dim, high contrast light and dark, plus light and dark), a highlight colour, readable fonts (Atkinson Hyperlegible, Lexend, serif, rounded, mono), text weight, line and letter spacing, roomy rows, striped rows, reduce motion, and one-click presets. The ◐ button flips between your chosen light and dark themes. Safer updates: open copies show a 'new version' bar and save before refreshing, and test deploys use separate data so they can't touch the live schedule."],
  ["2.0.0","","Team edition and project settings. Runs on Netlify so the whole team edits one live schedule: every change saves as its own small edit and merges field by field, so people working at the same time don't overwrite each other; offline changes queue and send when you reconnect. Activity log and who's-online. Projects you can save, switch, copy and import, with project details, cast and crew in Settings. Capture (mocap / volcap) days with the Shotlist Builder columns and Shot ID builder, plus a DIT names panel that copies shot names with take numbers. Dark mode, text size, row spacing, 12/24h clock and team defaults in Settings. Paste a list of actions. Hyphens instead of dashes throughout."],
  ["1.2.1","","Move handle sits to the left of the Shot tick box."],
  ["1.2.0","","Multi-day tabs: add, copy, rename and delete days. CSV exports every day."],
  ["1.1.0","","Resizable columns, click-to-sort headers, per-column filters, Make this the running order."],
  ["1.0.0","","First version, built from a PDF shooting schedule: live recalculation, buffers, minimum setup, breaks, reorder, done ticks, timeline, undo, CSV/JSON export, print."]
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
// toast(msg) shows a note; toast(msg,{label,fn}) adds a button (e.g. Undo) and stays a little longer
function toast(msg,action){const t=$("#toast");t.textContent=msg;t.classList.toggle("act",!!action);
  if(action){const b=h("button",{class:"toastbtn",onclick:e=>{e.stopPropagation();t.classList.remove("show");action.fn()}},action.label);t.append(" ",b)}
  t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),action?7000:2600)}
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
  schedule:["perfCount","performers","genre","action","body","face","glove","hero","safety","takes","heroUrl","safetyUrl","vcs"],
  capture:["duration","orig","script","camera","lighting","location"]
};
const DISPLAY_DEFAULTS={theme:"auto",accent:"",font:"system",fw:400,ui:13,tbl:13,lh:1.35,ls:0,density:"comfortable",zebra:false,calm:false,clock:"24",band:"",bandMix:10};
const BANDS=[["","Theme default (soft slate)"],["none","None (plain)"],["#2f6fb0","Blue"],["#1f7a7a","Teal"],["#2e7d4f","Green"],["#c8a052","Sand"],["#d0700f","Orange"],["#b3264e","Rose"],["#7a5ea8","Purple"],["custom","Pick my own..."]];
function toHex(c){c=String(c||"").trim();if(/^#[0-9a-f]{6}$/i.test(c))return c;if(/^#[0-9a-f]{3}$/i.test(c))return "#"+c.slice(1).split("").map(x=>x+x).join("");const m=c.match(/\d+(\.\d+)?/g);if(m&&m.length>=3)return "#"+m.slice(0,3).map(x=>Math.round(+x).toString(16).padStart(2,"0")).join("");return "#888888"}
const P=Object.assign({name:"",poll:3,peerRows:false,tl:{},steppers:true},DISPLAY_DEFAULTS,{
  hiddenBy:clone(HIDDEN_DEFAULT),view:"all",widths:{},sort:null,filters:{},activeByProject:{},projectId:null,
  cid:uid("c"),mode:null,teamKey:"",ditShowDone:false},lsGet(PREF_KEY,{}));
if(!P.v227){ if(P.hiddenBy&&P.hiddenBy.schedule&&!P.hiddenBy.schedule.includes("vcs")) P.hiddenBy.schedule.push("vcs"); P.v227=true; }
if(!P.v215){ if(P.widths&&P.widths.actions&&P.widths.actions<112) P.widths.actions=112; P.v215=true; }
if(!P.v210){ for(const k of ["schedule","capture"]){const l=P.hiddenBy&&P.hiddenBy[k];if(l&&l.includes("camera")&&!l.includes("lighting"))l.push("lighting")} P.v210=true; }
if(!P.v28){ if(P.hiddenBy&&P.hiddenBy.schedule&&!P.hiddenBy.schedule.includes("heroUrl")) P.hiddenBy.schedule.push("heroUrl","safetyUrl"); P.v28=true; }
if(!P.v22){ for(const k of Object.keys(P.hiddenBy||{})) P.hiddenBy[k]=(P.hiddenBy[k]||[]).filter(x=>x!=="priority"); P.v22=true; }
function savePrefs(){lsSet(PREF_KEY,P)}

/* ===================== columns ===================== */
// column groups: a subtle tint ties related columns together
const COL_GROUPS=[["id","Shot","#5b6b7a"],["time","Timing","#2f6fb0"],["capture","Capture","#7a5ea8"],["place","Location","#b08a3e"],["story","Story","#2e7d4f"],["look","Camera & look","#1f7a7a"],["notes","Notes","#d0700f"],["refs","Storyboard","#b3264e"]];
const GROUP_OF={shot:"id",priority:"id",seq:"id",vcs:"look",shotId:"id",duration:"time",setup:"time",start:"time",shoot:"time",end:"time",orig:"time",
  takes:"capture",action:"capture",performers:"capture",perfCount:"capture",genre:"capture",body:"capture",face:"capture",glove:"capture",hero:"capture",safety:"capture",heroUrl:"capture",safetyUrl:"capture",
  location:"place",description:"story",script:"story",shotType:"look",camera:"look",lighting:"look",vfx:"notes",director:"notes",props:"notes",refs:"refs",video:"refs"};
function groupOf(c){return c.custom?(c.group||""):(GROUP_OF[c.key]||"")}
const BASE_COLS=[
  {key:"handle",label:"",fixed:true},
  {key:"shot",label:"Shot #",fixed:true},
  {key:"priority",label:"Priority",type:"list"},
  {key:"seq",label:"Sequence"},
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
  {key:"heroUrl",label:"Hero link",type:"url"},
  {key:"safetyUrl",label:"Safety link",type:"url"},
  {key:"location",label:"Location / Setup",type:"note"},
  {key:"description",label:"Description",type:"note"},
  {key:"script",label:"Script / Dialogue",type:"note"},
  {key:"shotType",label:"Shot type",type:"note"},
  {key:"camera",label:"Camera",type:"note"},
  {key:"lighting",label:"Lighting",type:"note"},
  {key:"vcs",label:"VCS",type:"flag"},
  {key:"vfx",label:"VFX notes",type:"note"},
  {key:"director",label:"Director notes",type:"note"},
  {key:"props",label:"Prop / set notes",type:"note"},
  {key:"refs",label:"Storyboard / refs"},
  {key:"video",label:"Reference video",type:"url"},
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
    if(c.key==="location") for(const k of (S&&S.cols)||[]) out.push({key:"c_"+k.id,label:k.label||"New column",type:k.type||"text",options:k.type==="list"?["",...optList(k.options)]:null,custom:true,colId:k.id,group:k.group||""});
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
const DEFAULT_WIDTHS={seq:130,vcs:56,lighting:170,handle:92,shot:92,shotId:230,duration:70,setup:120,start:82,shoot:120,end:82,orig:84,takes:96,action:150,performers:130,perfCount:66,genre:100,body:58,face:58,glove:58,hero:70,safety:70,priority:86,location:130,description:210,script:280,shotType:120,camera:190,vfx:160,director:220,props:180,refs:322,actions:112};
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
let presence=[], activity=[], recentPeople=[];
let lastSyncOk=0, syncTimer=null, flushTimer=null, flushing=false, syncing=false, backoff=0, netErr="";
let projects=[];             // [{id,name,archived}]
let localSeq=0;

const PKEY=(pid,part)=>`shotlist2-p-${pid}-${part}`;
/* ===================== project keys ===================== */
// With ADMIN_KEY set on the site, each project has its own key and the server only hands a project's data to
// someone holding that key (or the admin key). Keys are kept on this device so they're entered once.
let PROJECT_KEYS=false, IS_ADMIN=false;
let KEYS=(()=>{try{return JSON.parse(localStorage.getItem("shotlist2-pkeys")||"{}")||{}}catch(e){return {}}})();
function saveKeys(){try{localStorage.setItem("shotlist2-pkeys",JSON.stringify(KEYS))}catch(e){}}
function adminKey(){try{return localStorage.getItem("shotlist2-admin")||""}catch(e){return ""}}
function setAdminKey(k){try{k?localStorage.setItem("shotlist2-admin",k):localStorage.removeItem("shotlist2-admin")}catch(e){}}
function keyHeaders(extra={}){const id=(typeof P!=="undefined"&&P.projectId)||"";return Object.assign({"x-team-key":(typeof P!=="undefined"&&P.teamKey)||"","x-admin-key":adminKey(),"x-project-key":KEYS[id]||"","x-project-keys":JSON.stringify(KEYS)},extra)}
// take a project off this device: its cached schedule, unsent edits and key
function forgetLocal(id){try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith(PKEY(id,"")))localStorage.removeItem(k)}}catch(e){} delete KEYS[id]; saveKeys();}
async function redeemKey(key){const r=await api("/api/projects",{action:"redeem",key:String(key).trim()},{noProject:true});KEYS[r.id]=r.key;saveKeys();return r}
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
    const obj=o.e==="day"?S.days.find(d=>d.id===o.id):o.e==="row"?(findRow(o.id)||{}).r:o.e==="person"?S.people.find(p=>p.id===o.id):o.e==="col"?(S.cols||[]).find(c=>c.id===o.id):null;
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
  redoStack.push(ops); rebuild(true); updUndo(); refreshViews(); toast("Undone");
}
function redo(){
  commit();
  const ops=redoStack.pop(); if(!ops) return;
  enqueue(ops); undoStack.push(ops); rebuild(true); updUndo(); refreshViews();
}
// Slate, Note and Sequence View redraw after an undo or redo, so what they show is what happened
function refreshViews(){ if($("#noteView").classList.contains("open")) renderNotes(); if($("#seqView").classList.contains("open")) renderSeqView(); if($("#slateView").classList.contains("open")) renderSlate(); }
function updUndo(){ $("#undoBtn").disabled=!undoStack.length; $("#redoBtn").disabled=!redoStack.length; }

/* ===================== team networking ===================== */
async function api(path,body,opts={}){
  if(SIM_OFFLINE>Date.now()&&!/feedback/.test(path)) throw new Error("Practice dropout: no connection");
  const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),opts.timeout||15000);
  try{
    const sep=path.includes("?")?"&":"?";
    const url=path+(opts.noProject?"":sep+"p="+encodeURIComponent(pid()||""));
    const r=await fetch(url,{method:body===undefined?"GET":"POST",headers:keyHeaders({"content-type":"application/json"}),body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal,cache:"no-store"});
    const j=await r.json().catch(()=>({error:"Unexpected reply from the server"}));
    if(!r.ok) throw Object.assign(new Error(j.error||("Error "+r.status)),{status:r.status,code:j.code});
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
    if(e.status===403&&e.code==="project-key") return projectLocked(pid());
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
    const r=await api("/api/sync",{cid:P.cid,name:P.name,day:(D()||{}).name||"",dayId:(D()||{}).id||"",dev:deviceKind(),view:currentView(),idle:isIdle(),since:cursor,seen:[...seenKeys.keys()],row:(currentView()==="notes"?NV.id:currentView()==="slate"?SLV.id:focusRow)||""});
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
    presence=r.presence||[]; recentPeople=r.recent||[];
    lastSyncOk=Date.now(); backoff=0; netErr="";
    persistLocalState();
    const changed=rebuild(false);
    if(changed&&remote.length) flashRemote(remote);
    renderPresence(); applyPeerRows();
  }catch(e){
    netErr=e.message; if(e.status===401){syncing=false;return needKey(e.message)}
    if(e.status===403&&e.code==="project-key"){syncing=false;return projectLocked(pid())}
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
  if(MODE==="local"){if(P.mode==="local-forced"&&teamAvailable){label.textContent="Working offline (your choice)";el.title="You chose Work offline, so this browser is using its own copy. Click Rejoin team project to go back to the shared schedule.";return}label.textContent="Local - this browser";el.title="Saved in this browser only. Open the team site to work together.";return}
  const n=pending.reduce((a,p)=>a+p.ops.length,0);
  if(netErr&&!navigator.onLine||netErr&&backoff){el.classList.add("off");label.textContent=n?`Offline - ${pending.length} change${pending.length>1?"s":""} waiting`:"Offline - retrying";el.title=netErr+". Changes are kept on this device and sent when the connection is back.";return}
  if(pending.length||flushing){el.classList.add("busy");label.textContent="Saving…";el.title=`${pending.length} change${pending.length>1?"s":""} sending`;return}
  el.classList.add("live");const ago=lastSyncOk?Math.round((Date.now()-lastSyncOk)/1000):0;
  label.textContent="Live";el.title=lastSyncOk?`Synced ${ago}s ago`:"Connecting…";
}
setInterval(()=>{if(MODE==="team")updateStatus()},5000);
/* ---------- who's online ---------- */
let lastInput=Date.now();
["pointerdown","keydown","wheel","touchstart"].forEach(ev=>addEventListener(ev,()=>{lastInput=Date.now()},{passive:true}));
function isIdle(){return document.hidden||Date.now()-lastInput>180000}
function deviceKind(){const w=Math.min(innerWidth,screen.width||innerWidth),coarse=matchMedia("(pointer:coarse)").matches;return w<600?"phone":coarse&&w<1300?"tablet":"computer"}
function currentView(){return $("#slateView").classList.contains("open")?"slate":$("#noteView").classList.contains("open")?"notes":"schedule"}
// one entry per person: several tabs or devices with the same name show as one, with the busiest first
function peopleOnline(){
  const by=new Map();
  for(const p of presence.filter(p=>p.cid!==P.cid)){const k=(p.name||"").trim().toLowerCase()||p.cid;const g=by.get(k);
    if(!g) by.set(k,Object.assign({},p,{n:1,devs:[p.dev].filter(Boolean)}));
    else{g.n++;if(p.dev&&!g.devs.includes(p.dev))g.devs.push(p.dev);if(g.idle&&!p.idle||(!!g.idle===!!p.idle&&p.at>g.at))Object.assign(g,p,{n:g.n,devs:g.devs,since:Math.min(g.since||p.at,p.since||p.at)})}}
  return [...by.values()].sort((a,b)=>(!!a.idle-!!b.idle)||(a.name||"").localeCompare(b.name||""));
}
function renderPresence(){
  const w=$("#who"); w.innerHTML="";
  if(MODE!=="team") return;
  const others=peopleOnline();
  const me=h("span",{style:`background:${colorFor(P.name||P.cid)}`},initials(P.name||"You"));
  w.append(me,...others.slice(0,5).map(p=>h("span",{style:`background:${colorFor(p.name||p.cid)};${p.idle?"opacity:.55":""}`},initials(p.name))));
  w.append(h("span",{class:"wn"},others.length?`${others.length+1} online`:"Just you"));
  w.title=others.length?"Who's online: "+[P.name||"You",...others.map(p=>p.name||"Someone")].join(", "):"Only you have this project open right now";
  // the list is kept still while you're pointing at it or typing in it, so a button doesn't change under your click
  const wp=$("#whoPop"); if(wp.classList.contains("open")&&!wp.matches(":hover")&&!wp.contains(document.activeElement)) renderWhoPop(true);
}
function presenceRow(p){if(!p.row||!S) return ""; for(const d of S.days){const r=d.rows.find(x=>x.id===p.row); if(r) return isBlock(r)?blockName(r):"Shot "+(r.shot||"?")+(r.action?" · "+String(r.action).slice(0,40):"")} return ""}
// jump to the day and shot a teammate is on, showing the row even if your filters would hide it
function goToPerson(p){
  const pop=$("#whoPop"); pop.classList.remove("open"); $("#who").setAttribute("aria-expanded","false");
  const day=S.days.find(d=>d.id===p.dayId); if(!day) return;
  P.activeByProject[pid()]=day.id; savePrefs(); renderAll();
  const label=presenceRow(p);
  let tr=p.row&&$(`#grid tbody tr[data-id="${p.row}"]`);
  if(p.row&&!tr&&day.rows.some(r=>r.id===p.row)){ P.view="all"; P.prioFilter=""; P.filters={}; savePrefs(); renderAll(); tr=$(`#grid tbody tr[data-id="${p.row}"]`); if(tr) toast("Filters cleared so you can see "+(p.name||"their")+"'s row"); }
  if(tr){ tr.scrollIntoView({block:"center"}); tr.style.setProperty("--peer",colorFor(p.name||p.cid)); tr.classList.remove("peerjump"); void tr.offsetWidth; tr.classList.add("peerjump"); setTimeout(()=>tr.classList.remove("peerjump"),3200);
    if(!/Filters cleared/.test(($("#toast")||{}).textContent||"")) toast(`${p.name||"They"}: ${day.name}${label?" · "+label:""}`); }
  else toast(`${p.name||"They"} ${p.name?"is":"are"} on ${day.name}${p.row?"":" (no shot picked yet)"}`);
}
function renderWhoPop(quiet){
  const real=$("#whoPop"); const pop=quiet?h("div",{}):real; if(!quiet) real.innerHTML="";
  const devName={phone:"phone",tablet:"tablet",computer:"computer"}, viewName={slate:"in Slate View",notes:"in Note View"};
  const dur=t=>{const m=Math.round((Date.now()-t)/60000);return m<1?"just joined":m<60?`on for ${m} min`:`on for ${Math.floor(m/60)}h ${m%60}m`};
  const line=(p,me)=>{
    const where=[p.day,presenceRow(p)].filter(Boolean).join(" · ");
    const bits=[(p.devs&&p.devs.length?p.devs:[p.dev]).filter(Boolean).map(d=>devName[d]||d).join(" + "),viewName[p.view]||"",p.n>1?p.n+" tabs":""].filter(Boolean).join(", ");
    const go=!me&&p.dayId&&S&&S.days.some(d=>d.id===p.dayId&&!d.archived)?h("button",{class:"go",onclick:e=>{e.stopPropagation();goToPerson(p)}},"Go there"):null;
    return h("div",{class:"wp"},h("span",{class:"av",style:`background:${colorFor(p.name||p.cid)}`},initials(p.name||"You"),h("i",{class:p.idle?"idle":""})),
      h("div",{class:"wb"},h("b",{},me?(P.name||"You")+" (you)":p.name||"Someone"),
        h("small",{},(p.idle?"Away (no activity for a few minutes)":me?"Online":dur(p.since||p.at))+(bits?" · "+bits:"")),
        where?h("small",{},where," ",go):null));
  };
  const others=peopleOnline();
  const meLine=line({name:P.name,day:(D()||{}).name,row:focusRow,dev:deviceKind(),view:currentView()},true);
  // change your name right here (it's also in Settings > Team & sync)
  const ren=h("button",{class:"go",onclick:e=>{e.stopPropagation();const wb=$(".wb",meLine);const inp=h("input",{type:"text",value:P.name||"",maxlength:"40","aria-label":"Your name",style:"width:100%;font:inherit;padding:.25rem .4rem;border:1px solid var(--line);border-radius:5px;background:var(--field,var(--bg));color:var(--ink)"});
    const save=()=>{const v=inp.value.trim();if(v&&v!==P.name){P.name=v;savePrefs();toast("You're now "+v+" to the team");if(MODE==="team")scheduleSync(50)}renderPresence();renderWhoPop()};
    inp.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();save()}if(ev.key==="Escape"){ev.stopPropagation();renderWhoPop()}});inp.addEventListener("blur",save);
    wb.innerHTML="";wb.append(inp,h("small",{},"Enter to save. This is the name the team sees."));inp.focus();inp.select()}},"Change name");
  $(".wb",meLine).append(h("small",{},ren));
  pop.append(h("h4",{},`Online now (${others.length+1})`),meLine,...others.map(p=>line(p)));
  if(!others.length) pop.append(h("p",{class:"note",style:"margin:.3rem .4rem .5rem"},"Nobody else has this project open. When they do, you'll see their name, which day and shot they're on, and the device they're using."));
  if(recentPeople.length){
    pop.append(h("h4",{style:"margin-top:.8rem"},"Earlier today"));
    for(const p of recentPeople) pop.append(h("div",{class:"wp off"},h("span",{class:"av",style:`background:${colorFor(p.name||"?")}`},initials(p.name),h("i",{class:"off"})),
      h("div",{class:"wb"},h("b",{},p.name||"Someone"),h("small",{},"Last seen "+ago(p.at)+(p.day?" · "+p.day:"")+(p.dev?" · "+p.dev:"")))));
  }
  if(quiet&&pop.innerHTML!==real.innerHTML){ real.innerHTML=""; real.append(...pop.childNodes); }
}

$("#who").onclick=e=>{e.stopPropagation();const pop=$("#whoPop");const o=!pop.classList.contains("open");pop.classList.toggle("open",o);$("#who").setAttribute("aria-expanded",o);
  if(o){renderWhoPop();const r=$("#who").getBoundingClientRect();pop.style.top=(r.bottom+6)+"px";pop.style.left=Math.max(8,Math.min(r.left,innerWidth-pop.offsetWidth-8))+"px"}};
document.addEventListener("click",e=>{if(e.target.isConnected&&!e.target.closest("#whoPop,#who")&&$("#whoPop").classList.contains("open")){$("#whoPop").classList.remove("open");$("#who").setAttribute("aria-expanded","false")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if($("#whoPop").classList.contains("open")){$("#whoPop").classList.remove("open");$("#who").setAttribute("aria-expanded","false")} if($("#fbPanel").classList.contains("open")) closeFeedback(true)}});

/* ---------- feedback: bug reports, feature requests, questions ---------- */
const FB={type:"bug",tab:"send",canRead:false,items:null,latest:[]};
const FB_LABEL={bug:"Bug report",feature:"Feature request",question:"Question"};
function fbSeen(){try{return Number(localStorage.getItem("shotlist2-fbseen"))||0}catch(e){return 0}}
function setFbSeen(t){try{localStorage.setItem("shotlist2-fbseen",String(t))}catch(e){}}
function fbContext(){const d=D();return {version:VERSION,project:(S&&S.project&&S.project.name)||"",day:d?d.name:"",view:currentView(),mode:MODE,
  browser:navigator.userAgent.replace(/^Mozilla\/5\.0 /,"").slice(0,180),screen:`${innerWidth}x${innerHeight} (${deviceKind()})`}}
function openFeedback(){const p=$("#fbPanel");p.classList.add("open");$("#fbBtn").setAttribute("aria-expanded","true");renderFeedback();setTimeout(()=>{const t=$("#fbTitle");t&&t.focus()},50)}
function closeFeedback(focus){$("#fbPanel").classList.remove("open");$("#fbBtn").setAttribute("aria-expanded","false");if(focus)$("#fbBtn").focus()}
$("#fbBtn").onclick=e=>{e.stopPropagation();$("#fbPanel").classList.contains("open")?closeFeedback():openFeedback()};
document.addEventListener("click",e=>{if(e.target.isConnected&&$("#fbPanel").classList.contains("open")&&!e.target.closest("#fbPanel,#fbBtn"))closeFeedback()});
function renderFeedback(){
  const p=$("#fbPanel"); p.innerHTML="";
  p.append(h("div",{class:"toolbar",style:"justify-content:space-between;align-items:center;margin-bottom:.4rem"},h("h3",{style:"margin:0"},"Feedback and help"),h("button",{class:"btn small",onclick:()=>closeFeedback(true)},"Close")));
  if(FB.canRead){const nNew=FB.latest.filter(i=>i.status==="new").length;
    p.append(h("div",{class:"tabsx",role:"tablist"},h("button",{role:"tab","aria-selected":String(FB.tab==="send"),onclick:()=>{FB.tab="send";renderFeedback()}},"Send"),
      h("button",{role:"tab","aria-selected":String(FB.tab==="inbox"),onclick:()=>{FB.tab="inbox";renderFeedback();loadInbox()}},"Inbox"+(nNew?` (${nNew} new)`:""))))}
  if(FB.canRead&&FB.tab==="inbox") return renderInbox(p);
  const segBtn=(k,l)=>h("button",{type:"button","aria-pressed":String(FB.type===k),onclick:()=>{FB.type=k;keep();renderFeedback()}},l);
  const ph={bug:["What went wrong, in a few words","What were you doing, what did you expect, and what happened instead? Steps to make it happen again help a lot."],
            feature:["What would you like it to do?","What's the problem it would solve on set or in prep? How would you like it to work?"],
            question:["Your question, in a few words","Anything that helps explain it."]}[FB.type];
  const title=h("input",{type:"text",id:"fbTitle",maxlength:"140",placeholder:ph[0],value:FB.draftTitle||""});
  const det=h("textarea",{id:"fbDetails",placeholder:ph[1]}); det.value=FB.draftDetails||"";
  const from=h("input",{type:"text",id:"fbFrom",maxlength:"60",value:FB.draftFrom!=null?FB.draftFrom:(P.name||"")});
  const contact=h("input",{type:"text",id:"fbContact",maxlength:"120",placeholder:"Optional: email or phone if you'd like a reply",value:FB.draftContact||""});
  const incl=h("input",{type:"checkbox",role:"switch"}); incl.checked=FB.incl!==false;
  const ctx=fbContext(); const ctxBox=h("div",{class:"ctx"},`Version ${ctx.version} · ${ctx.mode==="team"?"team site":"this device only"}\nProject: ${ctx.project||"-"} · Day: ${ctx.day||"-"}\nScreen: ${ctx.screen}\n${ctx.browser}`);
  ctxBox.style.display=incl.checked?"":"none"; incl.onchange=()=>{FB.incl=incl.checked;ctxBox.style.display=incl.checked?"":"none"};
  function keep(){FB.draftTitle=title.value;FB.draftDetails=det.value;FB.draftFrom=from.value;FB.draftContact=contact.value}
  [title,det,from,contact].forEach(x=>x.addEventListener("input",keep));
  const send=h("button",{class:"btn primary",type:"submit"},"Send "+FB_LABEL[FB.type].toLowerCase());
  const msg=h("p",{class:"note",style:"margin:.5rem 0 0"});
  const form=h("form",{},h("div",{class:"seg",role:"group","aria-label":"Type"},segBtn("bug","Bug"),segBtn("feature","Feature idea"),segBtn("question","Question")),
    h("label",{},"Title",title),h("label",{},FB.type==="bug"?"What happened":"Details",det),
    h("div",{class:"dgrid",style:"grid-template-columns:1fr 1fr;gap:.5rem"},h("label",{},"Your name",from),h("label",{},"Contact",contact)),
    h("label",{class:"sw",style:"flex-direction:row;color:var(--ink)"},incl,h("span",{},"Include technical details",h("small",{},"version, browser, screen size, project and day: helps track bugs down"))),ctxBox,
    h("div",{class:"toolbar",style:"align-items:center"},send,h("button",{class:"btn small",type:"button",onclick:()=>{closeFeedback();$("#helpBtn").click()}},"Open Help")),msg);
  form.onsubmit=async e=>{e.preventDefault();keep();
    if(!title.value.trim()){title.focus();msg.textContent="Add a short title first.";return}
    const item={type:FB.type,title:title.value.trim(),details:det.value.trim(),from:from.value.trim(),contact:contact.value.trim(),ctx:incl.checked?ctx:{version:ctx.version}};
    if(MODE!=="team"){const txt=`${FB_LABEL[item.type]}: ${item.title}\n\n${item.details}\n\nFrom: ${item.from}${item.contact?" ("+item.contact+")":""}\n${incl.checked?ctxBox.textContent:"Version "+VERSION}`;
      try{await navigator.clipboard.writeText(txt);msg.textContent="This device isn't connected to the team site, so the report was copied: paste it into an email or message."}catch(err){msg.textContent="This device isn't connected to the team site. Copy this and send it on:\n\n"+txt;msg.style.whiteSpace="pre-wrap"}return}
    send.disabled=true;send.textContent="Sending…";
    try{
      const r=await api("/api/feedback",item,{noProject:true});
      // Netlify Forms copy, for email notifications; quietly skipped where forms aren't set up
      try{const f=new URLSearchParams({"form-name":"feedback",type:FB_LABEL[item.type],title:item.title,details:item.details,from:item.from,contact:item.contact,project:item.ctx.project||"",context:incl.checked?ctxBox.textContent:"Version "+VERSION});
        fetch("/",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:f.toString()}).catch(()=>{})}catch(err){}
      FB.draftTitle=FB.draftDetails="";
      p.innerHTML=""; p.append(h("h3",{},"Thanks, that's been sent"),h("p",{class:"note"},FB.type==="bug"?"If it keeps happening, send another with anything new you notice.":"It's in the list for the next round of updates."),
        h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:()=>renderFeedback()},"Send another"),h("button",{class:"btn small primary",onclick:()=>closeFeedback(true)},"Done")));
      if(FB.canRead) checkFeedback();
    }catch(err){send.disabled=false;send.textContent="Send "+FB_LABEL[FB.type].toLowerCase();msg.textContent="Couldn't send: "+err.message+". Your text is kept, so try again in a moment."}
  };
  p.append(form);
}
async function loadInbox(){try{const r=await api("/api/feedback",undefined,{noProject:true});FB.items=r.items||[];FB.hook=!!r.hook;if(FB.tab==="inbox"&&$("#fbPanel").classList.contains("open"))renderFeedback()}catch(e){toast("Couldn't load the inbox: "+e.message)}}
function renderInbox(p){
  if(!FB.items){p.append(h("p",{class:"note"},"Loading…"));return}
  if(FB.items.length){const newest=FB.items[0].at;if(newest>fbSeen()){setFbSeen(newest);updateFbDot()}}
  p.append(h("p",{class:"note",style:"margin:0 0 .6rem"},FB.items.length?`${FB.items.length} report${FB.items.length>1?"s":""}, newest first.`:"Nothing yet. Reports from anyone on the team site land here.",
    FB.hook?"":" Phone or email alerts: see Help, Feedback."));
  if("Notification" in window&&Notification.permission==="default") p.append(h("button",{class:"btn small",style:"margin:0 0 .6rem",onclick:async()=>{try{await Notification.requestPermission()}catch(e){}renderFeedback()}},"Alert me on this computer when a new one arrives"));
  const setStatus=async(i,st)=>{try{await api("/api/feedback",{action:"status",id:i.id,status:st},{noProject:true});i.status=st;FB.latest.forEach(x=>{if(x.id===i.id)x.status=st});renderFeedback();updateFbDot()}catch(e){toast(e.message)}};
  for(const i of FB.items){
    const del=h("button",{class:"btn small",onclick:async()=>{if(del.dataset.sure!=="1"){del.dataset.sure="1";del.textContent="Sure? Delete";return}
      try{await api("/api/feedback",{action:"delete",id:i.id},{noProject:true});FB.items=FB.items.filter(x=>x.id!==i.id);FB.latest=FB.latest.filter(x=>x.id!==i.id);renderFeedback();updateFbDot()}catch(e){toast(e.message)}}},"Delete");
    const c=i.ctx||{}; const ctxLine=[c.version&&"v"+c.version,c.project,c.day,c.view&&c.view!=="schedule"?c.view+" view":"",c.screen].filter(Boolean).join(" · ");
    p.append(h("div",{class:"fbi "+(i.status||"new")},
      h("div",{class:"t"},h("span",{class:"tag "+i.type},FB_LABEL[i.type]||i.type),h("b",{},i.title)),
      h("small",{},(i.from||"Someone")+(i.contact?" ("+i.contact+")":"")+" · "+new Date(i.at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})+(i.status&&i.status!=="new"?" · "+(i.status==="planned"?"Planned":"Done"):"")),
      i.details?h("p",{},i.details):null, ctxLine?h("small",{style:"display:block"},ctxLine):null, c.browser?h("small",{style:"display:block;opacity:.8"},c.browser):null,
      h("div",{class:"acts"},...[["new","New"],["planned","Planned"],["done","Done"]].filter(([k])=>k!==(i.status||"new")).map(([k,l])=>h("button",{class:"btn small",onclick:()=>setStatus(i,k)},"Mark "+l.toLowerCase())),del)));
  }
}
function updateFbDot(){const n=FB.latest.filter(i=>i.at>fbSeen()).length;const dot=$("#fbDot");dot.hidden=!n;dot.textContent=n>9?"9+":String(n||"");
  $("#fbBtn").title=n?`${n} new report${n>1?"s":""} in the feedback inbox`:"Report a bug, request a feature or ask a question"}
async function checkFeedback(){
  if(MODE!=="team"||document.hidden) return;
  try{const r=await api("/api/feedback?count=1",undefined,{noProject:true,timeout:8000});FB.canRead=!!r.canRead;if(!FB.canRead)return;
    const before=new Set(FB.latest.map(i=>i.id)); const first=!FB.checked; FB.checked=true; FB.latest=r.latest||[];
    const fresh=FB.latest.filter(i=>!before.has(i.id)&&i.at>fbSeen()&&i.from!==P.name);
    if(!first&&fresh.length){const i=fresh[0];toast(`New ${FB_LABEL[i.type].toLowerCase()} from ${i.from||"someone"}: ${i.title}`);
      try{if("Notification" in window&&Notification.permission==="granted")new Notification("Shotlist: "+FB_LABEL[i.type],{body:`${i.from||"Someone"}: ${i.title}`,tag:"fb-"+i.id})}catch(e){}}
    updateFbDot(); if(FB.tab==="inbox"&&$("#fbPanel").classList.contains("open")) loadInbox();
  }catch(e){}
}
setInterval(checkFeedback,120000);

/* ===================== projects ===================== */
function touchProject(){
  if(MODE!=="local") return;
  const list=lsGet("shotlist2-projects",[]); const it=list.find(x=>x.id===pid());
  if(it){it.updated=Date.now(); if(S&&S.project&&S.project.name) it.name=S.project.name; lsSet("shotlist2-projects",list)}
}
async function loadProjects(){
  if(MODE==="team"){const r=await api("/api/projects",undefined,{noProject:true});projects=r.projects||[];
    for(const p of projects.filter(x=>x.revoked)){forgetLocal(p.id);toast("A project key on this device no longer works, so that project has been taken off it")}
    projects=projects.filter(x=>!x.revoked)}
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
  if(MODE==="team"){const r=await api("/api/projects",{name,seed},{noProject:true});if(r.key){KEYS[r.id]=r.key;saveKeys()}await loadProjects();return r.id}
  const id=(name||"project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24)+"-"+Math.random().toString(36).slice(2,6);
  lsSet(PKEY(id,"seed"),seed); lsSet(PKEY(id,"base"),seedModel(seed));
  const list=lsGet("shotlist2-projects",[]); list.push({id,name,updated:Date.now()}); lsSet("shotlist2-projects",list); projects=list;
  return id;
}
async function openProject(id){
  commit();
  if(MODE==="team"&&pending.length){await flush()}
  P.projectId=id; savePrefs(); document.body.classList.remove("keylocked");
  base=lsGet(PKEY(id,"base"),null); cursor=(lsGet(PKEY(id,"meta"),{})||{}).cursor||"";
  pending=MODE==="team"?lsGet(PKEY(id,"pending"),[]):[];
  seenKeys=new Map(); undoStack=[]; redoStack=[]; activity=[]; presence=[];
  if(MODE==="local"&&!base){const seed=lsGet(PKEY(id,"seed"),null)||(SEED&&(SEED.id||"main")===id?SEED:blankSeed("Untitled project"));base=seedModel(seed);persistLocalState()}
  if(MODE==="team"&&!base){base=emptyModel();cursor=""}
  S=viewModel(); lastView=clone(S); ensureActive(); renderAll(); updUndo(); updateStatus();
  if(MODE==="team"){scheduleSync(0); if(pending.length) scheduleFlush(300)}
  bootView(); restoreView();
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
  const shots=d.rows.filter(r=>!isBlock(r));
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
// a sequence's first shot stands for the whole sequence: its number is the range (162-166, or 162+164+166)
function shotNumber(r,d){ if(r&&r.seq&&r.seq===r.id&&d){ const rg=seqRange(r,d); if(rg) return rg; } return shotNumber0(r,d); }
function shotNumber0(r,d){
  const c=cfg(); const pad=Math.max(1,Number(c.shotPad)||3);
  if(c.shotSource!=="running"&&r.shot&&String(r.shot).trim()){
    const s=String(r.shot).trim(); return /^\d+$/.test(s)?s.padStart(pad,"0"):s;
  }
  const shots=d.rows.filter(x=>!isBlock(x)); return String(shots.indexOf(r)+1).padStart(pad,"0");
}
function shotName(r,d,take){
  if(!r||isBlock(r)) return "";
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
  for(const x of d.rows){ if(x.id===r.id) break; if(!isBlock(x)&&sameKey(x)===k) n+=Number(x.takes)||0; } return n; }
function lastTake(r,d){ return takeBase(r,d)+(Number(r.takes)||0); }
// the next take follows the count, or a take renumbered higher (to match the slate)
function nextTake(r,d){ return Math.max(lastTake(r,d),...takeList(r).map(t=>Number(t.n)||0))+1; }

/* ===================== schedule maths ===================== */
// breaks and tech / turnaround time are blocks: they take time but aren't shots
function isBlock(r){return !!r&&(r.type==="break"||r.type==="tech")}
function blockName(r){return r.label||(r.type==="tech"?"Tech / turnaround":"Break")}
function effSetup(r,d){ d=d||D(); if(isBlock(r)) return 0; const b=Math.max(Number(r.setup)||0, Number(d.minSetup)||0); return b*(Number(d.setupPct)||100)/100; }
function effShoot(r,d){ d=d||D(); if(isBlock(r)) return Number(r.shoot)||0; return (Number(r.shoot)||0)*(Number(d.shootPct)||100)/100; }
// target wrap in minutes from the call day's midnight: a wrap earlier than the call is the next morning
function wrapMin(d){const w=toMin(d.wrap||"18:00"),c=toMin(d.call||"09:00");return w<c?w+1440:w}
function compute(d){
  d=d||D(); let t=toMin(d.call||"09:00"); const out={}; let setupT=0, shootT=0, breakT=0, techT=0;
  // a sequence timed as one: its first shot carries the sequence's setup and shoot, the others take no time
  const timed=new Map(); for(const r of d.rows) if(r.seq&&r.seq===r.id&&r.seqTime&&!r.cut) timed.set(r.id,r);
  for(const r of d.rows){ const A=!isBlock(r)&&r.seq&&timed.get(r.seq); let su,sh;
    if(A){ if(r.id===A.id){ const v={type:"shot",setup:A.seqSetup,shoot:A.seqShoot}; su=effSetup(v,d); sh=effShoot(v,d); } else { su=0; sh=0; } }
    else { su=r.cut?0:effSetup(r,d); sh=r.cut?0:effShoot(r,d); } const start=t+su, end=start+sh; out[r.id]={setupStart:t,start,end,su,sh};
    if(r.type==="tech") techT+=sh; else if(isBlock(r)) breakT+=sh; else {setupT+=su; shootT+=sh;} t=end; }
  return {rows:out, wrap:t, setupT, shootT, breakT, techT};
}

/* ===================== grid rendering ===================== */
function colW(k){if(P.widths&&P.widths[k])return P.widths[k];if(DEFAULT_WIDTHS[k])return DEFAULT_WIDTHS[k];const c=colMap()[k]||{};return c.type==="note"?200:c.type==="flag"?70:c.type==="number"?80:130}
// print: squeeze columns so the table fits an A4 landscape page (about 1060px), notes columns give way first
const PRINT_W={handle:20,shot:32,seq:56,vcs:24,priority:40,shotId:96,duration:28,setup:30,start:42,shoot:30,end:50,orig:40,takes:28,perfCount:24,body:24,face:24,glove:24,hero:30,safety:30,refs:84,actions:0};
function printWidths(){
  if(!S) return; const hid=hidden(), PAGE=1060; const list=cols().filter(c=>!hid.includes(c.key)&&c.key!=="actions");
  const w={}, flex=[];
  for(const c of list){ if(PRINT_W[c.key]!=null) w[c.key]=PRINT_W[c.key]; else if(c.type==="flag") w[c.key]=24; else if(c.type==="number") w[c.key]=30; else flex.push(c.key); }
  // text and notes columns share what's left, in proportion to their on-screen widths
  const fixed=Object.values(w).reduce((a,b)=>a+b,0); let room=PAGE-fixed;
  // weight by how much text each column holds on this day, so empty columns shrink and busy ones get the room
  // row height is set by the wordiest cell, so size each column by its long entries (90th percentile), not its total;
  // empty columns shrink to a sliver
  const rows=(D()||{rows:[]}).rows.filter(r=>!r.cut), MIN=36, EMPTY=22;
  const wt={}; flex.forEach(k=>{const L=rows.map(r=>String(r[k]??"").length).filter(n=>n>0).sort((a,b)=>a-b);wt[k]=L.length?Math.sqrt(L[Math.floor(L.length*0.9)]||L[L.length-1])+2:0});
  const base=k=>wt[k]?MIN:EMPTY, floor=flex.reduce((a,k)=>a+base(k),0);
  const tw=flex.reduce((a,k)=>a+wt[k],0);
  if(flex.length&&room>=floor){ const spare=room-floor; flex.forEach(k=>{w[k]=base(k)+(tw?Math.floor(spare*wt[k]/tw):Math.floor(spare/flex.length))}); }
  else { flex.forEach(k=>w[k]=base(k)); const f=PAGE/(fixed+floor); for(const k in w) w[k]=Math.floor(w[k]*f); }
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
    case "shot": return isBlock(r)?blockName(r):(r.shot||"");
    case "shotId": return shotName(r,D(),nextTake(r,D()));
    case "seq": return r.seq?seqTitle(seqAnchor(r)):"";
    case "setup": return isBlock(r)?0:c.su;
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
    if((P.view==="todo"||P.view==="nocut")&&r.cut&&!isBlock(r)) return false;
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
  if(!d||(!sorted&&!fcount&&(P.view||"all")==="all"&&!P.prioFilter)){vb.classList.remove("show");return}
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
    const th=h("th",{class:(sortable?"sortable":"")+hc,"data-col":c.key,"data-g":groupOf(c)||null});
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
    const fth=h("th",{class:hc.trim(),"data-col":c.key,"data-g":groupOf(c)||null});
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
  if(isFrozen()){inp.readOnly=true;inp.title="Timings are frozen for this day";inp.addEventListener("focus",()=>frozenNo(),{once:true})}
  inp.addEventListener("input",()=>{const x=R(r.id);if(!x)return;x[key]=Math.max(0,Number(inp.value)||0);recalc()});
  inp.addEventListener("change",commit);
  const bump=dir=>{if(frozenNo())return;const x=R(r.id);if(!x)return;x[key]=Math.max(0,(Number(x[key])||0)+dir*step());inp.value=x[key];recalc();commit()};
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
  if(isBlock(r)) return false;
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
function isUrl(v){return /^https?:\/\/\S+\.\S+/i.test(String(v||"").trim())}
function urlCell(r,key){
  const w=h("div",{class:"urlcell"});
  const i=h("input",{class:"cell",type:"url",placeholder:"Paste a link",value:r[key]||"","data-k":key,spellcheck:"false"});
  const a=h("a",{class:"urlopen",target:"_blank",rel:"noopener noreferrer",title:"Open the link"},"↗");
  const upd=()=>{const v=i.value.trim();a.href=isUrl(v)?v:"#";a.style.visibility=isUrl(v)?"visible":"hidden";i.classList.toggle("bad",!!v&&!isUrl(v))};
  i.addEventListener("input",()=>{const x=R(r.id);if(!x)return;x[key]=i.value.trim();upd();softCommit()});
  i.addEventListener("change",()=>{commit();renderLinks();renderStats(compute())});
  upd(); w.append(i,a); return w;
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
const imgCache=new Map(), imgErrors=new Map();
async function imgSrc(ref){
  if(!ref) return "";
  if(!String(ref).startsWith("img:")) return ref;
  if(imgCache.has(ref)) return imgCache.get(ref);
  // a picture that won't load says why, instead of leaving a blank box
  const p=(async()=>{try{const r=await fetch("/api/image?k="+encodeURIComponent(ref.slice(4))+"&p="+encodeURIComponent(pid()),{headers:keyHeaders(),cache:"no-store"});
      if(!r.ok){let why="";try{why=(await r.text()).slice(0,80)}catch(e){}imgErrors.set(ref,`error ${r.status}${why?": "+why:""}`);imgCache.delete(ref);return""}
      const b=await r.blob(); if(!/^image\//.test(b.type)&&b.size<200){imgErrors.set(ref,"not a picture ("+(b.type||"unknown")+")");imgCache.delete(ref);return""}
      return URL.createObjectURL(b)}catch(e){imgErrors.set(ref,"couldn't reach the site ("+e.message+")");imgCache.delete(ref);return""}})();
  imgCache.set(ref,p); return p;
}
let imgTarget=null;
function refBox(r,key){
  const d=h("div",{class:"ref"+(r[key]||r.ref1||r.ref2||r.ref3?"":" empty"),title:r[key]?"Click to enlarge":"Click to add image"});
  if(r[key]){
    const img=h("img",{alt:"reference"}); const ref=r[key];
    imgSrc(ref).then(s=>{ if(s){img.src=s;return}
      d.classList.add("broken"); d.title="This picture didn't load: "+(imgErrors.get(ref)||"unknown reason")+". Click to try again.";
      img.replaceWith(h("span",{class:"refmsg"},"Didn't load",h("br"),h("small",{},imgErrors.get(ref)||""))); });
    d.append(img);
    const x=h("button",{class:"x",title:"Remove image"},"✕");
    x.addEventListener("click",ev=>{ev.stopPropagation();const y=R(r.id);if(!y)return;y[key]="";commit();renderBody()});
    d.append(x);
    d.addEventListener("click",async()=>{ if(d.classList.contains("broken")){imgCache.delete(ref);imgErrors.delete(ref);renderBody();return} $("#lightImg").src=await imgSrc(r[key]);$("#lightbox").classList.add("open")});
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
  const seenSeq=new Set();
  shown.forEach(r=>{
    // a sequence gets a header row above its first shot; folded, its shots are hidden under it
    if(r.seq&&!isBlock(r)&&R(r.seq)){ if(!seenSeq.has(r.seq)){ seenSeq.add(r.seq); tb.append(seqHeadRow(r.seq,C,d,seenSeq.size===1)); } if(seqFolded(r.seq)) return; }
    const tr=h("tr",{"data-id":r.id,class:r.type==="tech"?"break tech":isBlock(r)?"break":""});
    const isBreak=isBlock(r);
    for(const c of cols()){
      const td=h("td",{class:hid.includes(c.key)?"hide-col":"","data-col":c.key,"data-g":groupOf(c)||null});
      const k=c.key;
      if(k==="handle"){
        const hd=h("div",{class:"ctl"});
        const g=h("span",{class:"handle",draggable:"true",title:"Drag to reorder"},"⠿");
        g.addEventListener("dragstart",e=>{if(isFrozen()){e.preventDefault();frozenNo();return}dragId=r.id;tr.classList.add("dragging");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",r.id)});
        g.addEventListener("dragend",()=>{tr.classList.remove("dragging");$$("tr.dropbefore").forEach(x=>x.classList.remove("dropbefore"))});
        hd.append(g);
        if(isBreak) hd.append(h("button",{class:"kindtag",title:r.type==="tech"?"Tech / turnaround time. Click to make it a break.":"A break or move. Click to make it tech / turnaround time.",onclick:()=>{const x=R(r.id);if(!x)return;const was=x.type;x.type=was==="tech"?"break":"tech";const c=cfg();if(!x.label||x.label===(was==="tech"?c.techLabel:c.breakLabel)||x.label===(was==="tech"?"Tech / turnaround":"Break"))x.label=x.type==="tech"?(c.techLabel||"Tech / turnaround"):(c.breakLabel||"Break");commit();renderBody()}},r.type==="tech"?"Tech":"Break"));
        if(!isBreak){const cb=h("input",{type:"checkbox",title:"Mark as shot","data-k":"done"});cb.checked=!!r.done;
          cb.addEventListener("change",()=>{const x=R(r.id);if(!x)return;x.done=cb.checked;x.doneAt=cb.checked?dayClock(D()):null;tr.classList.toggle("done",x.done);commit();if(P.view==="todo")renderBody();renderStats(compute());renderDayTabs()});
          hd.append(h("label",{class:"chk"},cb,"Shot"))}
        td.append(hd);
      }
      else if(k==="shot"){ td.append(isBreak?textCell(r,"label",false):textCell(r,"shot",false,{ph:"-"})); }
      else if(k==="seq"){ if(!isBreak) td.append(seqCell(r)); }
      else if(k==="shotId"){ if(!isBreak) td.append(nameCell(r)); }
      else if(k==="duration"){ td.className+=" num"; if(!isBreak) td.append(textCell(r,"duration",false)); }
      else if((k==="setup"||k==="shoot")&&!isBreak&&seqTimedRow(r)){ td.className+=" num"; td.append(h("span",{class:"seqtimed",title:"Timed as part of "+seqTitle(seqAnchor(r))+": set its timing in the sequence row above"},"in seq")); }
      else if(k==="setup"){ td.className+=" num"; if(!isBreak) td.append(minsCtl(r,"setup")); }
      else if(k==="shoot"){ td.className+=" num"; td.append(minsCtl(r,"shoot")); }
      else if(k==="start"){ td.className+=" num jumpable"; td.title="Click to move this row to a time of day"; td.append(h("div",{class:"time","data-t":"start"}),h("div",{class:"orig","data-t":"setupfrom"})); td.addEventListener("click",()=>openJumpTime(r.id,td)); }
      else if(k==="end"){ td.className+=" num"; td.append(h("div",{class:"time end","data-t":"end"})); }
      else if(k==="orig"){ td.className+=" num"; td.append(h("div",{class:"orig"},r.origStart||"-"),h("div",{class:"delta","data-t":"delta"})); }
      else if(k==="refs"){ if(!isBreak){const rf=h("div",{class:"refs"});rf.append(refBox(r,"ref1"),refBox(r,"ref2"));if(r.ref2||r.ref3)rf.append(refBox(r,"ref3"));td.append(rf)} }
      else if(k==="takes"){ td.className+=" num"; if(!isBreak) td.append(takesCell(r)); }
      else if(k==="actions"){
        const b=h("div",{class:"rowbtns"});
        b.append(h("button",{class:"mv",title:"Move up",onclick:()=>move(r.id,-1)},"↑"),h("button",{class:"mv",title:"Move down",onclick:()=>move(r.id,1)},"↓"),
          ...(isBreak&&r.type!=="tech"?[]:[h("button",{class:"movebtn",title:"Move or copy this shot to another day",onclick:()=>openMove([r.id])},"Move")]),h("button",{title:"Duplicate row",onclick:()=>dup(r.id)},"Dup"),h("button",{title:"Insert a break / move below",onclick:()=>insertBreakAfter(r.id)},"+Brk"),h("button",{class:"techbtn",title:"Insert tech / turnaround time below (technical setup, reset, turnaround)",onclick:()=>insertTechAfter(r.id)},"+Tech"),
          ...(isBreak?[]:[h("button",{class:"cutbtn",title:r.cut?"Put this shot back in the schedule":"Cut this shot from the schedule (nothing is deleted)",onclick:()=>setCut([r.id],!r.cut)},r.cut?"Restore":"Cut")]),
          ...(isBreak?[]:[h("button",{class:"seqbtn",title:r.seq?"Change this shot's sequence":"Group this shot with others into a sequence you shoot in one go",onclick:()=>openSeqDialog(r.id)},"Seq")]),
          h("button",{title:"Delete row",onclick:()=>del(r.id)},"Del"));
        td.append(b);
      }
      else if(!isBreak||k==="description"){
        const t=c.type;
        if(t==="flag") td.append(flagCell(r,k));
        else if(t==="list") td.append(listCell(r,k));
        else if(t==="number"){ td.className+=" num"; td.append(textCell(r,k,false,{type:"number",small:true})); }
        else if(t==="url") td.append(k==="video"?videoCell(r):urlCell(r,k));
        else if(t==="text") td.append(textCell(r,k,false));
        else if(t==="note") td.append(textCell(r,k,true));
      }
      tr.append(td);
    }
    if(r.done) tr.classList.add("done");
    if(r.seq&&!isBreak){ tr.classList.add("inseq"); tr.style.setProperty("--seq",seqColor(r.seq)); }
    if(r.cut){ tr.classList.add("cut"); tr.title="Cut from the schedule: it takes no time. Restore it from the row buttons or the plan panel."; }
    if(!isBlock(r)) paintPrio(null,tr,r.priority);
    tr.addEventListener("dragover",e=>{if(!dragId)return;e.preventDefault();$$("tr.dropbefore").forEach(x=>x.classList.remove("dropbefore"));tr.classList.add("dropbefore")});
    tr.addEventListener("drop",e=>{e.preventDefault();if(!dragId)return;if(String(dragId).startsWith("seq:")){const a=R(dragId.slice(4));dragId=null;if(a)moveRowsTo(seqMembers(a).map(x=>x.id),r.id,false);return}const rows=D().rows;const from=rows.findIndex(x=>x.id===dragId);let to=rows.findIndex(x=>x.id===r.id);if(from<0||to<0||from===to){dragId=null;return}const [m]=rows.splice(from,1);if(from<to)to--;rows.splice(to,0,m);dragId=null;commit();renderBody()});
    tb.append(tr);
  });
  recalc(); applyPeerRows();
}
let dragId=null, colDrag=null;
function recalc(){
  const d=D(); if(!d) return; const C=compute(); const wrapT=wrapMin(d);
  for(const tr of $$("#grid tbody tr[data-id]")){
    const r=d.rows.find(x=>x.id===tr.dataset.id); if(!r) continue; const c=C.rows[r.id];
    $('[data-t="start"]',tr).textContent=fmt(c.start);
    $('[data-t="end"]',tr).textContent="→ "+fmt(c.end);
    const sf=$('[data-t="setupfrom"]',tr); if(sf) sf.textContent=isBlock(r)?"":(c.su?"setup "+fmt(c.setupStart):"");
    const dl=$('[data-t="delta"]',tr);
    if(dl){ if(r.origStart){const o=toMin(r.origStart.length<5?"0"+r.origStart:r.origStart);const dd=c.start-o;dl.textContent=dd===0?"on time":(dd>0?"+":"")+dur(dd);dl.className="delta "+(dd>0?"late":dd<0?"early":"")} else dl.textContent=""; }
    const se=$('.eff[data-eff="setup"]',tr); if(se) se.textContent=(Math.round(c.su)!==Number(r.setup))?"= "+Math.round(c.su)+" min":"";
    const sh=$('.eff[data-eff="shoot"]',tr); if(sh) sh.textContent=(!isBlock(r)&&Math.round(c.sh)!==Number(r.shoot))?"= "+Math.round(c.sh)+" min":"";
    tr.classList.toggle("over",c.end>wrapT&&!r.done);
  }
  renderStats(C); renderPace(C); renderTimeline(C); renderPlan(C); renderLinks(); refreshTabLabel(C);
}
function tabSub(d,C){const shots=d.rows.filter(r=>!isBlock(r));const done=shots.filter(r=>r.done).length;
  if(C.shootT>0) return "wrap "+fmt(C.wrap); if(!shots.length) return "empty"; return done===shots.length?"shot":shots.length+" setups";}
function refreshTabLabel(C){const b=$("#dayTabs .daytab.on");if(!b)return;const sm=$("small",b);if(sm)sm.textContent=tabSub(D(),C)}
function renderStats(C){
  const d=D(); const st=$("#stats"); st.innerHTML=""; const w=$("#warnings"); w.innerHTML="";
  if(!d) return;
  const wrapT=wrapMin(d), callT=toMin(d.call||"09:00"); const over=C.wrap-wrapT;
  const shots=d.rows.filter(r=>!isBlock(r)); const done=shots.filter(r=>r.done).length;
  const takes=shots.reduce((a,r)=>a+(Number(r.takes)||0),0);
  const card=(k,v,sub,cls="")=>h("div",{class:"stat"},h("div",{class:"k"},k),h("div",{class:"v "+cls},v),sub?h("div",{class:"sub"},sub):null);
  const L=liveStatus(d,C);
  if(L){ const s=L.slip, po=Math.round(L.proj-wrapT), g=cfg();
    const cls=s<=0?"ok":po>=(Number(g.gateRed)||30)?"bad":po>=(Number(g.gateAmber)||10)?"warn":"";
    const c=card("Running",s===0?"On time":(s>0?"+":"-")+dur(Math.abs(s)),(s>0?"behind":s<0?"ahead":"")+" · projected wrap "+fmt(L.proj)+(po>0?" ("+dur(po)+" over)":""),cls); c.classList.add("live"); c.title=L.basis; st.append(c); }
  st.append(card("Calculated wrap",fmt(C.wrap),over>0?dur(over)+" over target":dur(-over)+" spare",over>0?"bad":"ok"),
    card("Day length",dur(C.wrap-callT),"call "+fmt(callT)+" → wrap"),
    card("Setup total",dur(C.setupT),Math.round(100*C.setupT/Math.max(1,C.setupT+C.shootT))+"% of working time"),
    card("Shooting total",dur(C.shootT)), card("Breaks / moves",dur(C.breakT)), ...(C.techT?[card("Tech / turnaround",dur(C.techT),"technical setups and resets")]:[]),
    card("Shots",String(shots.length-shots.filter(r=>r.cut).length),(done?done+" shot, "+(shots.length-done-shots.filter(r=>r.cut&&!r.done).length)+" to go":"none marked shot")+(shots.some(r=>r.cut)?" · "+shots.filter(r=>r.cut).length+" cut":"")),
    ...takeCards(d,card));
  if(d.origWrap) st.append(card("Original wrap",fmt(toMin(d.origWrap)),"as planned"));
  if(C.shootT>0&&!d.rows.some(r=>isBlock(r)&&/lunch/i.test(r.label||""))) w.append(h("span",{class:"pill"},"No lunch break scheduled - use + Add break / move"));
  if(dayStatus(d)==="wrapped"){const miss=linkNeeds(d).filter(n=>!isUrl(n.r[n.k])).length;if(miss)w.append(h("span",{class:"pill",style:"cursor:pointer",onclick:()=>{P.linksOpen=true;renderLinks();$("#links").scrollIntoView({behavior:"smooth",block:"center"})}},`${miss} hero / safety link${miss>1?"s":""} still needed`))}
  const zero=shots.filter(r=>effSetup(r,d)===0).length;
  if(C.shootT===0&&shots.length) w.append(h("span",{class:"pill info"},"No timings logged for this day yet - fill in Setup / Shoot minutes"));
  else if(zero) w.append(h("span",{class:"pill info"},zero+" shot"+(zero>1?"s have":" has")+" 0 min setup"));
  const noShoot=shots.filter(r=>!Number(r.shoot)).length;
  if(noShoot&&C.shootT>0) w.append(h("span",{class:"pill info"},noShoot+" shot"+(noShoot>1?"s have":" has")+" no shoot time"));
  if(d.kind==="capture"){const noAct=shots.filter(r=>!String(r.action||"").trim()).length; if(noAct) w.append(h("span",{class:"pill info"},noAct+" shot"+(noAct>1?"s have":" has")+" no Action, so the name uses the shot # only"))}
  const unnumbered=shots.filter(r=>!String(r.shot||"").trim()).length;
  if(unnumbered&&d.kind!=="capture") w.append(h("span",{class:"pill info"},unnumbered+" shot"+(unnumbered>1?"s":"")+" without a shot number"));
}
/* ===================== takes, captured seconds and pace ===================== */
// length of a timed take (cut), in ms
function takeMs(t){ if(Number(t.ms)>0) return Number(t.ms); const m=String(t.len||"").match(/^(\d+):(\d{2})$/); return t.out&&m?(+m[1]*60+ +m[2])*1000:0; }
function takeStats(d){ let takes=0,timed=0,ms=0,hero=0,heroMs=0,heroUntimed=0; for(const r of d.rows){ if(isBlock(r)||r.cut) continue; takes+=Number(r.takes)||0;
  for(const t of takeList(r)){ const x=takeMs(t); if(x>0){timed++;ms+=x} if(t.mark==="hero"){hero++; if(x>0) heroMs+=x; else heroUntimed++;} } } return {takes,timed,ms,hero,heroMs,heroUntimed}; }
function durSecs(ms){ const s=Math.round(ms/1000); return s<60?s+"s":s<3600?Math.floor(s/60)+"m "+String(s%60).padStart(2,"0")+"s":Math.floor(s/3600)+"h "+String(Math.floor(s/60)%60).padStart(2,"0")+"m"; }
function takeCards(d,card){
  const st=takeStats(d); if(!st.takes&&!st.timed&&d.kind!=="capture") return [];
  const label=d.kind==="capture"?"Captured":"Raw footage";
  const proj=live().reduce((a,x)=>a+takeStats(x).ms,0);
  return [card("Takes",String(st.takes),st.timed?st.timed+" timed with in / out":"logged on the slate or in Notes"),
    ...(st.timed?[card(label,durSecs(st.ms),`${Math.round(st.ms/1000)} seconds · avg ${durSecs(st.ms/st.timed)} a take`+(proj>st.ms?` · project ${durSecs(proj)}`:""))]:[]),
    // Mocap: how much of the capture is hero selects
    ...(d.kind==="capture"&&st.hero?[card("Hero selects",durSecs(st.heroMs),`${Math.round(st.heroMs/1000)} seconds · ${st.hero} hero take${st.hero===1?"":"s"}`+(st.ms?` · ${Math.round(st.heroMs/st.ms*100)}% of captured`:"")+(st.heroUntimed?` · ${st.heroUntimed} not timed`:""))]:[])];
}
// how each finished shot did against the plan: minutes won back (+) or lost (-), and the streak of shots that held pace
function paceData(d,C){
  const L=liveStatus(d,C); const done=d.rows.filter(r=>!isBlock(r)&&!r.cut&&r.done&&r.doneAt!=null&&C.rows[r.id]);
  if(!L&&!done.length) return null;
  let prevSlip=0; const shots=done.map(r=>{const slip=r.doneAt-C.rows[r.id].end; const gain=Math.round(prevSlip-slip); prevSlip=slip; return {r,slip:Math.round(slip),gain}});
  let streak=0; for(let i=shots.length-1;i>=0&&shots[i].gain>=0;i--) streak++;
  let best=0,run=0; for(const s of shots){run=s.gain>=0?run+1:0;best=Math.max(best,run)}
  const slip=L?L.slip:(shots.length?shots[shots.length-1].slip:0);
  const target=wrapMin(d), proj=L?L.proj:C.wrap+slip;
  return {live:!!L,slip,shots,streak,best,proj,target,over:Math.round(proj-target),won:shots.filter(s=>s.gain>0).reduce((a,s)=>a+s.gain,0),lost:shots.filter(s=>s.gain<0).reduce((a,s)=>a-s.gain,0)};
}
function renderPace(C){
  const box=$("#pace"); if(!box) return; box.innerHTML=""; box.className="pace noprint"; const d=D(); if(!d||P.showPace===false) return;
  const p=paceData(d,C); if(!p) return;
  const s=p.slip, mood=s<=-5?"ahead":s<=2?"ontrack":s<=15?"slipping":"behind";
  box.classList.add("on","mood-"+mood);
  const words={ahead:"Ahead of schedule",ontrack:"On track",slipping:"Slipping",behind:"Behind"}[mood];
  // the bar: where today wraps against the target, from 60 min early to 60 min late
  const pos=Math.max(0,Math.min(100,50+p.over/60*50));
  const big=h("div",{class:"pacebig"},h("div",{class:"pacenum"},s===0?"±0":(s>0?"+":"−")+dur(Math.abs(s))),h("div",{class:"pacewords"},h("b",{},words),h("span",{},p.live?"live":"final")));
  const bar=h("div",{class:"pacebar",title:"Projected wrap against the target wrap"},h("div",{class:"pacezone"}),h("div",{class:"pacemark",style:`left:${pos}%`}),h("div",{class:"pacetarget"}),
    h("div",{class:"pacebarlbl"},h("span",{},"wrap early"),h("span",{},(p.live?"projected ":"wrapped ")+fmt(p.proj)+(p.over?` (${p.over>0?"+":"−"}${dur(Math.abs(p.over))})`:" (on target)")),h("span",{},"wrap late")));
  const facts=h("div",{class:"pacefacts"},
    h("div",{},h("b",{},String(p.streak)),h("small",{},p.streak===1?"shot on pace":"shots on pace in a row")),
    h("div",{},h("b",{},String(p.best)),h("small",{},"best streak today")),
    h("div",{},h("b",{class:"good"},"+"+dur(p.won)),h("small",{},"won back")),
    h("div",{},h("b",{class:"bad"},"−"+dur(p.lost)),h("small",{},"lost")));
  const chips=h("div",{class:"pacechips"});
  for(const x of p.shots.slice(-14)) chips.append(h("span",{class:"pchip "+(x.gain>0?"won":x.gain<0?"lost":"even"),title:`Shot ${x.r.shot||""}: ${x.gain>0?"won back "+dur(x.gain):x.gain<0?"lost "+dur(-x.gain):"on the plan"}; finished ${x.slip>0?dur(x.slip)+" late":x.slip<0?dur(-x.slip)+" early":"on time"}`},
    h("b",{},x.r.shot||"·"),h("small",{},x.gain>0?"+"+x.gain:x.gain<0?String(x.gain):"0")));
  if(!p.shots.length) chips.append(h("span",{class:"note"},"Tick shots as they finish to see each one's score here."));
  box.append(big,h("div",{class:"pacemid"},bar,chips),facts);
}

/* ===================== running delta and the recovery plan ===================== */
function nowMin(){const n=new Date();return n.getHours()*60+n.getMinutes()+n.getSeconds()/60}
// the time now on this day's clock, or null when it isn't this day; after midnight a night shoot carries on (24:30)
function dayClock(d){
  if(!d||!d.date) return null; const n=nowMin();
  if(d.date===todayISO()) return n;
  const y=new Date(Date.now()-864e5), yISO=y.getFullYear()+"-"+String(y.getMonth()+1).padStart(2,"0")+"-"+String(y.getDate()).padStart(2,"0");
  if(d.date===yISO&&n<12*60&&wrapMin(d)>1440) return n+1440;
  return null;
}
// how far ahead (-) or behind (+) the day is running, from when shots were ticked off and where the clock is now
function liveStatus(d,C){
  const now=dayClock(d); if(now==null) return null;
  const call=toMin(d.call||"09:00"); if(now<call-60) return null;
  const rows=d.rows.filter(r=>!r.cut);
  let li=-1; rows.forEach((r,i)=>{if(!isBlock(r)&&r.done)li=i});
  const last=li>=0?rows[li]:null, next=rows.slice(li+1).find(r=>!isBlock(r)&&!r.done)||null;
  let slip, basis;
  if(last&&last.doneAt!=null){slip=last.doneAt-C.rows[last.id].end;basis=`shot ${last.shot||last.action||""} finished at ${fmt(last.doneAt)}, planned ${fmt(C.rows[last.id].end)}`.replace("shot  ","shot ")}
  else if(next){slip=Math.min(0,now-C.rows[next.id].setupStart);basis=slip<0?"next shot isn't due to start until "+fmt(C.rows[next.id].setupStart):"on the shot that's due now"}
  else {slip=0;basis="every shot is ticked"}
  if(next){const late=now-C.rows[next.id].end; if(late>slip){slip=late;basis=`shot ${next.shot||next.action||""} was due to finish at ${fmt(C.rows[next.id].end)}`}}
  slip=Math.round(slip);
  return {slip,basis,now,next,proj:C.wrap+slip};
}
function prioWeight(p){const o=priorityOptions(),i=o.indexOf(String(p||"").trim());return i<0?(o.length+1)/2:o.length-i}
function durSec(v){const n=parseFloat(String(v||"").replace(",","."));return isNaN(n)?0:n}
function buildPlan(d,C){
  const L=liveStatus(d,C), target=wrapMin(d), proj=L?L.proj:C.wrap, need=Math.round(proj-target);
  const c=cfg(), amber=Number(c.gateAmber)||10, red=Number(c.gateRed)||30;
  const gate=need<=0?"green":need>=red?"red":need>=amber?"amber":"slight";
  const top=priorityOptions()[0];
  const pool=d.rows.filter(r=>!isBlock(r)&&!r.done&&!r.cut&&!(L&&L.next&&L.next.id===r.id));
  const cost=r=>Math.round(effSetup(r,d)+effShoot(r,d));
  // cut first: most minutes for the least priority and screen time
  const score=r=>cost(r)/(Math.pow(prioWeight(r.priority),2)*(1+Math.min(durSec(r.duration),60)/60));
  const ranked=pool.filter(r=>cost(r)>0).sort((a,b)=>score(b)-score(a));
  const cuts=[]; let got=0;
  if(need>0){
    for(const r of ranked){ if(got>=need) break; if(top&&String(r.priority).trim()===top) continue; cuts.push({r,save:cost(r)}); got+=cost(r); }
    for(const r of ranked){ if(got>=need) break; if(!(top&&String(r.priority).trim()===top)) continue; cuts.push({r,save:cost(r),last:true}); got+=cost(r); }
  }
  // wins: a shot that returns to a location already set up earlier can move next to it and skip most of its setup
  const wins=[]; const minEff=Math.max(0,Number(d.minSetup)||0)*(Number(d.setupPct)||100)/100;
  const rem=d.rows.filter(r=>!r.done&&!r.cut);
  rem.forEach((r,i)=>{ if(isBlock(r)||!String(r.location||"").trim()) return;
    const loc=normLoc(r.location), prev=rem.slice(0,i).reverse().find(x=>!isBlock(x));
    if(prev&&normLoc(prev.location)===loc) return;
    const anchor=rem.slice(0,i).reverse().find(x=>!isBlock(x)&&normLoc(x.location)===loc);
    const save=Math.round(effSetup(r,d)-minEff); if(anchor&&save>=5) wins.push({r,anchor,save});
  });
  wins.sort((a,b)=>b.save-a.save);
  const spare=-need, restorable=d.rows.filter(r=>r.cut).map(r=>({r,cost:Math.round(effSetup(r,d)+effShoot(r,d))})).filter(x=>x.cost<=Math.max(0,spare)).sort((a,b)=>prioWeight(b.r.priority)-prioWeight(a.r.priority));
  return {L,need,gate,cuts,got,wins:wins.slice(0,4),spare,restorable,amber,red};
}
function normLoc(s){return String(s||"").toLowerCase().replace(/\s+/g," ").trim()}
function rowLabel(r){return (r.shot?"Shot "+r.shot:"")+(r.action?(r.shot?" · ":"")+r.action:"")||(r.description?String(r.description).slice(0,40):"Untitled shot")}
function setCut(ids,on){const d=D();if(!d)return;for(const id of ids){const r=d.rows.find(x=>x.id===id);if(r)r.cut=on?true:null}commit();renderBody();toast(on?(ids.length>1?`Cut ${ids.length} shots`:"Cut from the schedule")+" - Undo or Restore brings it back":"Back in the schedule")}
function applyWin(id,anchorId){const d=D();const i=d.rows.findIndex(x=>x.id===id);if(i<0)return;const [r]=d.rows.splice(i,1);const a=d.rows.findIndex(x=>x.id===anchorId);r.setup=0;d.rows.splice(a+1,0,r);commit();renderBody();jump(r.id);toast("Moved next to the same location, setup down to the minimum - Undo to go back")}
function renderPlan(C){
  const box=$("#plan"); if(!box) return; box.innerHTML=""; const d=D(); if(!d||!d.rows.some(r=>!isBlock(r))) return;
  const p=buildPlan(d,C);
  const show=p.need>0||p.wins.length||(p.restorable.length&&p.spare>=p.amber)||d.rows.some(r=>r.cut);
  if(!show) return;
  const head={green:p.spare>0?`${dur(p.spare)} in hand`:"On target",slight:`${dur(p.need)} over target wrap`,amber:`Amber gate: ${dur(p.need)} over target wrap`,red:`Red gate: ${dur(p.need)} over target wrap`}[p.gate];
  const sub={green:"Nothing needs cutting.",slight:"Within the amber gate. Keep an eye on it.",amber:"Worth deciding now what could go.",red:"Cut something to wrap on time."}[p.gate];
  const open=P.planOpen!==false;
  box.className="plan noprint gate-"+p.gate;
  const tg=h("button",{class:"planhead",onclick:()=>{P.planOpen=!open;savePrefs();renderPlan(compute())}},h("b",{},"Recovery plan · "+head),h("span",{class:"note"},(p.L?"Live: ":"Plan: ")+sub),h("span",{},open?"▴":"▾"));
  box.append(tg); if(!open) return;
  const body=h("div",{class:"planbody"}); box.append(body);
  const shotBtn=r=>h("a",{href:"#",onclick:e=>{e.preventDefault();jump(r.id)}},rowLabel(r));
  if(p.cuts.length){
    const enough=p.got>=p.need;
    body.append(h("div",{class:"planh"},`Shots to consider cutting (${enough?"together they save "+dur(p.got):"all of these only save "+dur(p.got)+" of the "+dur(p.need)+" needed"})`));
    const ul=h("ul",{});
    p.cuts.forEach(x=>ul.append(h("li",{},shotBtn(x.r),h("span",{class:"note"},` · ${x.r.priority||"no priority"} · ${dur(x.save)} of setup and shooting${durSec(x.r.duration)?` · ${x.r.duration} on screen`:""}${x.last?" · top priority, last resort":""}`),h("button",{class:"btn small",onclick:()=>setCut([x.r.id],true)},"Cut"),h("button",{class:"btn small",title:"Move it to another day instead",onclick:()=>openMove([x.r.id])},"Move…"))));
    body.append(ul,h("button",{class:"btn small danger",onclick:()=>setCut(p.cuts.filter(x=>!x.last).map(x=>x.r.id),true)},"Cut the suggested shots"));
    body.append(h("p",{class:"note"},"Ranked by time it takes against priority and screen time: low priority, long setups and short screen time go first. Top priority shots are only listed as a last resort. Cutting takes the shot out of the timings; nothing is deleted."));
  }
  if(p.wins.length){
    body.append(h("div",{class:"planh"},"Possible wins"));
    const ul=h("ul",{});
    p.wins.forEach(x=>ul.append(h("li",{},shotBtn(x.r),h("span",{class:"note"},` goes back to ${x.r.location}. Shoot it straight after `),shotBtn(x.anchor),h("span",{class:"note"},` and skip most of its setup: saves about ${dur(x.save)}.`),h("button",{class:"btn small",onclick:()=>applyWin(x.r.id,x.anchor.id)},"Move it"))));
    body.append(ul);
  }
  const cut=d.rows.filter(r=>r.cut);
  if(cut.length){
    body.append(h("div",{class:"planh"},`Cut (${cut.length})`+(p.spare>0?` · ${dur(p.spare)} in hand`:"")));
    const ul=h("ul",{});
    cut.forEach(r=>{const cst=Math.round(effSetup(r,d)+effShoot(r,d));ul.append(h("li",{},shotBtn(r),h("span",{class:"note"},` · ${r.priority||"no priority"} · ${dur(cst)}${p.spare>=cst?" · fits in the time in hand":""}`),h("button",{class:"btn small",onclick:()=>setCut([r.id],false)},"Restore")))});
    body.append(ul);
  }
  if(p.L) body.append(h("p",{class:"note"},"Running "+(p.L.slip>0?dur(p.L.slip)+" behind":p.L.slip<0?dur(-p.L.slip)+" ahead":"on time")+": "+p.L.basis+". Projected wrap "+fmt(p.L.proj)+"."));
}
/* ===================== hero / safety links on wrapped days ===================== */
function isHero(r){return !isBlock(r)&&!r.cut&&(String(r.hero||"").trim()!==""||/\bhero\s*:\s*t?\d/i.test(String(r.director||"")))}
function isSafety(r){return !isBlock(r)&&!r.cut&&(String(r.safety||"").trim()!==""||/\bsafety\s*:\s*t?\d/i.test(String(r.director||"")))}
function linkNeeds(d){const out=[];for(const r of d.rows){if(isHero(r))out.push({r,k:"heroUrl",what:"Hero"});if(isSafety(r))out.push({r,k:"safetyUrl",what:"Safety"})}return out}
function takeNote(r,what){const f=String(r[what.toLowerCase()]||"").trim();if(f&&!/^x$/i.test(f))return f;const m=String(r.director||"").match(new RegExp(what+"\\s*:\\s*([^.\\n]+)","i"));return m?m[1].trim():""}
const linkAsked=new Set();
function renderLinks(){
  const box=$("#links"); if(!box) return; box.innerHTML=""; box.className="plan noprint"; const d=D();
  if(!d||dayStatus(d)!=="wrapped") return;
  const needs=linkNeeds(d); if(!needs.length) return;
  const missing=needs.filter(n=>!isUrl(n.r[n.k]));
  box.classList.add(missing.length?"gate-amber":"gate-green");
  if(missing.length&&!linkAsked.has(d.id)){linkAsked.add(d.id);toast(`${d.name} is wrapped: add links for ${missing.length} hero / safety take${missing.length>1?"s":""} (below the summary)`)}
  const open=P.linksOpen!==false;
  box.append(h("button",{class:"planhead",onclick:()=>{P.linksOpen=!open;savePrefs();renderLinks()}},
    h("b",{},"Hero / safety links · "+(missing.length?`${missing.length} of ${needs.length} still needed`:`all ${needs.length} added`)),
    h("span",{class:"note"},"Wrapped day: paste a link to the file for each hero and safety take (Google Drive or similar)."),h("span",{},open?"▴":"▾")));
  if(!open) return;
  const body=h("div",{class:"planbody"}); const t=h("table",{class:"plain linktable"});
  t.append(h("thead",{},h("tr",{},h("th",{},"Shot"),h("th",{},"Take"),h("th",{},"Link"))));
  const tb=h("tbody",{});
  for(const n of needs){
    const i=h("input",{type:"url",placeholder:"https://drive.google.com/...",value:n.r[n.k]||"",spellcheck:"false"});
    const a=h("a",{target:"_blank",rel:"noopener noreferrer",class:"urlopen",title:"Open the link"},"↗");
    const upd=()=>{const v=i.value.trim();a.href=isUrl(v)?v:"#";a.style.visibility=isUrl(v)?"visible":"hidden";i.classList.toggle("bad",!!v&&!isUrl(v))};upd();
    i.addEventListener("input",()=>{const x=R(n.r.id);if(!x)return;x[n.k]=i.value.trim();upd();softCommit()});
    i.addEventListener("change",()=>{commit();renderStats(compute());const el=$(`#grid tbody tr[data-id="${n.r.id}"] [data-k="${n.k}"]`);if(el&&document.activeElement!==el)el.value=n.r[n.k]||"";setTimeout(renderLinks,0)});
    const tk=takeNote(n.r,n.what);
    tb.append(h("tr",{class:isUrl(n.r[n.k])?"":"need"},h("td",{},h("a",{href:"#",onclick:e=>{e.preventDefault();jump(n.r.id)}},rowLabel(n.r))),h("td",{},h("b",{},n.what),tk?" "+tk:""),h("td",{},h("div",{class:"urlcell"},i,a))));
  }
  t.append(tb); body.append(t,h("p",{class:"note"},"Shared with the team. The links also show in the Hero link and Safety link columns, and go into the CSV and .xlsx exports. A shot counts as hero or safety when its Hero or Safety column is filled in, or its notes say e.g. \"Hero: T3\"."));
  box.append(body);
}
setInterval(()=>{ if(!S||document.hidden) return; const d=D(); if(d&&dayClock(d)!=null){const C=compute();renderStats(C);renderPace(C);renderTimeline(C);renderPlan(C)} },30000);
/* ===================== help: contents and search ===================== */
function buildHelpNav(){
  const body=$("#helpBody"), toc=$("#helpToc"); if(!body||!toc||body.dataset.built) return; body.dataset.built="1";
  const slug=t=>"help-"+t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  for(const h3 of $$("h3",body)){ if(h3.closest("section")) continue;
    const sec=h("section",{id:slug(h3.textContent)}); h3.before(sec); let n=h3; const move=[];
    while(n&&!(n!==h3&&n.tagName==="H3")){move.push(n);n=n.nextElementSibling}
    move.forEach(x=>sec.append(x)); }
  for(const sec of $$("section",body)){ const t=$("h3",sec).textContent;
    toc.append(h("a",{href:"#"+sec.id,onclick:e=>{e.preventDefault();$("#helpSearch").value="";filterHelp("");sec.scrollIntoView({behavior:"smooth",block:"start"})}},t)); }
  $("#helpSearch").addEventListener("input",e=>filterHelp(e.target.value));
}
function filterHelp(q){
  const words=q.toLowerCase().split(/\s+/).filter(Boolean); let shown=0;
  for(const sec of $$("#helpBody section")){ const hit=!words.length||words.every(w=>sec.textContent.toLowerCase().includes(w)); sec.style.display=hit?"":"none"; if(hit)shown++;
    const a=$(`#helpToc a[href="#${sec.id}"]`); if(a) a.classList.toggle("dim",!hit); }
  if(words.length) $("#changelog").classList.add("all");
  $("#helpNone").style.display=shown?"none":"";
}
/* ===================== share / invite ===================== */
function projectLink(){return location.origin+location.pathname+"?p="+encodeURIComponent(pid())}
function openShare(){
  const b=$("#shareBody"); b.innerHTML="";
  if(MODE!=="team"){
    b.append(h("p",{},"This copy is only saved in this browser, so there's no shared link to send."),
      h("p",{class:"note"},"To work with someone: open the team site and invite them from there. Or send them a copy: Settings > Projects > Export project file, which they can import."),
      h("div",{class:"toolbar"},h("button",{class:"btn",onclick:()=>{$("#shareModal").classList.remove("open");openSettings("projects")}},"Go to Projects")));
    $("#shareModal").classList.add("open"); return;
  }
  const f=h("div",{class:"form"});
  const who=h("input",{placeholder:"e.g. Sam"}), role=h("input",{placeholder:"e.g. DIT"}), email=h("input",{type:"email",placeholder:"name@example.com"});
  const pw=h("input",{type:"password",placeholder:"Only if you choose to include it",autocomplete:"off"});
  const incPw=h("input",{type:"checkbox"}), incKey=h("input",{type:"checkbox"}), incPk=h("input",{type:"checkbox"}), addCrew=h("input",{type:"checkbox"});
  const pkey=KEYS[pid()]||"";
  const link=h("input",{readonly:true,value:projectLink()});
  const msg=h("textarea",{});
  const pwRow=h("label",{},"Site password (not saved anywhere)",pw); pwRow.style.display="none";
  const build=()=>{
    const name=who.value.trim(), proj=S.project.name||"our shoot";
    const lines=[`Hi${name?" "+name:""},`,"",`You're invited to the ${proj} shot list and schedule. Everyone on the team edits the same live version.`,"",`Open it here: ${projectLink()}`,""];
    lines.push(incPw.checked&&pw.value?`Site password: ${pw.value}`:"The site is password protected. I'll send you the password separately.");
    if(PROJECT_KEYS) lines.push(incPk.checked&&pkey?`Project key (enter it when it asks): ${pkey}`:"It also asks for a project key, which I'll send separately.");
    if(NEEDS_KEY) lines.push(incKey.checked&&P.teamKey?`Team key (asked for when you join): ${P.teamKey}`:"It also asks for a team key when you join. I'll send that separately too.");
    lines.push("","When it opens, add your name so the team can see who's editing. On a phone or tablet, Share > Add to Home Screen makes it open like an app.","",`Thanks${S.project.lead?", "+S.project.lead:""}`);
    msg.value=lines.join("\n");
    pwRow.style.display=incPw.checked?"":"none";
  };
  [who,pw].forEach(x=>x.addEventListener("input",build)); [incPw,incKey,incPk].forEach(x=>x.addEventListener("change",build));
  f.append(h("label",{},"Link to this project",h("div",{class:"sharelink"},link,h("button",{class:"btn small",onclick:async()=>{toast(await copyText(projectLink())?"Link copied":"Select the link and copy it")}},"Copy link"))),
    h("label",{},"Their name (for the message)",who));
  b.append(f,
    h("div",{class:"safety"},h("b",{},"Safest: "),"send the link and the password"+(PROJECT_KEYS?" and project key":"")+" in different ways, e.g. the link by email and the password by text or in person. If one message holds both, anyone who sees it (a forward, a shared screen, a hacked inbox) can get in. If you include them, send it only to that person directly, and change the Netlify password when people leave the production."),
    PROJECT_KEYS?(pkey?h("div",{class:"form"},h("label",{},"Project key (only opens this project)",h("div",{class:"sharelink"},h("input",{readonly:true,value:pkey}),h("button",{class:"btn small",onclick:async()=>toast(await copyText(pkey)?"Key copied":"Couldn't copy")},"Copy key"))))
      :h("div",{class:"safety"},h("b",{},"No project key yet: "),"only the admin can open this project. Create its key in Settings > Projects, then share it.")):null,
    h("div",{class:"form"},PROJECT_KEYS&&pkey?h("label",{class:"inline"},incPk,"Include the project key in the message"):null,h("label",{class:"inline"},incPw,"Include the site password in the message"),pwRow,
      NEEDS_KEY?h("label",{class:"inline"},incKey,"Include the team key in the message"):h("span",{}),
      h("label",{class:"inline"},addCrew,"Also add them to Cast & crew"),
      h("div",{class:"form",style:"display:none",id:"shareCrew"},h("label",{},"Role",role),h("label",{},"Email",email)),
      h("label",{},"Message",msg)));
  addCrew.addEventListener("change",()=>{$("#shareCrew").style.display=addCrew.checked?"":"none"});
  const addPerson=()=>{if(!addCrew.checked||!who.value.trim())return;if(S.people.some(p=>p.name.trim().toLowerCase()===who.value.trim().toLowerCase()))return;S.people.push({id:uid("p"),group:"Crew",name:who.value.trim(),role:role.value.trim(),phone:"",email:email.value.trim(),notes:"Invited "+todayISO()});commit();toast("Added "+who.value.trim()+" to Cast & crew")};
  const subject=()=>`Invite: ${S.project.name||"shot list"} schedule`;
  const tb=h("div",{class:"toolbar"},
    h("button",{class:"btn primary",onclick:async()=>{addPerson();toast(await copyText(msg.value)?"Invite copied - paste it into an email or message":"Select the message and copy it")}},"Copy invite"),
    h("button",{class:"btn",onclick:()=>{addPerson();location.href=`mailto:${encodeURIComponent(email.value.trim())}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(msg.value)}`}},"Email"));
  if(navigator.share) tb.append(h("button",{class:"btn",onclick:async()=>{addPerson();try{await navigator.share({title:subject(),text:msg.value})}catch(e){}}},"Share…"));
  b.append(tb,h("p",{class:"note"},"The link opens this project. They'll need the site password, and their own name when they join. Nothing here changes who can get in: that's the Netlify password (and the team key, if you set one)."));
  build(); $("#shareModal").classList.add("open"); setTimeout(()=>who.focus(),50);
}
// a key typed by the user: a project key, or the admin key
async function useKey(k){
  k=String(k||"").trim(); if(!k) return false;
  try{ const r=await redeemKey(k); P.projectId=r.id; savePrefs(); return r; }
  catch(e){ if(e.status!==404) throw e; }
  // not a project key: is it the admin key?
  try{ const r=await fetch("/api/ping",{cache:"no-store",headers:{"x-admin-key":k}}); const j=await r.json(); if(j&&j.admin){ setAdminKey(k); IS_ADMIN=true; toast("Admin key saved on this device: you can open every project"); return {admin:true}; } }catch(e){}
  return false;
}
// this device can't open a project: it never had the key, or the key was changed
function projectLocked(id){
  clearTimeout(syncTimer); clearTimeout(flushTimer);
  const had=!!KEYS[id];
  if(had) forgetLocal(id);
  showKeyPrompt(id, had?"The key for this project has changed, so it's been taken off this device. Enter the new key from whoever runs the project.":"This project needs its project key. Ask whoever runs the project for it.");
}
function showKeyPrompt(id,msg){
  $("#keyMsg").textContent=msg; $("#keyInput").value=""; $("#keyErr").textContent="";
  const others=projects.filter(p=>!p.archived&&p.id!==id);
  const ol=$("#keyOthers"); ol.innerHTML="";
  if(others.length){ ol.append(h("span",{class:"note"},"Or open: ")); others.forEach(p=>ol.append(h("button",{class:"btn small",onclick:async()=>{$("#keyModal").classList.remove("open");await openProject(p.id)}},p.name||p.id))); }
  // nothing from a project you can't open stays on screen
  if(!id||(S&&P.projectId===id)){ S=null; base=null; pending=[]; $("#grid tbody")&&($("#grid tbody").innerHTML=""); }
  document.body.classList.add("keylocked"); document.title="Shotlist Scheduler";
  $("#keyModal").classList.add("open"); setTimeout(()=>$("#keyInput").focus(),50);
}
async function submitKey(){
  $("#keyErr").textContent="Checking…";
  try{ const r=await useKey($("#keyInput").value); if(!r){$("#keyErr").textContent="That key doesn't match a project. Check it with whoever sent it.";return}
    $("#keyModal").classList.remove("open"); $("#keyErr").textContent="";
    await loadProjects(); if(r.id){await openProject(r.id);toast("Opened "+r.name)} else await startTeam();
  }catch(e){$("#keyErr").textContent=e.message}
}
// the project list (Settings > Projects, the key prompt) keeps its own copy of each project's name: keep it in step
let nameSynced={};
async function syncProjectName(force){
  if(!S||!pid()) return; const name=(S.project.name||"").trim()||"Untitled project"; const id=pid();
  const entry=projects.find(p=>p.id===id);
  if(MODE==="local"){ if(entry&&entry.name!==name){entry.name=name;lsSet("shotlist2-projects",projects)} return; }
  if(!force&&(nameSynced[id]===name||!entry||entry.name===name)) return;
  nameSynced[id]=name;
  try{ await api("/api/projects",{action:"rename",id,name},{noProject:true}); if(entry) entry.name=name; }catch(e){ delete nameSynced[id]; }
}
function renderTimeline(C){
  const d=D(); const tl=$("#timeline"); tl.innerHTML=""; if(!d) return;
  const start=toMin(d.call||"09:00"), end=Math.max(C.wrap,wrapMin(d))+15;
  const span=Math.max(60,end-start); const pct=m=>((m-start)/span*100)+"%";
  const pxHr=(tl.clientWidth||800)/span*60, every=pxHr<26?180:pxHr<46?120:60;
  for(let hr=Math.ceil(start/60)*60;hr<=end;hr+=60){if(hr%every){tl.append(h("div",{class:"tickline",style:"left:"+pct(hr)}));continue}const f=(hr-start)/span;tl.append(h("div",{class:"tickline",style:"left:"+pct(hr)}),h("div",{class:"tick"+(f<0.04?" first":f>0.96?" last":""),style:"left:"+pct(hr)},fmt(hr)))}
  const wrapT=wrapMin(d);
  for(const r of d.rows){
    const c=C.rows[r.id]; const name=isBlock(r)?blockName(r):("Shot "+(r.shot||r.action||"-"));
    if(c.su>0){const s=h("div",{class:"seg setup",style:`left:${pct(c.setupStart)};width:${c.su/span*100}%`,title:`${name} - setup ${fmt(c.setupStart)} to ${fmt(c.start)}`});s.onclick=()=>jump(r.id);tl.append(s)}
    if(c.sh>0){const s=h("div",{class:"seg "+(r.type==="tech"?"tech":isBlock(r)?"break":"shoot")+(c.end>wrapT?" over":""),style:`left:${pct(c.start)};width:${c.sh/span*100}%;border-left:1px solid var(--panel)`,title:`${name} - ${fmt(c.start)} to ${fmt(c.end)}`});s.onclick=()=>jump(r.id);tl.append(s)}
  }
  tl.append(h("div",{class:"wrapline",style:"left:"+pct(wrapT),title:"Target wrap "+fmt(wrapT)}));
  { const n=dayClock(d);if(n!=null&&n>=start&&n<=end)tl.append(h("div",{class:"nowline",style:"left:"+pct(n),title:"Now "+fmt(n)}))}
}
function jump(id){const tr=$(`#grid tbody tr[data-id="${id}"]`);if(!tr)return;tr.scrollIntoView({behavior:"smooth",block:"center"});tr.style.outline="2px solid var(--accent)";setTimeout(()=>tr.style.outline="",1200)}
// columns with nothing in them on any day of this kind (Live Action or Mocap); worked-out columns always count as in use
function unusedCols(){
  const k=kind(), rows=live().filter(d=>(d.kind==="capture"?"capture":"schedule")===k).flatMap(d=>d.rows.filter(r=>!isBlock(r)));
  const ALWAYS=["shotId","setup","start","shoot","end"];
  const has=(r,key)=>{ if(key==="refs") return !!(r.ref1||r.ref2||r.ref3); if(key==="orig") return !!r.origStart; if(key==="takes") return Number(r.takes)>0||takeList(r).length>0;
    const v=r[key]; if(v==null) return false; if(typeof v==="boolean") return v; if(typeof v==="number") return v!==0; const t=String(v).trim(); return !!t&&!/^(false|0|-)$/i.test(t); };
  return cols().filter(c=>!c.fixed&&!ALWAYS.includes(c.key)).map(c=>c.key).filter(key=>!rows.some(r=>has(r,key)));
}
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
  const unused=unusedCols();
  p.append(h("div",{class:"toolbar",style:"margin-top:.3rem"},
    h("button",{class:"btn small",disabled:!unused.filter(k=>!hid.includes(k)).length,title:`Hide every column that's empty on all ${kind()==="capture"?"Mocap":"Live Action"} days`,onclick:()=>{const H=hidden();const add=unusedCols().filter(k=>!H.includes(k));H.push(...add);savePrefs();renderCols();renderHead();renderBody();toast(`Hid ${add.length} empty column${add.length===1?"":"s"}`)}},`Hide all not in use${unused.filter(k=>!hid.includes(k)).length?" ("+unused.filter(k=>!hid.includes(k)).length+")":""}`),
    h("button",{class:"btn small",disabled:!hid.length,onclick:()=>{P.hiddenBy[kind()]=[];savePrefs();renderCols();renderHead();renderBody()}},"Show all")));
  p.append(h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:()=>{P.hiddenBy[kind()]=clone(HIDDEN_DEFAULT[kind()]||[]);savePrefs();renderCols();renderHead();renderBody()}},"Reset shown columns"),
    h("button",{class:"btn small",onclick:()=>{P.colOrder=[];savePrefs();invalidateCols();renderCols();renderHead();renderBody();toast("Columns back in their usual order")}},"Reset column order")));
}
function renderDayTabs(){
  const bar=$("#dayTabs"); bar.innerHTML="";
  const {ready,wrapped}=tabOrder(); const cur=D();
  const tab=d=>{
    const st=dayStatus(d), auto=!d.status;
    const b=h("button",{class:"daytab"+(st==="wrapped"?" wrapped":"")+(cur&&d.id===cur.id?" on":""),title:`${d.name||"Day"} · ${d.date||"no date"} · ${d.rows.filter(r=>!isBlock(r)).length} setups · ${st==="wrapped"?"Wrapped":"Ready to roll"}${auto?" (auto)":""}`},
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
  for(const d of arch) l.append(h("div",{class:"toolbar"},h("span",{},h("b",{},d.name||"Day")," ",h("span",{class:"note"},`${d.date||"no date"} · ${d.rows.filter(r=>!isBlock(r)).length} setups`)),
    h("button",{class:"btn small primary",onclick:()=>{d.archived=null;P.activeByProject[pid()]=d.id;commit();savePrefs();renderAll();renderArchived();if(!S.days.some(x=>x.archived))$("#archModal").classList.remove("open");toast("Restored "+d.name)}},"Restore")));
}
function renderSettingsRow(){
  const d=D(); $("#dayControls").style.display=d?"":"none"; if(!d) return;
  const set=(id,v)=>{const el=$("#"+id);if(document.activeElement!==el)el.value=v??""};
  set("dayName",d.name); set("dayKind",d.kind||"schedule"); set("dayStatus",d.status||"");
  { const o=$("#dayStatus option[value='']"); if(o) o.textContent="Auto ("+(dayStatus(Object.assign({},d,{status:""}))==="wrapped"?"Wrapped":"Ready to roll")+")"; } set("dayNo",d.dayNo||(dayIndex(d)+1)); set("shootDate",d.date);
  set("callTime",d.call); set("wrapTime",d.wrap); set("setupPct",d.setupPct); set("shootPct",d.shootPct); set("minSetup",d.minSetup); set("viewMode",P.view||"all"); renderPrioFilter();
  $("#bandSummary").textContent=`${d.name||"Day"} · call ${fmt(toMin(d.call||"09:00"))} · wrap ${fmt(toMin(d.wrap||"18:00"))}`;
  $("#projTitle").textContent=S.project.name||"Untitled project";
  if(!syncProjectName._t) syncProjectName._t=setTimeout(()=>{syncProjectName._t=null;syncProjectName(false)},1500); document.title=(S.project.name||"Shotlist")+" - Shotlist Scheduler";
}
function renderAll(){ if(!S) return; invalidateCols(); renderDayTabs(); renderSettingsRow(); renderCols(); renderHead(); renderBody(); applyFreeze(); renderSky(); rebuildDoc(); }
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
  const c=cfg(); const d=D(); const prev=[...d.rows].reverse().find(r=>!isBlock(r))||{};
  const r={id:uid("r"),type:"shot",shot:"",label:"",duration:"",setup:c.newSetup,shoot:c.newShoot,origStart:"",origSetup:0,origShoot:0,
    location:prev.location||"",description:"",script:"",shotType:"",camera:"",lighting:"",vfx:"",director:"",props:"",ref1:"",ref2:"",ref3:"",done:false,
    priority:"",perfCount:d.kind==="capture"?(prev.perfCount||1):"",performers:d.kind==="capture"?(prev.performers||""):"",genre:"",action:"",body:d.kind==="capture",face:false,glove:false,hero:"",safety:"",takes:0,takeLog:null};
  return Object.assign(r,extra);
}
function addShot(){const d=D();if(!d||frozenNo())return;const r=newShot();d.rows.push(r);commit();renderBody();jump(r.id);const el=$(`#grid tbody tr[data-id="${r.id}"] [data-k="${d.kind==="capture"?"action":"shot"}"]`);if(el)el.focus()}
function insertBreakAt(i,type="break"){if(frozenNo())return;const c=cfg();const d=D();const tech=type==="tech";const r={id:uid("r"),type:tech?"tech":"break",label:tech?(c.techLabel||"Tech / turnaround"):(c.breakLabel||"Break"),shoot:Number(tech?c.techMin:c.breakMin)||(tech?15:30),setup:0,description:"",origStart:"",done:false,takes:0};d.rows.splice(i,0,r);commit();renderBody();jump(r.id)}
function insertTechAfter(id){const i=D().rows.findIndex(x=>x.id===id);insertBreakAt(i+1,"tech")}
function insertBreakAfter(id){const i=D().rows.findIndex(x=>x.id===id);insertBreakAt(i+1)}
function move(id,dir){if(frozenNo())return;const rows=D().rows;const i=rows.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=rows.length)return;[rows[i],rows[j]]=[rows[j],rows[i]];commit();renderBody()}
function dup(id){if(frozenNo())return;const rows=D().rows;const i=rows.findIndex(x=>x.id===id);const c=clone(rows[i]);c.id=uid("r");c.origStart="";c.done=false;c.takes=0;if(c.shot)c.shot+=" (copy)";rows.splice(i+1,0,c);commit();renderBody()}
function del(id){if(frozenNo())return;const rows=D().rows;const i=rows.findIndex(x=>x.id===id);const r=rows[i];const name=isBlock(r)?blockName(r).toLowerCase():("shot "+(r.shot||r.action||"(no number)"));rows.splice(i,1);commit();renderBody();toast("Deleted "+name+" - Undo to restore")}
function addDay(){
  commit(); const c=cfg(); const n=S.days.length+1;
  const d={id:uid("d"),name:"Day "+n,kind:"schedule",dayNo:n,date:"",call:c.newCall,wrap:c.newWrap,setupPct:c.newSetupPct,shootPct:c.newShootPct,minSetup:c.newMinSetup,origWrap:null,rows:[]};
  S.days.push(d); P.activeByProject[pid()]=d.id; commit(); savePrefs(); renderAll();
}

/* ===================== jump a row to a time of day ===================== */
// tries the row in every position and picks the one where it starts closest to the time asked for
function bestSlot(d,id,target){
  const row=d.rows.find(r=>r.id===id); if(!row) return null; const rest=d.rows.filter(r=>r.id!==id);
  let best=null;
  for(let i=0;i<=rest.length;i++){
    const trial=[...rest.slice(0,i),row,...rest.slice(i)], C=compute(Object.assign({},d,{rows:trial})), st=C.rows[id].start;
    const diff=Math.abs(st-target); if(!best||diff<best.diff-0.01) best={i,start:st,diff,before:rest[i]||null,after:rest[i-1]||null};
  }
  return best;
}
function jumpTarget(d,v){ let t=toMin(v); if(t<toMin(d.call||"09:00")&&wrapMin(d)>1440) t+=1440; return t; }
function openJumpTime(id,td){if(frozenNo())return;
  closeJumpTime(); const d=D(); const r=d&&d.rows.find(x=>x.id===id); if(!r) return;
  const C=compute(), cur=C.rows[id].start;
  const inp=h("input",{type:"time",value:hhmm(cur%1440)}), hint=h("div",{class:"note"});
  const name=isBlock(r)?blockName(r):"Shot "+(r.shot||"-");
  const preview=()=>{ if(!inp.value){hint.textContent="";return} const b=bestSlot(d,id,jumpTarget(d,inp.value)); if(!b){hint.textContent="";return}
    const nb=n=>n?(isBlock(n)?blockName(n):"shot "+(n.shot||"-")):"";
    hint.textContent=(Math.round(b.diff)<=1?"Starts at ":"Closest it can start: ")+fmt(b.start)+(b.after&&b.before?` (between ${nb(b.after)} and ${nb(b.before)})`:b.before?" (first in the day)":" (last in the day)"); };
  const go=()=>{ if(!inp.value) return; const b=bestSlot(d,id,jumpTarget(d,inp.value)); if(!b) return;
    const from=d.rows.findIndex(x=>x.id===id); const rest=d.rows.filter(x=>x.id!==id); rest.splice(b.i,0,r);
    closeJumpTime(); if(rest.findIndex(x=>x.id===id)===from){toast(name+" already starts closest to that time");return}
    d.rows=rest; commit(); renderBody(); jump(id);
    toast(`${name} now starts at ${fmt(compute().rows[id].start)}`+(Math.round(b.diff)>1?` - the closest slot to ${fmt(jumpTarget(d,inp.value))}`:"")+" - Undo to put it back"); };
  inp.addEventListener("input",preview); inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();go()}if(e.key==="Escape")closeJumpTime()});
  const pop=h("div",{class:"jumppop",id:"jumpPop"},h("label",{},"Move "+name+" to start at",inp),hint,
    h("div",{class:"toolbar"},h("button",{class:"btn small primary",onclick:go},"Move"),h("button",{class:"btn small",onclick:closeJumpTime},"Cancel")));
  pop.style.visibility="hidden"; document.body.append(pop); preview();
  // below the cell if it fits, otherwise above it; always on screen
  const place=()=>{const bb=td.getBoundingClientRect(), ph=pop.offsetHeight, pw=pop.offsetWidth;
    const top=bb.bottom+4+ph<=innerHeight-8?bb.bottom+4:Math.max(8,bb.top-4-ph);
    pop.style.left=Math.max(8,Math.min(innerWidth-pw-8,bb.left))+"px"; pop.style.top=Math.max(8,Math.min(innerHeight-ph-8,top))+"px"; pop.style.visibility="";};
  place(); inp.addEventListener("input",()=>requestAnimationFrame(place));
  setTimeout(()=>{inp.focus();document.addEventListener("mousedown",jumpOutside,true)},0);
}
function jumpOutside(e){const p=$("#jumpPop");if(p&&!p.contains(e.target))closeJumpTime()}
function closeJumpTime(){const p=$("#jumpPop");if(p)p.remove();document.removeEventListener("mousedown",jumpOutside,true)}

/* ===================== move or copy shots to another day ===================== */
let MOVE=null;
function openMove(ids){if(frozenNo())return;
  const d=D(); if(!d) return; MOVE={from:d.id,ids:new Set(ids)};
  const b=$("#moveBody"); b.innerHTML="";
  const others=live().filter(x=>x.id!==d.id);
  const to=h("select",{}); others.forEach(x=>to.append(h("option",{value:x.id},(x.name||"Day")+(x.date?" · "+x.date:"")+(dayStatus(x)==="wrapped"?" (wrapped)":""))));
  to.append(h("option",{value:"new"},"+ A new day"));
  // default: the next ready day after this one, else the first other day
  const ready=tabOrder().ready.filter(x=>x.id!==d.id); to.value=(ready.find(x=>(x.date||"")>=(d.date||""))||ready[0]||others[0]||{id:"new"}).id;
  const where=h("select",{},h("option",{value:"end"},"At the end of the day"),h("option",{value:"start"},"At the start of the day"));
  const list=h("div",{class:"movelist"});
  const rows=d.rows.filter(r=>!isBlock(r)||r.type==="tech");
  const count=h("b",{});
  const upd=()=>{count.textContent=MOVE.ids.size+" selected";$("#moveGo").disabled=$("#copyGo").disabled=!MOVE.ids.size};
  for(const r of rows){ const cb=h("input",{type:"checkbox"}); cb.checked=MOVE.ids.has(r.id);
    cb.addEventListener("change",()=>{cb.checked?MOVE.ids.add(r.id):MOVE.ids.delete(r.id);upd()});
    list.append(h("label",{class:"inline"+(r.done?" isdone":"")},cb,h("span",{},isBlock(r)?blockName(r):("Shot "+(r.shot||"-")+(r.action?" · "+r.action:r.description?" · "+String(r.description).slice(0,50):""))),r.done?h("span",{class:"note"}," (shot)"):r.cut?h("span",{class:"note"}," (cut)"):null)); }
  const pick=f=>{MOVE.ids=new Set(rows.filter(f).map(r=>r.id));$$("input",list).forEach((cb,i)=>cb.checked=MOVE.ids.has(rows[i].id));upd()};
  b.append(h("div",{class:"form"},h("label",{},"Move to",to),h("label",{},"Where",where)),
    h("div",{class:"toolbar",style:"margin:.4rem 0"},count,h("button",{class:"btn small",onclick:()=>pick(r=>!r.done&&!isBlock(r))},"All not yet shot"),h("button",{class:"btn small",onclick:()=>pick(r=>!isBlock(r))},"All shots"),h("button",{class:"btn small",onclick:()=>pick(()=>false)},"None")),
    list,
    h("div",{class:"toolbar",style:"margin-top:.8rem"},h("button",{class:"btn primary",id:"moveGo",onclick:()=>doMove(to.value,where.value,false)},"Move"),h("button",{class:"btn",id:"copyGo",onclick:()=>doMove(to.value,where.value,true)},"Copy")),
    h("p",{class:"note"},"Moving keeps everything about the shot (notes, pictures, priority, takes logged so far) and it's the same shot for the team, just on another day. Its times are worked out again for the new day, and its name picks up the new day number for the next takes. Copy leaves the original where it is and adds a fresh, unshot copy. One Undo puts it all back."));
  upd(); $("#moveModal").classList.add("open");
}
function doMove(toId,where,copy){
  const from=S.days.find(x=>x.id===MOVE.from); if(!from) return;
  let to=toId==="new"?null:S.days.find(x=>x.id===toId);
  if(!to){ const c=cfg(), n=S.days.length+1; to={id:uid("d"),name:"Day "+n,kind:from.kind||"schedule",dayNo:n,date:"",call:c.newCall,wrap:c.newWrap,setupPct:c.newSetupPct,shootPct:c.newShootPct,minSetup:c.newMinSetup,origWrap:null,rows:[]}; S.days.push(to); }
  const picked=from.rows.filter(r=>MOVE.ids.has(r.id)); if(!picked.length) return;
  const moving=copy?picked.map(r=>Object.assign(clone(r),{id:uid("r"),done:false,doneAt:null,takes:0,takeLog:"",origStart:"",cut:null})):picked;
  // the planned time of day belonged to the old day
  if(!copy){ from.rows=from.rows.filter(r=>!MOVE.ids.has(r.id)); moving.forEach(r=>{r.origStart=""}); }
  to.rows=where==="start"?[...moving,...to.rows]:[...to.rows,...moving];
  commit(); renderAll(); $("#moveModal").classList.remove("open");
  const n=moving.length;
  toast(`${copy?"Copied":"Moved"} ${n} ${n===1?"shot":"shots"} to ${to.name} - Undo to put ${n===1?"it":"them"} back`);
}

/* ===================== on set: shared bits for Slate View and Note View ===================== */
// the shot "up next" in the running order: the first shot on this day not yet shot (or cut)
function runningShots(d){return (d||D()).rows.filter(r=>!isBlock(r)&&!r.cut)}
function upNext(d){const s=runningShots(d);return s.find(r=>!r.done)||s[s.length-1]||null}
function takeList(r){try{const a=JSON.parse(r.takeLog||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
function setTakeList(r,a){r.takeLog=JSON.stringify(a)}
// hero / safety marks also fill the Hero and Safety columns (which drive the links reminder on wrapped days)
function syncMarks(r){const a=takeList(r);const hs=a.filter(t=>t.mark==="hero").map(t=>"T"+t.n),ss=a.filter(t=>t.mark==="safety").map(t=>"T"+t.n);
  if(hs.length||String(r.hero||"").match(/^(T\d+(, )?)*$/))r.hero=hs.join(", ");if(ss.length||String(r.safety||"").match(/^(T\d+(, )?)*$/))r.safety=ss.join(", ")}
// log a take on a shot: counts it, and keeps its timecode and time of day
function logTake(id,extra={}){
  const r=R(id); if(!r) return null; const d=D(); const n=nextTake(r,d);
  const a=takeList(r); const t=Object.assign({n,tc:tcString(nowTcMs(),slateFps()),t:hhmm(nowMin()),at:Date.now(),mark:"",note:""},extra);
  a.push(t); setTakeList(r,a); r.takes=(Number(r.takes)||0)+1; commit();
  return t;
}
// the take still rolling on a shot: logged (clapped / rolled) but not cut yet, within the last few hours
function rollingTake(r){const a=r?takeList(r):[];const t=a[a.length-1];return t&&!t.out&&t.at&&Date.now()-t.at<4*3600e3?t:null}
// Cut: timecode out and length on the rolling take
function cutTake(id){
  const r=R(id); if(!r) return null; const a=takeList(r); const t=a[a.length-1];
  if(!t||t.out||!t.at) return null;
  const fps=slateFps(), outMs=nowTcMs(); t.out=tcString(outMs,fps); t.endT=hhmm(nowMin());
  t.ms=Date.now()-t.at; t.len=fmtDur(t.ms);
  setTakeList(r,a); commit(); return t;
}
let wakeLock=null;
async function keepAwake(on){try{if(on&&"wakeLock" in navigator&&!wakeLock){wakeLock=await navigator.wakeLock.request("screen");wakeLock.addEventListener("release",()=>{wakeLock=null})}else if(!on&&wakeLock){await wakeLock.release();wakeLock=null}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&($("#slateView").classList.contains("open")||$("#noteView").classList.contains("open")))keepAwake(true)});

/* ===================== timecode ===================== */
// Time of day, or jammed (from LTC audio or typed in) and then free-running from this device's clock, like a hardware slate.
function slateCfg(){return Object.assign({show:{prod:1,dir:1,dop:1,shot:1,take:1,roll:1,date:1,day:1,fps:1,name:1,desc:0,custom:0,tc:1},dir:"",dop:"",roll:"A001",custom:"",theme:"dark",tcSource:"auto",fps:"",jam:null,logOnClap:true,shareJam:true,sound:"clap",volume:0.9},P.slate||{},{show:Object.assign({prod:1,dir:1,dop:1,shot:1,take:1,roll:1,date:1,day:1,fps:1,name:1,desc:0,custom:0,tc:1},(P.slate||{}).show||{})})}
function setSlate(ch){P.slate=Object.assign(slateCfg(),ch);savePrefs()}
// timecode runs at a standard rate; a capture rate like 120 fps falls back to 25
const TC_RATES=[23.976,24,25,29.97,30,48,50,60];
function teamJam(){const j=S&&S.cfg&&S.cfg.tcJam;return j&&typeof j==="object"&&Number.isFinite(j.offset)&&Date.now()-j.at<12*3600e3?j:null}
// where this device's timecode comes from: its own jam, the team's shared jam, or the time of day
function tcSourceNow(){const c=slateCfg();if(c.tcSource==="jam"&&c.jam)return {kind:"own",jam:c.jam};if(c.tcSource!=="tod"){const j=teamJam();if(j)return {kind:"team",jam:j}}return {kind:"tod"}}
function slateFps(){const c=slateCfg();if(Number(c.fps))return Number(c.fps);const s=tcSourceNow();if(s.kind==="team"&&Number(s.jam.fps))return Number(s.jam.fps);const p=Number(S&&S.project.fps);return TC_RATES.includes(p)?p:25}
function todMs(){const d=new Date();return ((d.getHours()*60+d.getMinutes())*60+d.getSeconds())*1000+d.getMilliseconds()}
function nowTcMs(){const s=tcSourceNow();return s.kind==="tod"?todMs():Date.now()+s.jam.offset}
function tcString(ms,fps){const nom=Math.round(fps)||25;ms=((Math.floor(ms)%864e5)+864e5)%864e5;const s=Math.floor(ms/1000),f=Math.min(nom-1,Math.floor((ms%1000)*nom/1000));
  return [Math.floor(s/3600),Math.floor(s/60)%60,s%60,f].map(x=>String(x).padStart(2,"0")).join(":")}
function parseTc(v,fps){const m=String(v).trim().match(/^(\d{1,2})[:.;]?(\d{2})[:.;]?(\d{2})(?:[:.;]?(\d{1,2}))?$/);if(!m)return null;const [h,mi,s,f]=[+m[1],+m[2],+m[3],+(m[4]||0)];if(h>23||mi>59||s>59||f>=Math.round(fps))return null;return ((h*60+mi)*60+s)*1000+f*1000/Math.round(fps)}
function jamTo(tcMs,source){const jam={offset:tcMs-Date.now(),at:Date.now(),source};setSlate({tcSource:"jam",jam});
  // every device on the project then reads the same timecode (their clocks agree to within a frame or two)
  if(S&&slateCfg().shareJam!==false){S.cfg.tcJam=Object.assign({},jam,{fps:slateFps(),by:P.name||""});commit()}}
function tcLabel(){const s=tcSourceNow();if(s.kind==="tod")return "Time of day";const j=s.jam;
  return (s.kind==="team"?"TC from the team's jam":"TC jammed")+(j.source?" ("+j.source+(s.kind==="team"&&j.by?", "+j.by:"")+")":"")+" "+ago(j.at)+(Date.now()-j.at>4*3600e3?" · jam again":"")}

// LTC (linear timecode) arrives as audio: e.g. a Tentacle Sync's output into the phone or tablet's mic input.
// Bits are biphase-mark coded: a transition at every bit edge, plus one mid-bit for a 1. 80 bits a frame, ending in a sync word.
const LTC_SYNC=[0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1];
function ltcDecoder(rate,onFrame){
  let sign=0,run=0,peak=0.02,L=rate/2100,halfPending=false,win=[];
  const bcd=(s,n)=>{let v=0;for(let k=0;k<n;k++)v|=win[s+k]<<k;return v};
  const pushBit=(b,t)=>{win.push(b);if(win.length>80)win.shift();if(win.length<80)return;
    for(let k=0;k<16;k++)if(win[64+k]!==LTC_SYNC[k])return;
    const f=bcd(0,4)+10*bcd(8,2),s=bcd(16,4)+10*bcd(24,3),m=bcd(32,4)+10*bcd(40,3),h=bcd(48,4)+10*bcd(56,2);
    if(f<60&&s<60&&m<60&&h<24) onFrame({h,m,s,f,df:!!win[10],t,bitLen:L});};
  return (buf,t0)=>{ // t0: wall-clock ms of buf[0]
    for(let i=0;i<buf.length;i++){const x=buf[i];peak=Math.max(peak*0.9995,Math.abs(x));const th=peak*0.2;let s=sign;if(x>th)s=1;else if(x<-th)s=-1;run++;
      if(s!==sign&&sign!==0&&s!==0){const len=run,t=t0+i*1000/rate;run=0;
        if(len<0.75*L){if(halfPending){pushBit(1,t);halfPending=false}else halfPending=true;L=L*0.97+0.03*len*2}
        else if(len<1.6*L){halfPending=false;pushBit(0,t);L=L*0.97+0.03*len}
        else{halfPending=false;win=[]}}
      if(s!==0)sign=s;}
  };
}
const LTC={on:false};
async function startLtc(status){
  if(LTC.on) return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){status("This browser can't listen to audio. Use time of day, or type a timecode to jam.");return}
  const want=slateCfg().audioIn, opts={echoCancellation:false,noiseSuppression:false,autoGainControl:false};
  let stream; try{ try{stream=await navigator.mediaDevices.getUserMedia({audio:want?Object.assign({deviceId:{exact:want}},opts):opts})}
    catch(e1){ if(!want||e1.name==="NotAllowedError") throw e1; stream=await navigator.mediaDevices.getUserMedia({audio:opts}); status("The chosen input isn't connected, so the default one is being used."); } }catch(e){status("Microphone access was refused, so LTC can't be read. Allow the microphone for this site and try again.");return}
  const ctx=new (window.AudioContext||window.webkitAudioContext)(); const src=ctx.createMediaStreamSource(stream);
  const proc=ctx.createScriptProcessor(1024,1,1); const mute=ctx.createGain(); mute.gain.value=0;
  const frames=[]; let maxF=0, good=0, prev=null;
  const dec=ltcDecoder(ctx.sampleRate,fr=>{
    const tc=(fr.h*3600+fr.m*60+fr.s);
    if(prev){const fpsGuess=Math.max(24,maxF+1);const pv=prev.tc*fpsGuess+prev.f, cv=tc*fpsGuess+fr.f;good=(cv-pv===1||(fr.f===0&&tc===prev.tc+1))?good+1:0}
    prev={tc,f:fr.f}; maxF=Math.max(maxF,fr.f);
    // the frame rate comes from the signal itself: 80 bits a frame
    const heard=ctx.sampleRate/(80*fr.bitLen), fps=[24,25,30].reduce((a,b)=>Math.abs(b-heard)<Math.abs(a-heard)?b:a);
    // the frame started 80 bits before its sync word ended
    const startWall=fr.t-80*fr.bitLen*1000/ctx.sampleRate;
    frames.push((tc*1000+fr.f*1000/Math.round(fps))-startWall)  /* time-of-day TC minus the device clock */; if(frames.length>25)frames.shift();
    status(`Hearing LTC ${String(fr.h).padStart(2,"0")}:${String(fr.m).padStart(2,"0")}:${String(fr.s).padStart(2,"0")}:${String(fr.f).padStart(2,"0")}${fr.df?" (drop frame)":""}`+(good>=8?" · jammed":" · locking on…"));
    if(good>=8){const sorted=[...frames].sort((a,b)=>a-b);const offTod=sorted[Math.floor(sorted.length/2)];
      // offset to the device clock (Date.now) from the time-of-day offset
      setSlate({fps:String(fps)}); jamTo(Date.now()+offTod, `LTC, ${fps} fps`);
      stopLtc(); status("Jammed from LTC: now free-running. Unplug the cable; jam again every few hours.");}
  });
  proc.onaudioprocess=e=>{const b=e.inputBuffer.getChannelData(0);dec(b,Date.now()-b.length*1000/ctx.sampleRate)};
  src.connect(proc);proc.connect(mute);mute.connect(ctx.destination);
  Object.assign(LTC,{on:true,stream,ctx,proc});status("Listening for LTC on the microphone input…");
  setTimeout(()=>{if(LTC.on&&!good){status("No timecode heard yet. Check the cable goes into the mic input and the Tentacle is set to output LTC (audio), then keep the volume up.")}},6000);
}
function stopLtc(){if(!LTC.on)return;try{LTC.proc.disconnect();LTC.stream.getTracks().forEach(t=>t.stop());LTC.ctx.close()}catch(e){}LTC.on=false}

// which audio input carries the LTC (laptops often have several)
function audioInputPicker(c){
  const sel=h("select",{},h("option",{value:""},"Default input"));
  if(navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices) navigator.mediaDevices.enumerateDevices().then(ds=>{
    const ins=ds.filter(d=>d.kind==="audioinput"&&d.deviceId&&d.deviceId!=="default"&&d.deviceId!=="communications");
    ins.forEach((d,i)=>sel.append(h("option",{value:d.deviceId},d.label||`Input ${i+1}`)));
    if(ins.length&&!ins[0].label) sel.append(h("option",{disabled:true},"(names appear after the first jam)"));
    sel.value=ins.some(d=>d.deviceId===c.audioIn)?c.audioIn:"";
  }).catch(()=>{});
  sel.addEventListener("change",()=>setSlate({audioIn:sel.value}));
  return h("label",{class:"slaudio"},"Audio input for LTC",sel);
}
function popOutSlate(){
  const u=location.pathname+"?p="+encodeURIComponent(pid())+"&view=slate&day="+encodeURIComponent((D()||{}).id||"");
  const w=window.open(u,"shotlist-slate","popup,width=1280,height=760");
  if(!w) toast("The browser blocked the new window: allow pop-ups for this site and try again");
  else closeSlate();
}
// a window opened as the slate goes straight to it
const BOOT_VIEW=new URLSearchParams(location.search).get("view"), BOOT_DAY=new URLSearchParams(location.search).get("day");
let bootViewDone=false;
function bootView(){
  if(!BOOT_VIEW||bootViewDone) return; bootViewDone=true;
  let n=0; const t=setInterval(()=>{ n++; if(S&&S.days&&S.days.length){
      if(BOOT_DAY&&S.days.some(d=>d.id===BOOT_DAY)) P.activeByProject[pid()]=BOOT_DAY;
      renderAll(); clearInterval(t); BOOT_VIEW==="notes"?openNotes():openSlate(); document.title="Slate · "+(S.project.name||""); }
    else if(n>40) clearInterval(t); },250);
}

/* ===================== clap sound ===================== */
// built in (made on the fly, nothing to download) or your own file, kept on this device
let sfxCtx=null, customClap=null;
function sfx(){ if(!sfxCtx) sfxCtx=new (window.AudioContext||window.webkitAudioContext)(); if(sfxCtx.state==="suspended") sfxCtx.resume(); return sfxCtx; }
function idbSounds(){ return new Promise((res,rej)=>{ const q=indexedDB.open("shotlist-sounds",1); q.onupgradeneeded=()=>q.result.createObjectStore("files"); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); }
async function soundGet(){ try{ const db=await idbSounds(); return await new Promise(r=>{const t=db.transaction("files").objectStore("files").get("clap");t.onsuccess=()=>r(t.result||null);t.onerror=()=>r(null)}); }catch(e){ return null; } }
async function soundPut(v){ const db=await idbSounds(); await new Promise((r,j)=>{const t=db.transaction("files","readwrite");v?t.objectStore("files").put(v,"clap"):t.objectStore("files").delete("clap");t.oncomplete=r;t.onerror=()=>j(t.error)}); customClap=null; }
function noiseBuf(ctx,secs,shape){ const n=Math.floor(secs*ctx.sampleRate), b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*shape(i/ctx.sampleRate); return b; }
async function playClap(kind,vol){
  kind=kind||slateCfg().sound; vol=vol==null?Number(slateCfg().volume):vol; if(kind==="none"||!vol) return;
  const ctx=sfx(), out=ctx.createGain(); out.gain.value=Math.max(0,Math.min(1,vol)); out.connect(ctx.destination); const t=ctx.currentTime+0.005;
  if(kind==="custom"){ try{ if(!customClap){ const f=await soundGet(); if(!f) return playClap("clap",vol); customClap=await ctx.decodeAudioData(f.data.slice(0)); }
      const s=ctx.createBufferSource(); s.buffer=customClap; s.connect(out); s.start(t); }catch(e){ toast("Couldn't play that sound file: try another (MP3, WAV or M4A)"); } return; }
  if(kind==="beep"){ const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.value=1000; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.8,t+.003); g.gain.setValueAtTime(.8,t+.1); g.gain.linearRampToValueAtTime(0,t+.104); o.connect(g).connect(out); o.start(t); o.stop(t+.12); return; }
  if(kind==="sticks"){ for(const [dt,f] of [[0,2600],[0.018,2100]]){ const o=ctx.createOscillator(), g=ctx.createGain(); o.type="triangle"; o.frequency.value=f; g.gain.setValueAtTime(.9,t+dt); g.gain.exponentialRampToValueAtTime(.001,t+dt+.07); o.connect(g).connect(out); o.start(t+dt); o.stop(t+dt+.08); }
    const n=ctx.createBufferSource(); n.buffer=noiseBuf(ctx,.04,x=>Math.exp(-x*160)); const hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=3000; n.connect(hp).connect(out); n.start(t); return; }
  // "clap": a sharp clapper-board crack, a few bursts of filtered noise close together
  const n=ctx.createBufferSource(); n.buffer=noiseBuf(ctx,.3,x=>[0,.009,.019].reduce((a,o,i)=>a+(x>=o?Math.exp(-(x-o)*(i<2?260:24)):0),0)*.7);
  const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1700; bp.Q.value=.7;
  const body=ctx.createOscillator(), bg=ctx.createGain(); body.frequency.value=210; bg.gain.setValueAtTime(.5,t); bg.gain.exponentialRampToValueAtTime(.001,t+.06); body.connect(bg).connect(out); body.start(t); body.stop(t+.07);
  n.connect(bp).connect(out); n.start(t);
}
function soundPicker(c){
  const sel=h("select",{},...[["clap","Clap (default)"],["sticks","Clapper sticks"],["beep","Sync beep (1 kHz)"],["custom","My own sound file"],["none","No sound"]].map(([v,l])=>h("option",{value:v},l)));
  sel.value=c.sound||"clap";
  const vol=h("input",{type:"range",min:"0",max:"1",step:"0.05",value:String(c.volume==null?0.9:c.volume)});
  const file=h("input",{type:"file",accept:"audio/*,.mp3,.wav,.m4a,.aac,.ogg",hidden:true});
  const fname=h("span",{class:"note"}); soundGet().then(f=>{fname.textContent=f?"Your sound: "+f.name:"No file chosen yet"});
  const pickBtn=h("button",{class:"btn small",onclick:()=>file.click()},"Choose a sound file…");
  const clearBtn=h("button",{class:"btn small",onclick:async()=>{await soundPut(null);fname.textContent="No file chosen yet";if(slateCfg().sound==="custom"){setSlate({sound:"clap"});sel.value="clap"}toast("Back to the built-in clap")}},"Remove");
  const showFile=()=>{const on=sel.value==="custom";pickBtn.style.display=clearBtn.style.display=fname.style.display=on?"":"none"};
  sel.addEventListener("change",()=>{setSlate({sound:sel.value});showFile();if(sel.value==="custom"){soundGet().then(f=>{if(!f)file.click();else playClap()})}else playClap()});
  vol.addEventListener("change",()=>{setSlate({volume:Number(vol.value)});playClap()});
  file.addEventListener("change",async()=>{const f=file.files[0];if(!f)return;if(f.size>5e6){toast("That file is over 5 MB: pick a short clip");return}
    try{const data=await f.arrayBuffer();await sfx().decodeAudioData(data.slice(0));await soundPut({name:f.name,type:f.type,data});setSlate({sound:"custom"});sel.value="custom";fname.textContent="Your sound: "+f.name;showFile();playClap()}
    catch(e){toast("This browser can't play that file: try MP3, WAV or M4A")}});
  showFile();
  return h("div",{class:"slsound"},h("div",{class:"form"},h("label",{},"Clap sound",sel),h("label",{},"Volume",vol)),h("div",{class:"toolbar"},pickBtn,clearBtn,h("button",{class:"btn small",onclick:()=>playClap()},"▶ Play"),fname),file);
}

/* ===================== Slate View ===================== */
const SLV={id:null,raf:0};
function openSlate(id){const d=D();if(!d)return;const r=seqAnchor((typeof id==="string"&&R(id))||upNext(d));SLV.id=r&&r.id;$("#slateView").classList.add("open");document.body.classList.add("viewopen");keepAwake(true);renderSlate();tickSlate()}
function closeSlate(){rememberView(null);$("#slateView").classList.remove("open");document.body.classList.remove("viewopen");cancelAnimationFrame(SLV.raf);stopLtc();keepAwake(false);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
function slateStep(dir){const s=runningShots().filter(r=>!r.seq||r.seq===r.id||!R(r.seq));if(!s.length)return;let i=s.findIndex(r=>r.id===SLV.id);i=Math.max(0,Math.min(s.length-1,(i<0?0:i)+dir));SLV.id=s[i].id;renderSlate()}
function tickSlate(){const el=$("#slTc");if(el&&$("#slateView").classList.contains("open")){el.textContent=tcString(nowTcMs(),slateFps());
  // while a take rolls: its number, timecode in and running length
  const now=Date.now(); if(!SLV.rt||now-SLV.rt>250){SLV.rt=now;const r=SLV.id&&R(SLV.id),t=rollingTake(r),m=$("#slMsg"),cb=$("#slCut");
    if(cb)cb.classList.toggle("live",!!t);$("#slateView").classList.toggle("rolling",!!t);
    if(m&&t)m.textContent=`● Rolling take ${t.n} · in ${t.tc} · ${fmtDur(now-t.at)}`;}
  SLV.raf=requestAnimationFrame(tickSlate)}}
function slateCut(){ if(!SLV.id) return; const t=cutTake(SLV.id); const m=$("#slMsg");
  if(!t){ if(m) m.textContent="Nothing rolling to cut: clap to log a take first"; return; }
  playClap("none"); if(m) m.textContent=`Take ${t.n} · in ${t.tc} · out ${t.out} · ${t.len}`; renderBody(); }
function renderSlate(){ if($("#slateView").classList.contains("open")) rememberView("slate",SLV.id);
  renderSlate0(); }
function renderSlate0(){
  const v=$("#slateView"), c=slateCfg(), d=D(), r=SLV.id&&R(SLV.id); v.className="viewer open slate theme-"+c.theme;
  v.innerHTML=""; const sh=c.show, fps=slateFps();
  const cell=(lab,val,cls="")=>h("div",{class:"slc "+cls},h("div",{class:"sll"},lab),h("div",{class:"slv"},val||"-"));
  const take=r?nextTake(r,d):"-";
  const bar=h("div",{class:"slbar",title:"Tap to clap"+(c.logOnClap?" and log the take":""),onclick:()=>clap()});
  const top=h("div",{class:"slrow"});
  if(sh.prod) top.append(cell("Production",S.project.name,"wide"));
  if(sh.dir) top.append(cell("Director",c.dir||S.project.lead));
  if(sh.dop) top.append(cell("Camera / DOP",c.dop));
  const mid=h("div",{class:"slrow big"});
  if(sh.shot){ const c=cell(r&&r.seq?"Sequence"+(seqAnyVcs(r)?" · VCS":""):"Shot"+(r&&r.vcs?" · VCS":""),r?(r.seq?seqRange(r,d)||r.shot:(r.shot||r.action||"-")):"-","huge");
    // tap the shot number to open the same shot in Note View (looks the same, just clickable)
    if(r){ const go=()=>{closeSlate();r.seq?openSeqView(r.seq):openNotes(r.id)}; c.classList.add("slgo"); c.setAttribute("role","button"); c.tabIndex=0; c.title=r.seq?"Open this sequence in Sequence View":"Open this shot in Note View";
      c.addEventListener("click",go); c.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();go()}}); }
    mid.append(c); }
  if(sh.take) mid.append(cell("Take",String(take),"huge"));
  if(sh.roll) mid.append(h("div",{class:"slc huge"},h("div",{class:"sll"},"Roll"),h("div",{class:"slv"},c.roll||"-"),h("div",{class:"slsmall"},h("button",{onclick:e=>{e.stopPropagation();setSlate({roll:bumpRoll(c.roll)});renderSlate()}},"Next roll"))));
  const low=h("div",{class:"slrow"});
  if(sh.date) low.append(cell("Date",d&&d.date?d.date:todayISO()));
  if(sh.day) low.append(cell("Day",d?(d.name||""):""));
  if(sh.fps) low.append(cell("FPS",String(fps)));
  const extra=h("div",{class:"slrow"});
  if(sh.name&&r) extra.append(cell("Shot name",shotName(r,d,take),"wide mono"));
  if(sh.desc&&r) extra.append(cell("Description",r.description||r.action,"wide"));
  if(sh.custom&&c.custom) extra.append(cell("",c.custom,"wide"));
  const tc=sh.tc?h("div",{class:"sltcbox"},h("div",{class:"sltc mono",id:"slTc"},tcString(nowTcMs(),fps)),h("div",{class:"sll"},tcLabel())):null;
  const nav=h("div",{class:"slnav"},
    h("button",{title:"Previous shot",onclick:()=>slateStep(-1)},"‹"),
    h("button",{class:"clap",onclick:()=>clap()},c.logOnClap?"Clap · log take":"Clap"),
    h("button",{class:"cutb",id:"slCut",title:"Cut: timecode out on the take that's rolling (X)",onclick:()=>slateCut()},"■ Cut"),
    h("button",{title:"Mark this shot (or the whole sequence) done and go to the next",onclick:()=>{const x=R(SLV.id);if(x){for(const m of (x.seq?seqMembers(x):[x])){m.done=true;m.doneAt=dayClock(D())}commit();renderBody()}const n=seqAnchor(upNext());SLV.id=n&&n.id;renderSlate()}},"Shot done ✓"),
    h("button",{title:"Next shot",onclick:()=>slateStep(1)},"›"),
    h("span",{class:"slgrow"}),
    h("button",{title:"Slate settings and timecode",onclick:()=>slateSettings()},"⚙"),
    document.fullscreenEnabled?h("button",{title:"Full screen",onclick:()=>{document.fullscreenElement?document.exitFullscreen():v.requestFullscreen().catch(()=>{})}},"⛶"):null,
    h("button",{title:"Close",onclick:closeSlate},"✕"));
  v.append(bar,top,mid,low,extra.childNodes.length?extra:"",tc||"",h("div",{class:"slmsg",id:"slMsg"}),nav,h("p",{class:"keyhint"},"Keys: Space or C clap · X cut · ← → shots · F full screen · Esc close"),h("div",{class:"slsettings",id:"slSet"}));
  if(!r) $("#slMsg").textContent="No shots on this day yet.";
  fitSlate();
}
// long values (e.g. "12 inserts") shrink to fit their box rather than being cut off
function fitSlate(){ requestAnimationFrame(()=>{ for(const el of $$("#slateView .slrow.big .slv")){ el.style.fontSize=""; let fs=parseFloat(getComputedStyle(el).fontSize); while(el.scrollWidth>el.clientWidth+1&&fs>14){fs*=0.9;el.style.fontSize=fs+"px"} } }); }
window.addEventListener("resize",()=>{ if($("#slateView").classList.contains("open")) fitSlate(); });
function bumpRoll(v){const m=String(v||"A000").match(/^(.*?)(\d+)$/);return m?m[1]+String(+m[2]+1).padStart(m[2].length,"0"):String(v||"")+"2"}
function ago(t){const m=Math.round((Date.now()-t)/60000);return m<1?"just now":m<60?m+" min ago":Math.round(m/60)+"h ago"}
function clap(){
  playClap();
  const v=$("#slateView"); v.classList.remove("flash"); void v.offsetWidth; v.classList.add("flash");
  if(!SLV.id) return; const c=slateCfg();
  if(c.logOnClap){const t=logTake(SLV.id);if(t){renderSlate();$("#slMsg").textContent=`Take ${t.n} logged at ${t.tc}`;renderBody()}}
}
function slateSettings(){
  const box=$("#slSet"); if(box.classList.toggle("open")===false) return; box.innerHTML=""; const c=slateCfg();
  const tog=(k,l)=>{const i=h("input",{type:"checkbox"});i.checked=!!c.show[k];i.addEventListener("change",()=>{const s=Object.assign({},slateCfg().show,{[k]:i.checked?1:0});setSlate({show:s});renderSlate();slateSettings()});return h("label",{class:"inline"},i,l)};
  const txt=(k,l,ph)=>{const i=h("input",{value:c[k]||"",placeholder:ph||""});i.addEventListener("change",()=>{setSlate({[k]:i.value});renderSlate();slateSettings()});return h("label",{},l,i)};
  const theme=h("select",{},...[["dark","Black"],["light","White"],["contrast","High contrast"],["classic","Classic clapper"]].map(([v,l])=>h("option",{value:v},l)));theme.value=c.theme;theme.addEventListener("change",()=>{setSlate({theme:theme.value});renderSlate();slateSettings()});
  const fpsSel=h("select",{},h("option",{value:""},"Project"+(TC_RATES.includes(Number(S.project.fps))?" ("+S.project.fps+")":" (25)")),...["23.976","24","25","29.97","30","48","50","60"].map(f=>h("option",{value:f},f)));fpsSel.value=c.fps||"";fpsSel.addEventListener("change",()=>{setSlate({fps:fpsSel.value});renderSlate();slateSettings()});
  const src=tcSourceNow();
  const st=h("p",{class:"note",id:"slTcStatus"},src.kind==="own"?"Jammed "+(c.jam.source?"from "+c.jam.source+" ":"")+ago(c.jam.at)+", free-running.":src.kind==="team"?"Using the team's jam ("+(src.jam.source||"")+(src.jam.by?", by "+src.jam.by:"")+", "+ago(src.jam.at)+").":"Using this device's time of day.");
  const share=h("input",{type:"checkbox"}); share.checked=c.shareJam!==false; share.addEventListener("change",()=>setSlate({shareJam:share.checked}));
  const say=m=>{const e=$("#slTcStatus");if(e)e.textContent=m;renderSlateTcLabel()};
  const manual=h("input",{placeholder:"HH:MM:SS:FF",class:"mono",inputmode:"numeric"});
  const logClap=h("input",{type:"checkbox"});logClap.checked=c.logOnClap;logClap.addEventListener("change",()=>{setSlate({logOnClap:logClap.checked});renderSlate();slateSettings()});
  box.append(
    h("h3",{},"Timecode"),st,
    h("div",{class:"toolbar"},
      h("button",{class:"btn small"+(c.tcSource==="tod"?" primary":""),title:"Use this device's clock, ignoring any jam",onclick:()=>{stopLtc();setSlate({tcSource:"tod"});renderSlate();slateSettings()}},"Time of day"),
      teamJam()?h("button",{class:"btn small"+(src.kind==="team"?" primary":""),title:"Use the jam another device shared with the team",onclick:()=>{stopLtc();setSlate({tcSource:"auto"});renderSlate();slateSettings()}},"Team jam"):null,
      h("button",{class:"btn small",onclick:()=>startLtc(say)},"Jam from LTC (Tentacle)"),
      LTC.on?h("button",{class:"btn small",onclick:()=>{stopLtc();say("Stopped listening.")}},"Stop listening"):null),
    h("div",{class:"toolbar"},manual,h("button",{class:"btn small",onclick:()=>{const ms=parseTc(manual.value,slateFps());if(ms==null){say("Type a timecode like 14:02:10:00");return}jamTo(ms,"typed");renderSlate();slateSettings()}},"Jam now")),
    h("label",{class:"inline"},share,"Share my jam with the team, so every device logs takes on the same timecode"),
    audioInputPicker(c),
    h("p",{class:"note"},"LTC: plug the Tentacle (or any LTC source) into the phone or tablet's mic input with a TRRS adaptor cable (on a laptop: the headset socket, or a USB audio interface or USB-C headset adaptor, then pick it as the audio input above), set it to output audio timecode, and keep the volume up. The slate jams in a second or two (within about a frame), then free-runs from the device clock: jam again every few hours, like a hardware slate. Or type the timecode and press Jam now on the beat."),
    h("h3",{},"Sound"),
    soundPicker(c),
    h("h3",{},"Second screen"),
    h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:popOutSlate},"Open the slate in its own window")),
    h("p",{class:"note"},"Drag that window onto a second monitor or projector facing camera (⛶ or F for full screen), and keep the schedule open on the laptop. Both stay in step."),
    h("h3",{},"Show"),
    h("div",{class:"slchecks"},tog("prod","Production"),tog("dir","Director"),tog("dop","Camera / DOP"),tog("shot","Shot"),tog("take","Take"),tog("roll","Roll"),tog("date","Date"),tog("day","Day"),tog("fps","FPS"),tog("name","Shot name"),tog("desc","Description"),tog("custom","Custom line"),tog("tc","Timecode")),
    h("div",{class:"form"},txt("dir","Director",S.project.lead||""),txt("dop","Camera / DOP"),txt("roll","Roll / card","A001"),txt("custom","Custom line","e.g. INT. TAVERN - NIGHT"),h("label",{},"Frame rate",fpsSel),h("label",{},"Look",theme)),
    h("label",{class:"inline"},logClap,"Clapping logs a take (with its timecode) on the shot"),
    h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:()=>{$("#slSet").classList.remove("open")}},"Done")));
}
function renderSlateTcLabel(){const t=$("#slateView .sltcbox .sll");if(t)t.textContent=tcLabel()}

/* ===================== Note View ===================== */
const NV={id:null,roll:null,timer:0};
function openNotes(id){const d=D();if(!d)return;const r=(typeof id==="string"&&R(id))||upNext(d);NV.id=r&&r.id;$("#noteView").classList.add("open");document.body.classList.add("viewopen");keepAwake(true);renderNotes()}
function closeNotes(){rememberView(null);const vh=$("#nvVideoHost");if(vh){vh.innerHTML="";vh.dataset.key=""}$("#noteView").classList.remove("open");document.body.classList.remove("viewopen");clearInterval(NV.timer);keepAwake(false);renderBody()}
function notesStep(dir){const s=runningShots();if(!s.length)return;let i=s.findIndex(r=>r.id===NV.id);i=Math.max(0,Math.min(s.length-1,(i<0?0:i)+dir));NV.id=s[i].id;renderNotes()}
function renderNotes(){
  // the panels are redrawn but the video player isn't, so marking a take doesn't restart it:
  // it lives in the same grid as the panels and stays put while they're replaced around it
  const v=$("#noteView"); const host=$("#nvVideoHost")||h("section",{id:"nvVideoHost",class:"nvvhost"});
  let body=$("#nvBody"); if(!body){body=h("div",{class:"nvbody",id:"nvBody"});} if(host.parentNode!==body) body.append(host);
  [...v.children].forEach(c=>{if(c!==body)c.remove()}); if(body.parentNode!==v) v.append(body);
  [...body.children].forEach(c=>{if(c!==host)c.remove()});
  const d=D(), r=NV.id&&R(NV.id);
  const L=d&&liveStatus(d,compute());
  const head=h("div",{class:"nvhead"},
    h("button",{title:"Previous shot",onclick:()=>notesStep(-1)},"‹"),
    h("div",{class:"nvtitle"},h("b",{},r?"Shot "+(r.shot||"-"):"No shots"),r&&r.priority?h("span",{class:"pill nvprio",style:`background:${prioHex(r.priority)||"var(--panel2)"};color:${inkOn(prioHex(r.priority)||"#ffffff")}`},r.priority):null,
      h("span",{class:"note"},(d?d.name:"")+(r?" · next take "+nextTake(r,d):"")),L?h("span",{class:"pacepill "+(L.slip<=-5?"ahead":L.slip<=2?"ontrack":L.slip<=15?"slipping":"behind")},L.slip===0?"±0 on time":(L.slip>0?"+"+dur(L.slip)+" behind":"−"+dur(-L.slip)+" ahead")):null),
    h("button",{title:"Next shot",onclick:()=>notesStep(1)},"›"),
    h("button",{class:"nvreset",title:"Put the panels back in their usual places and sizes",onclick:resetNvLayout,hidden:!nvCustom()},"Reset layout"),
    h("button",{title:"Close",onclick:closeNotes},"✕"));
  v.insertBefore(head,body); if(!r){host.innerHTML="";host.dataset.key="";host.className="nvvhost";return}
  // what the shot is
  const pics=h("div",{class:"nvpics"}); for(const k of ["ref1","ref2","ref3","scribble"]) if(r[k]){const im=h("img",{alt:k});imgSrc(r[k]).then(s=>{if(s)im.src=s});im.addEventListener("click",()=>{$("#lightImg").src=im.src;$("#lightbox").classList.add("open")});pics.append(im)}
  const info=h("div",{class:"nvinfo"});
  if(r.action) info.append(h("p",{},h("b",{},r.action)));
  if(r.description) info.append(h("p",{},r.description));
  if(r.script) info.append(h("blockquote",{},r.script));
  if(r.seq){ const a=seqAnchor(r); info.prepend(h("div",{class:"seqbanner",style:`--seq:${seqColor(r.seq)}`},h("b",{},"Part of sequence "+seqTitle(a)),` (${seqRange(a,d)}). `,h("button",{class:"go",onclick:()=>{closeNotes();openSeqView(r.seq)}},"Open Sequence View"))); }
  const chips=[["Location",r.location],["Shot type",r.shotType],["VCS",r.vcs?"yes":""],["Name",shotName(r,d,nextTake(r,d))]].filter(x=>x[1]);
  if(chips.length) info.append(h("div",{class:"nvchips"},...chips.map(([a,b])=>h("span",{},h("small",{},a+" "),b))));
  // takes
  const takes=h("div",{class:"nvtakes"});
  const rolling=rollingTake(r);
  const rollBtn=h("button",{class:"btn"+(rolling?" rolling":"")},rolling?"■ Cut":"● Roll");
  const clock=h("span",{class:"mono nvclock"},rolling?fmtDur(Date.now()-rolling.at):"0:00");
  clearInterval(NV.timer); if(rolling) NV.timer=setInterval(()=>{const c=$("#noteView .nvclock");const t=rollingTake(R(r.id));if(c&&t)c.textContent=fmtDur(Date.now()-t.at);else if(!t){clearInterval(NV.timer);renderNotes()}},250);
  // Roll logs the take with its timecode in; Cut adds the timecode out (the same take the slate clapped, if it did)
  rollBtn.onclick=()=>{ if(rollingTake(R(r.id))) cutTake(r.id); else logTake(r.id); renderNotes(); };
  takes.append(h("div",{class:"toolbar"},rollBtn,clock,h("button",{class:"btn",onclick:()=>{logTake(r.id);renderNotes()}},"+ Take"),
    h("button",{class:"btn primary",title:"Mark this shot done and go to the next",onclick:()=>{const x=R(r.id);if(x){x.done=true;x.doneAt=dayClock(D());commit()}const n=upNext();NV.id=n&&n.id;renderNotes()}},"Shot done ✓")));
  const list=takeList(r).slice().reverse();
  if(!list.length) takes.append(h("p",{class:"note"},"No takes logged yet. ● Roll logs a take with its timecode in, ■ Cut adds the timecode out; + Take logs one without rolling. Clap and Cut in Slate View do the same."));
  for(const t of list){
    const marks=h("span",{class:"nvmarks"});
    for(const [m,l] of [["good","Good"],["ng","NG"],["hero","Hero ★"],["safety","Safety"]]) marks.append(h("button",{class:"mk mk-"+m+(t.mark===m?" on":""),onclick:()=>{const x=R(r.id);const a=takeList(x);const it=a.find(z=>z.n===t.n);if(it){it.mark=it.mark===m?"":m;setTakeList(x,a);syncMarks(x);commit();renderNotes()}}},l));
    const note=h("input",{value:t.note||"",placeholder:"note"}); note.addEventListener("change",()=>{const x=R(r.id);const a=takeList(x);const it=a.find(z=>z.n===t.n);if(it){it.note=note.value;setTakeList(x,a);commit()}});
    takes.append(h("div",{class:"nvtake"+(!t.out&&t.at&&Date.now()-t.at<4*3600e3&&t===list[0]?" live":"")},takeLabel(r.id,t,()=>renderNotes()),
      h("span",{class:"mono note nvtc"},t.tc?"in "+t.tc:"",t.out?h("span",{}," → out "+t.out):(t===list[0]&&rollingTake(r)?h("span",{class:"rollingdot"}," ● rolling"):""),t.len?" · "+t.len:""),marks,note,
      h("button",{class:"nvdel",title:"Remove this take (you can undo it)",onclick:()=>deleteTake(r.id,t.n,()=>renderNotes())},"✕")));
  }
  // notes, saved straight onto the shot for the whole team
  const notes=h("div",{class:"nvnotes"});
  for(const [k,l] of [["director","Director notes"],["camera","Camera"],["lighting","Lighting"],["vfx","VFX notes"],["props","Prop / set notes"]]){
    const t=h("textarea",{rows:"2",placeholder:l}); t.value=r[k]||"";
    t.addEventListener("input",()=>{const x=R(r.id);if(!x)return;x[k]=t.value;autosize(t);softCommit()}); t.addEventListener("change",commit);
    notes.append(h("label",{},l,t)); requestAnimationFrame(()=>autosize(t));
  }
  for(const [sec,key] of [[h("section",{class:"nvwhat"},pics,info),"what"],[h("section",{class:"nvtk"},h("h3",{},"Takes"),takes),"takes"],[h("section",{class:"nvnt"},h("h3",{},"Notes"),notes),"notes"],[h("section",{class:"nvsc"},h("h3",{},"Scribble"),scribblePad(r)),"scribble"]]){ sec.dataset.card=key; cardControls(sec); body.insertBefore(sec,host); }
  host.dataset.card="video"; updateVideoHost(r); rememberView("notes",r.id); applyNvLayout();
  v.append(h("p",{class:"keyhint"},"Keys: R roll / cut · T log a take · G N H S mark the last take Good / NG / Hero / Safety · ← → shots · F full screen · Esc close"));
}
function fmtDur(ms){const s=Math.max(0,Math.round(ms/1000));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
// a drawing pad for finger or pencil; saved as a picture on the shot
function scribblePad(r){
  const wrap=h("div",{class:"scrib"}); const cv=h("canvas",{}); const strokes=[]; let cur=null, color="#111111", width=3, dirty=false;
  const W=1200,H=720; cv.width=W; cv.height=H; const x=cv.getContext("2d");
  let bg=null; const draw=()=>{x.fillStyle="#fff";x.fillRect(0,0,W,H);if(bg)x.drawImage(bg,0,0,W,H);x.lineCap="round";x.lineJoin="round";
    for(const s of strokes){x.strokeStyle=s.c;x.beginPath();s.p.forEach((p,i)=>{x.lineWidth=s.w*(0.5+(p[2]||0.5));i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.stroke()}};
  if(r.scribble) imgSrc(r.scribble).then(s=>{if(!s)return;const im=new Image();im.onload=()=>{bg=im;draw()};im.src=s});
  draw();
  const pt=e=>{const b=cv.getBoundingClientRect();return [(e.clientX-b.left)*W/b.width,(e.clientY-b.top)*H/b.height,e.pressure||0.5]};
  cv.addEventListener("pointerdown",e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);cur={c:color,w:color==="#ffffff"?24:width,p:[pt(e)]};strokes.push(cur);dirty=true;state()});
  cv.addEventListener("pointermove",e=>{if(!cur)return;cur.p.push(pt(e));draw()});
  const end=()=>{cur=null}; cv.addEventListener("pointerup",end); cv.addEventListener("pointercancel",end);
  const pens=h("span",{class:"pens"}); for(const [c,l] of [["#111111","Black"],["#d0342c","Red"],["#2f6fb0","Blue"],["#ffffff","Eraser"]]){const b=h("button",{class:"pen"+(c===color?" on":""),title:l,style:`background:${c}`,onclick:()=>{color=c;$$(".pen",pens).forEach(z=>z.classList.remove("on"));b.classList.add("on")}});pens.append(b)}
  const saveBtn=h("button",{class:"btn small primary"},"Save to shot");
  const state=()=>{saveBtn.disabled=!dirty;saveBtn.textContent=dirty?"Save to shot":"Saved"};
  saveBtn.onclick=async()=>{saveBtn.disabled=true;saveBtn.textContent="Saving…";draw();
    try{const data=cv.toDataURL("image/png");const ref=MODE==="team"?(await api("/api/image",{data})).ref:cv.toDataURL("image/jpeg",.85);const y=R(r.id);if(y){y.scribble=ref;commit()}dirty=false;state();toast("Scribble saved on shot "+(r.shot||""))}catch(e){toast("Couldn't save: "+e.message);saveBtn.disabled=false;saveBtn.textContent="Save to shot"}};
  wrap.append(cv,h("div",{class:"toolbar"},pens,h("button",{class:"btn small",onclick:()=>{strokes.pop();dirty=true;draw();state()}},"Undo stroke"),h("button",{class:"btn small",onclick:()=>{strokes.length=0;bg=null;dirty=true;draw();state()}},"Clear"),saveBtn,
    h("button",{class:"btn small",title:"Also put it in the first empty Storyboard box",onclick:()=>{const y=R(r.id);if(!y||!y.scribble){toast("Save the scribble first");return}const k=["ref1","ref2","ref3"].find(k=>!y[k]);if(!k){toast("The storyboard boxes are full");return}y[k]=y.scribble;commit();renderNotes();toast("Added to the storyboard")}},"Add to storyboard")));
  state(); return wrap;
}

/* ===================== DIT names ===================== */
function ditRows(){const d=D();return d?d.rows.filter(r=>!isBlock(r)&&!r.cut&&(P.ditShowDone||!r.done||Number(r.takes)>0)):[]}
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
    for(const [k,l] of fields){const i=h("input",{value:S.project[k]||""});bindDoc(i,null,v=>{S.project[k]=v;if(k==="name")$("#projTitle").textContent=v||"Untitled project"});if(k==="name")i.addEventListener("change",()=>syncProjectName(true));f.append(h("label",{},l,i))}
    const ta=h("textarea",{}); ta.value=S.project.notes||""; bindDoc(ta,null,v=>{S.project.notes=v}); f.append(h("label",{class:"wide"},"Project notes",ta));
    b.append(h("p",{class:"note"},"Shared with everyone on this project. The production ID can go into shot names (see Shot names)."),f);
    renderVideoSettings(b);
  }
  else if(setTab==="people"){
    for(const group of ["Cast","Crew"]){
      b.append(h("h3",{},group));
      const t=h("table",{class:"plain people","data-group":group}); t.append(h("thead",{},h("tr",{},...["",  "Name",group==="Cast"?"Character / role":"Role","Phone","Email","Notes",""].map(x=>h("th",{},x)))));
      const tb=h("tbody",{});
      const list=S.people.filter(p=>(p.group||"Crew")===group);
      list.forEach((p,idx)=>{
        const cell=(k)=>{const i=h("input",{value:p[k]||""});bindDoc(i,null,v=>{const q=S.people.find(x=>x.id===p.id);if(q)q[k]=v});return h("td",{},i)};
        const up=h("button",{class:"btn small",title:"Move up","aria-label":"Move "+(p.name||"person")+" up",disabled:idx===0,onclick:()=>movePerson(group,p.id,idx-1)},"↑");
        const dn=h("button",{class:"btn small",title:"Move down","aria-label":"Move "+(p.name||"person")+" down",disabled:idx===list.length-1,onclick:()=>movePerson(group,p.id,idx+1)},"↓");
        const handle=h("span",{class:"handle",title:"Drag to reorder","aria-hidden":"true"},"⠿");
        const tr=h("tr",{"data-id":p.id},h("td",{class:"grab"},handle),cell("name"),cell("role"),cell("phone"),cell("email"),cell("notes"),
          h("td",{class:"mv"},up,dn," ",h("button",{class:"btn small danger",title:"Remove",onclick:()=>{S.people=S.people.filter(x=>x.id!==p.id);commit();renderSetTab();toast("Removed - Undo to restore")}},"✕")));
        handle.addEventListener("pointerdown",e=>dragPerson(e,tr,tb,group));
        tb.append(tr);
      });
      t.append(tb); b.append(t);
      b.append(h("button",{class:"btn small",style:"margin-top:.5rem",onclick:()=>{S.people.push({id:uid("p"),group,name:"",role:"",phone:"",email:"",notes:""});commit();renderSetTab();const ins=$$("#setBody table.plain")[group==="Cast"?0:1];const last=ins&&$$("tbody tr",ins).pop();if(last)$("input",last).focus()}},"+ Add "+group.toLowerCase()));
    }
    b.append(h("div",{class:"toolbar",style:"margin-top:1rem"},h("button",{class:"btn small",onclick:exportPeople},"Export cast & crew (CSV)")));
  }
  else if(setTab==="columns"){
    b.append(h("p",{class:"note"},"Shared with everyone on this project. New columns appear on every day. Each person can still show or hide columns for themselves with the Columns menu."));
    b.append(h("h3",{},"Your columns"));
    const t2=h("table",{class:"plain"}); t2.append(h("thead",{},h("tr",{},...["","Name","Type","Dropdown options (comma separated)","Colour group","In shot name",""].map(x=>h("th",{},x)))));
    const tb2=h("tbody",{});
    S.cols.forEach((col,i)=>{
      const C=()=>S.cols.find(x=>x.id===col.id)||{};   // look the column up each time: a teammate's change may have refreshed S
      const nm=h("input",{value:col.label||""}); nm.addEventListener("input",()=>{C().label=nm.value;invalidateCols();softCommit()}); nm.addEventListener("change",()=>{commit();renderAll()});
      const ty=h("select",{}); CUSTOM_TYPES.forEach(([v,l])=>ty.append(h("option",{value:v},l))); ty.value=col.type||"text";
      ty.addEventListener("change",()=>{const c=C();c.type=ty.value;if(c.type==="list"&&!c.options)c.options="A,B,C";commit();renderAll();renderSetTab()});
      const op=h("input",{value:col.options||"",placeholder:"A,B,C",disabled:col.type!=="list"}); op.addEventListener("change",()=>{C().options=op.value;commit();renderAll()});
      const gs=h("select",{title:"Tints the column to match a group"});gs.append(h("option",{value:""},"None"));COL_GROUPS.forEach(([v,l])=>gs.append(h("option",{value:v},l)));gs.value=col.group||"";
      gs.addEventListener("change",()=>{C().group=gs.value||null;invalidateCols();commit();renderAll()});
      const key="c_"+col.id; const part=(S.cfg.idParts||[]).find(p=>p.key===key);
      const inId=h("input",{type:"checkbox"}); inId.checked=!!(part&&part.on);
      inId.addEventListener("change",()=>{const parts=S.cfg.idParts;const pp=parts.find(p=>p.key===key);if(pp)pp.on=inId.checked;else if(inId.checked)parts.push({key,on:true,prefix:""});commit();renderAll();toast(inId.checked?"Added to shot names - set its prefix and position in Shot names":"Removed from shot names")});
      const mv=dir=>{const i2=S.cols.findIndex(x=>x.id===col.id),j=i2+dir;if(i2<0||j<0||j>=S.cols.length)return;[S.cols[i2],S.cols[j]]=[S.cols[j],S.cols[i2]];commit();renderAll();renderSetTab()};
      const del=h("button",{class:"btn small danger",title:"Delete column",onclick:async()=>{if(!(await ask("Delete "+(col.label||"this column")+"?","It disappears from every day for everyone. The values are kept behind the scenes, so Undo brings it back with its data.","Delete")))return;S.cols=S.cols.filter(x=>x.id!==col.id);commit();renderAll();renderSetTab();toast("Deleted - Undo to restore")}},"✕");
      tb2.append(h("tr",{},h("td",{style:"white-space:nowrap"},h("button",{class:"btn small",disabled:i===0,onclick:()=>mv(-1)},"↑"),h("button",{class:"btn small",disabled:i===S.cols.length-1,onclick:()=>mv(1)},"↓")),h("td",{},nm),h("td",{},ty),h("td",{},op),h("td",{},gs),h("td",{style:"text-align:center"},inId),h("td",{},del)));
    });
    if(!S.cols.length) tb2.append(h("tr",{},h("td",{colspan:7,class:"note"},"No extra columns yet.")));
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
    txt("Tech / turnaround name","techLabel"); num("Tech / turnaround length (min)","techMin");
    txt("New day: call","newCall","time"); txt("New day: target wrap","newWrap","time");
    num("New day: setup buffer %","newSetupPct"); num("New day: shoot buffer %","newShootPct"); num("New day: minimum setup (min)","newMinSetup");
    num("Amber gate: minutes over target wrap","gateAmber"); num("Red gate: minutes over target wrap","gateRed");
    b.append(f);
  }
  else if(setTab==="display"){
    b.append(h("p",{class:"note"},"Just for you, on this device. Pick a preset, then fine-tune anything below."));
    const sec=(title,...kids)=>{const x=h("section",{class:"dsec"},h("h4",{},title),...kids);b.append(x);return x};
    const after=fn=>()=>{savePrefs();applyDisplay();fn&&fn()};
    const sel=(label,key,opts,fn,num)=>{const s=h("select",{});for(const [v,l] of opts)s.append(h("option",{value:v},l));s.value=String(P[key]);s.addEventListener("change",()=>{P[key]=num?Number(s.value):s.value;after(fn)()});return h("label",{},label,s)};
    const range=(label,key,min,max,step,show,fn)=>{const out=h("b",{},show(P[key]));const i=h("input",{type:"range",min:String(min),max:String(max),step:String(step),value:String(P[key])});
      i.addEventListener("input",()=>{P[key]=Number(i.value);out.textContent=show(P[key]);applyDisplay()});i.addEventListener("change",after(fn));return h("label",{class:"rng"},h("span",{class:"rl"},h("span",{},label),out),i)};
    const sw=(label,sub,get,set)=>{const c=h("input",{type:"checkbox",role:"switch"});c.checked=get();c.addEventListener("change",()=>{set(c.checked);savePrefs();applyDisplay()});return h("label",{class:"sw"},c,h("span",{},label,sub?h("small",{},sub):null))};
    const px=v=>v+"px", x2=v=>Number(v).toFixed(2), em=v=>Number(v)===0?"normal":"+"+Math.round(Number(v)*100)+"%";
    const presets={
      "Easy on the eyes":{theme:"warm",accent:"",font:"atkinson",fw:400,ui:14,tbl:15,lh:1.6,ls:0.01,density:"roomy",zebra:true,calm:true},
      "Night / dark set":{theme:"dim",accent:"",font:"atkinson",fw:400,ui:14,tbl:14,lh:1.55,ls:0.01,density:"comfortable",zebra:true,calm:true},
      "High contrast":{theme:"hc",accent:"",font:"atkinson",fw:500,ui:15,tbl:16,lh:1.55,ls:0.02,density:"roomy",zebra:true,calm:true},
      "Compact (fit more)":{theme:P.theme,font:"system",fw:400,ui:12,tbl:12,lh:1.3,ls:0,density:"compact",zebra:true},
      "Default":Object.assign({},DISPLAY_DEFAULTS)};
    sec("Presets",h("div",{class:"presets"},...Object.entries(presets).map(([n,v])=>h("button",{class:"btn small",onclick:()=>{Object.assign(P,v);savePrefs();applyDisplay();renderAll();renderSetTab();toast(n)}},n))));
    // colours
    const bandSel=h("select",{});for(const [v,l] of BANDS)bandSel.append(h("option",{value:v},l));bandSel.value=BANDS.some(x=>x[0]===P.band)?P.band:"custom";
    const bandPick=h("input",{type:"color",value:/^#/.test(P.band||"")?P.band:"#2f4858",style:"width:2.4rem;height:2rem;padding:0;border:none;background:none"});
    const showPick=()=>{bandPick.style.display=bandSel.value==="custom"?"":"none"};showPick();
    bandSel.addEventListener("change",()=>{P.band=bandSel.value==="custom"?bandPick.value:bandSel.value;showPick();savePrefs();applyDisplay()});
    bandPick.addEventListener("input",()=>{P.band=bandPick.value;applyDisplay()});bandPick.addEventListener("change",savePrefs);
    const tint=h("select",{});[["off","Off"],["subtle","Subtle"],["strong","Stronger"]].forEach(([v,l])=>tint.append(h("option",{value:v},l)));tint.value=P.colTint||"subtle";
    tint.addEventListener("change",()=>{P.colTint=tint.value;savePrefs();applyDisplay()});
    sec("Colours",h("div",{class:"dgrid"},
      sel("Colour theme","theme",[["auto","Match my device (light / dark)"],["light","Light"],["warm","Warm paper (softer, less glare)"],["dim","Dim (soft dark grey)"],["dark","Dark"],["hc","High contrast"],["hcdark","High contrast dark"]]),
      sel("Highlight colour","accent",[["","Theme default"],["#c2412d","Red"],["#d0700f","Orange"],["#2e7d4f","Green"],["#1f7a7a","Teal"],["#2f6fb0","Blue"],["#7a5ea8","Purple"],["#a33b6b","Magenta"]]),
      h("label",{title:"Tints related columns: shot, timing, capture, story, camera & look, notes, storyboard"},"Column group colours",tint),
      h("label",{},"Day banner colour",h("span",{class:"toolbar",style:"flex-wrap:nowrap"},bandSel,bandPick)),
      range("Banner strength","bandMix",4,40,1,v=>Math.round(v)+"%")));
    sec("Text",h("div",{class:"dgrid"},
      sel("Font","font",[["system","System (default)"],["atkinson","Atkinson Hyperlegible (easier reading)"],["lexend","Lexend (wider, calmer letters)"],["serif","Serif"],["rounded","Rounded"],["mono","Monospace"]],()=>setTimeout(reflow,300)),
      sel("Text weight","fw",[["400","Regular"],["500","Medium"],["600","Semi-bold"]],null,true),
      range("Interface text size","ui",11,20,1,px), range("Table text size","tbl",10,22,1,px),
      range("Line spacing","lh",1.2,2,0.05,x2), range("Letter spacing","ls",0,0.08,0.01,em)));
    sec("Layout",h("div",{class:"dgrid"},
      sel("Row spacing","density",[["compact","Compact"],["comfortable","Comfortable"],["roomy","Roomy"]],()=>reflow()),
      sel("Clock","clock",[["24","24-hour (14:30)"],["12","12-hour (2:30pm)"]],()=>renderAll())),
      h("div",{class:"dswitches",style:"margin-top:.5rem"},
        sw("Stripe alternate rows","easier to follow a row across",()=>!!P.zebra,v=>P.zebra=v),
        sw("Reduce motion","no flashing or fades",()=>!!P.calm,v=>P.calm=v)));
    sec("Table and on-set tools",h("div",{class:"dswitches"},
      sw("− / + buttons on Setup and Shoot","turn off to just type the minutes",()=>P.steppers!==false,v=>P.steppers=v),
      sw("Pace panel on shoot days","ahead / behind score, shot scores and streaks",()=>P.showPace!==false,v=>{P.showPace=v;setTimeout(()=>renderPace(compute()),0)}),
      sw("Highlight rows the team are working in","in each person's badge colour (team site)",()=>!!P.peerRows,v=>P.peerRows=v)));
    // timeline colours: a swatch each, with a reset back to the theme's colour
    const sws=h("div",{class:"swatches",id:"colourForm"});
    for(const [label,key,cssVar] of [["Setup","setup","--setup"],["Shooting","shoot","--shoot"],["Break / move","break","--break"],["Tech / turnaround","tech","--tech"],["Target wrap","wrap","--bad"]]){
      const cur=()=>(P.tl||{})[key]||getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()||"#888888";
      const i=h("input",{type:"color",value:toHex(cur()),"aria-label":label+" colour"});
      i.addEventListener("input",()=>{P.tl=Object.assign({},P.tl,{[key]:i.value});applyDisplay()});i.addEventListener("change",savePrefs);
      const r=h("button",{title:"Back to the theme's colour","aria-label":"Reset "+label},"↺");r.onclick=()=>{P.tl=Object.assign({},P.tl,{[key]:""});savePrefs();applyDisplay();i.value=toHex(cur())};
      sws.append(h("span",{class:"tlswatch"},i,label,r));
    }
    sec("Timeline colours",h("p",{class:"note",style:"margin:0 0 .5rem"},"They follow your colour theme until you pick your own; ↺ goes back to the theme's."),sws);
    b.append(h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:()=>{Object.assign(P,DISPLAY_DEFAULTS,{widths:{},colOrder:[],tl:{}});savePrefs();applyDisplay();renderAll();renderSetTab();toast("Display reset")}},"Reset all display settings")));
  }
  else if(setTab==="projects") renderProjectsTab(b);
  else if(setTab==="team"){
    if(MODE==="local"){
      if(P.mode==="local-forced") b.append(h("p",{},"You chose ",h("b",{},"Work offline"),", so this browser is using its own copy and isn't syncing with the team."),
        h("div",{class:"toolbar",style:"margin-bottom:.8rem"},h("button",{class:"btn primary",onclick:rejoinTeam},"Rejoin team project")),
        h("p",{class:"note"},"Your shared team schedule is safe on the team site. Anything you changed while offline stays in this browser's own copy: to bring it across, use Settings > Projects > Export project file here, rejoin, then Import into a new project."));
      else b.append(h("p",{},"You're working on your own: everything is saved in this browser."),
        h("p",{class:"note"},"To work as a team, deploy this tool to Netlify (see Help > Working as a team), then open the team site and enter the team key. Projects you made here can be brought across with Settings > Projects > Export project file and Import into a new project."));
    }else{
      const f=h("div",{class:"form"});
      const nm=h("input",{value:P.name}); nm.addEventListener("change",()=>{P.name=nm.value.trim();savePrefs();renderPresence()});
      const poll=h("select",{}); for(const s of [2,3,5,10,20]) poll.append(h("option",{value:s},"every "+s+" seconds")); poll.value=String(P.poll);
      poll.addEventListener("change",()=>{P.poll=Number(poll.value);savePrefs()});
      f.append(h("label",{},"Your name (shown to the team)",nm),h("label",{},"Check for teammates' changes",poll));
      { const ak=h("input",{type:"password",autocomplete:"off",value:adminKey(),placeholder:"Only for whoever manages the site"});
        const save=async()=>{const v=ak.value.trim();if(!v){setAdminKey("");IS_ADMIN=false;toast("Admin key removed from this device");renderSetTab();return}
          try{const r=await fetch("/api/ping",{cache:"no-store",headers:{"x-admin-key":v}});const j=await r.json();if(j.admin){setAdminKey(v);IS_ADMIN=true;toast("Admin key saved: you can open every project");renderSetTab()}else toast(j.projectKeys?"That isn't the admin key":"Project keys are off on this site: set ADMIN_KEY in Netlify first")}catch(e){toast(e.message)}};
        f.append(h("label",{},"Admin key"+(IS_ADMIN?" (saved: you can open every project)":""),h("span",{class:"toolbar"},ak,h("button",{class:"btn small",onclick:save},IS_ADMIN?"Update":"Save")))); }
      b.append(f,
        h("p",{class:"note",style:"margin-top:1rem"},PROJECT_KEYS?"Project keys are on: each project has its own key, and you only see the projects you hold keys for.":"Project keys are off: everyone who can open the site sees every project. To turn them on, set ADMIN_KEY in Netlify (see Help > Separate teams)."),
        h("p",{class:"note",style:"margin-top:1rem"},`Status: ${$("#status").title||$("#status").textContent}. ${pending.length?pending.length+" change(s) waiting to send.":"Nothing waiting to send."}`),
        h("div",{class:"toolbar"},h("button",{class:"btn small",onclick:()=>{syncNow();flush();toast("Checking now")}},"Sync now"),
          h("button",{class:"btn small danger",onclick:async()=>{if(pending.length&&!(await ask("Forget the team key?",`${pending.length} change(s) haven't reached the server yet. They stay on this device and send when you sign in again.`,"Forget key")))return;P.teamKey="";savePrefs();location.reload()}},"Forget team key on this device")));
    }
  }
}
function renderPrev(){
  const el=$("#namePrev"); if(!el) return;
  const d=D(); const r=d&&(d.rows.find(x=>!isBlock(x)&&(x.action||x.shot))||d.rows.find(x=>!isBlock(x)));
  el.textContent=r?("Example (take "+nextTake(r,d)+"): "+(shotName(r,d,nextTake(r,d))||"(every part is switched off)")):"Add a shot to this day to see an example name.";
}
function keyCell(p,allKeys){
  const w=h("div",{class:"toolbar"});
  if(IS_ADMIN){
    const k=allKeys[p.id];
    if(k){ const shown=h("code",{},"••••-••••-••••-••••");
      w.append(shown,h("button",{class:"btn small",onclick:()=>{shown.textContent=shown.textContent.includes("•")?k:"••••-••••-••••-••••"}},"Show"),
        h("button",{class:"btn small",onclick:async()=>toast(await copyText(k)?"Key copied":"Couldn't copy")},"Copy"),
        h("button",{class:"btn small danger",title:"Make a new key: everyone on this project needs the new one",onclick:()=>changeKey(p,true)},"Change")); }
    else w.append(h("span",{class:"note"},"No key yet (only you can open it) "),h("button",{class:"btn small primary",onclick:()=>changeKey(p,false)},"Create key"));
  } else w.append(h("span",{class:"note"},KEYS[p.id]?"Saved on this device ":""),h("button",{class:"btn small",title:"Take this project and its key off this device",onclick:async()=>{
    if(!(await ask("Remove "+(p.name||p.id)+" from this device?","Its key and the copy on this device are removed. The project itself is untouched for the team; you'd need the key again to open it.","Remove from this device")))return;
    if(p.id===pid()&&pending.length) await flush();
    forgetLocal(p.id); await loadProjects(); const next=projects.find(x=>!x.archived);
    if(p.id===pid()){ if(next) await openProject(next.id); else showKeyPrompt(null,"Enter a project key to open a project."); }
    renderSetTab(); toast("Removed from this device")}},"Remove from this device"));
  return w;
}
async function changeKey(p,existing){
  if(existing&&!(await ask("Change the key for "+(p.name||p.id)+"?","The old key stops working straight away. Everyone on this project will need the new key, and devices still using the old one drop the project until they enter it. Use this when someone leaves the job.","Change key")))return;
  try{const r=await api("/api/projects",{action:"setKey",id:p.id},{noProject:true});KEYS[p.id]=r.key;saveKeys();renderSetTab();
    toast("New key: "+r.key+" (copied)");copyText(r.key)}catch(e){toast("Couldn't change it: "+e.message)}
}
async function renderProjectsTab(b){
  const keyed=MODE==="team"&&PROJECT_KEYS;
  b.append(h("p",{class:"note"},MODE!=="team"?"Projects saved in this browser.":keyed?(IS_ADMIN?"Every project on the site (you're the admin). Each one has its own key: people only see the projects whose keys they've been given.":"The projects you hold keys for. Each project has its own key, so other projects on this site stay private to their teams."):"Projects on the team site. Everyone who can open the site can open them. To keep projects private from each other, see Help > Separate teams."));
  if(keyed){ const ki=h("input",{placeholder:"Paste a project key",autocomplete:"off",spellcheck:"false",style:"max-width:16rem"});
    const go=async()=>{try{const r=await useKey(ki.value);if(!r){toast("That key doesn't match a project");return}if(r.id){await openProject(r.id);toast("Added "+r.name)}renderSetTab()}catch(e){toast(e.message)}};
    ki.addEventListener("keydown",e=>{if(e.key==="Enter")go()});
    b.append(h("div",{class:"toolbar",style:"margin-bottom:.6rem"},ki,h("button",{class:"btn small primary",onclick:go},"Add project"))); }
  let allKeys={}; if(keyed&&IS_ADMIN){try{allKeys=(await api("/api/projects",{action:"getKeys"},{noProject:true})).keys||{};Object.assign(KEYS,allKeys);saveKeys()}catch(e){}}
  const t=h("table",{class:"plain"}); t.append(h("thead",{},h("tr",{},h("th",{},"Project"),h("th",{},""),h("th",{},""),keyed?h("th",{},"Project key"):null)));
  const tb=h("tbody",{}); t.append(tb); b.append(t);
  try{await loadProjects()}catch(e){tb.append(h("tr",{},h("td",{colspan:3,class:"err"},"Couldn't load projects: "+e.message)))}
  const list=projects.filter(p=>!p.archived);
  for(const p of list){
    const cur=p.id===pid();
    tb.append(h("tr",{},h("td",{},h("b",{},p.name||p.id),cur?h("span",{class:"note"}," (open)"):null),
      h("td",{},cur?"":h("button",{class:"btn small",onclick:async()=>{await openProject(p.id);$("#setModal").classList.remove("open");toast("Opened "+(p.name||p.id))}},"Open")),
      h("td",{},cur?"":h("button",{class:"btn small danger",onclick:async()=>{if(!(await ask("Remove "+(p.name||p.id)+"?",MODE==="team"?"It's hidden for everyone, not erased: it can be restored from the archived list below.":"This deletes it from this browser. Export it first if you want a copy.","Remove")))return;
        if(MODE==="team"){await api("/api/projects",{action:"archive",id:p.id},{noProject:true})}else{const l=lsGet("shotlist2-projects",[]).filter(x=>x.id!==p.id);lsSet("shotlist2-projects",l);["base","seed","meta","pending"].forEach(k=>lsDel(PKEY(p.id,k)))}
        renderSetTab()}},"Remove")),
      keyed?h("td",{},keyCell(p,allKeys)):null));
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
// the project file carries its storyboard pictures too, so it can be opened in another project or site
async function saveFile(){
  commit(); const refs=new Set(); S.days.forEach(d=>d.rows.forEach(r=>["ref1","ref2","ref3","scribble"].forEach(k=>{if(String(r[k]||"").startsWith("img:"))refs.add(r[k])})));
  const pictures={}; let n=0; for(const ref of refs){ toast(`Packing pictures: ${++n} of ${refs.size}…`); const du=await refToDataUrl(ref); if(du) pictures[ref]=du; }
  download(fileBase()+".shotlist.json",JSON.stringify({app:"shotlist-scheduler",version:VERSION,saved:new Date().toISOString(),doc:S,pictures}),"application/json");
  toast("Exported "+fileBase()+".shotlist.json"+(refs.size?` with ${Object.keys(pictures).length} picture${Object.keys(pictures).length===1?"":"s"}`:""));
}
function csvEsc(v){v=v==null?"":String(v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function exportCSV(){
  commit();
  const head=["Day","Kind","Date","Order","Type","Shot #","Shot name (last take)","Takes","Screen duration","Setup (min)","Setup from","Start","Shoot (min)","End","Original start","Action","Performer(s)","# Performers","Genre","Body","Face","Glove","Hero","Safety","Priority","Location / Setup","Description","Script / Dialogue","Shot type","Camera","Lighting","VFX notes","Director notes","Prop / set notes","Shot (done)","Cut","Hero link","Safety link"];
  const customs=cols().filter(c=>c.custom); head.push(...customs.map(c=>c.label));
  const lines=[head.map(csvEsc).join(",")];
  for(const d of live()){const C=compute(d);d.rows.forEach((r,i)=>{const c=C.rows[r.id];const br=isBlock(r);const t=br?0:lastTake(r,d);
    lines.push([d.name,d.kind==="capture"?"Mocap":"Live Action",d.date||"",i+1,br?(r.type==="tech"?"Tech":"Break/Move"):"Shot",br?blockName(r):r.shot,br?"":shotName(r,d,t||null),br?"":(Number(r.takes)||0),br?"":r.duration,br?"":Math.round(c.su),br?"":hhmm(c.setupStart),hhmm(c.start),Math.round(c.sh),hhmm(c.end),r.origStart||"",
      br?"":r.action,br?"":r.performers,br?"":r.perfCount,br?"":r.genre,br?"":(isOn(r.body)?"Y":""),br?"":(isOn(r.face)?"Y":""),br?"":(isOn(r.glove)?"Y":""),br?"":r.hero,br?"":r.safety,br?"":r.priority,
      br?"":r.location,r.description||"",br?"":r.script,br?"":r.shotType,br?"":r.camera,br?"":(r.lighting||""),br?"":r.vfx,br?"":r.director,br?"":r.props,br?"":(r.done?"Yes":""),br?"":(r.cut?"Yes":""),br?"":(r.heroUrl||""),br?"":(r.safetyUrl||""),...customs.map(cc=>br?"":(cc.type==="flag"?(isOn(r[cc.key])?"Y":""):(r[cc.key]??"")))].map(csvEsc).join(","))})}
  download(fileBase()+".csv","﻿"+lines.join("\r\n"),"text/csv");
}
/* Cast & crew order: ↑ ↓ buttons, or drag the ⠿ handle (mouse or touch). Order is shared with the team. */
function setGroupOrder(group,ids){
  const by=new Map(S.people.map(p=>[p.id,p])); const moved=ids.map(id=>by.get(id)).filter(Boolean);
  const out=[]; let placed=false;
  for(const p of S.people){ if((p.group||"Crew")===group){ if(!placed){out.push(...moved);placed=true} } else out.push(p) }
  if(!placed) out.push(...moved);
  S.people=out; commit(); renderSetTab();
}
function movePerson(group,id,to){
  const ids=S.people.filter(p=>(p.group||"Crew")===group).map(p=>p.id); const from=ids.indexOf(id);
  if(from<0||to<0||to>=ids.length) return; ids.splice(to,0,ids.splice(from,1)[0]); setGroupOrder(group,ids);
  setTimeout(()=>{const b=$(`#setBody table.people[data-group="${group}"] tr[data-id="${id}"] td.mv button:${to<from?"first-child":"nth-child(2)"}`);if(b&&!b.disabled)b.focus();else{const o=$(`#setBody tr[data-id="${id}"] td.mv button`);o&&o.focus()}},0);
}
function dragPerson(e,tr,tb,group){
  e.preventDefault(); const handle=document;
  const start=[...tb.children].map(r=>r.dataset.id); tr.classList.add("dragging");
  const move=ev=>{ if(ev.pointerId!==e.pointerId) return; const rows=[...tb.children].filter(r=>r!==tr);
    const after=rows.find(r=>{const b=r.getBoundingClientRect();return ev.clientY<b.top+b.height/2});
    if(after){ if(tr.nextSibling!==after) tb.insertBefore(tr,after) } else if(tb.lastChild!==tr) tb.append(tr);
    const box=$("#setModal .box"); if(box){const b=box.getBoundingClientRect(); if(ev.clientY<b.top+40) box.scrollTop-=12; else if(ev.clientY>b.bottom-40) box.scrollTop+=12} };
  const end=()=>{ handle.removeEventListener("pointermove",move); handle.removeEventListener("pointerup",end); handle.removeEventListener("pointercancel",end); tr.classList.remove("dragging");
    const ids=[...tb.children].map(r=>r.dataset.id); if(ids.join()!==start.join()) setGroupOrder(group,ids); };
  handle.addEventListener("pointermove",move); handle.addEventListener("pointerup",end); handle.addEventListener("pointercancel",end);
}
function exportPeople(){const lines=[["Group","Name","Role","Phone","Email","Notes"].join(",")];for(const p of S.people)lines.push([p.group,p.name,p.role,p.phone,p.email,p.notes].map(csvEsc).join(","));download(fileBase()+"_cast_crew.csv","﻿"+lines.join("\r\n"),"text/csv")}
const ROW_BLANK={type:"shot",shot:"",label:"",duration:"",setup:0,shoot:0,origStart:"",origSetup:0,origShoot:0,location:"",description:"",script:"",shotType:"",camera:"",lighting:"",vfx:"",director:"",props:"",ref1:"",ref2:"",ref3:"",scribble:"",done:false,priority:"",perfCount:"",performers:"",genre:"",action:"",body:false,face:false,glove:false,hero:"",safety:"",takes:0,takeLog:null};
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
  let doc=null, pictures={};
  try{const raw=JSON.parse(await file.text());doc=parseProjectFile(raw);pictures=(raw&&raw.pictures)||{}}catch(e){}
  if(!doc){toast("That isn't a project file this tool can read");return}
  // pictures packed in the file go back on their shots as data, then into whichever project receives them
  for(const d of doc.days) for(const r of d.rows) for(const k of ["ref1","ref2","ref3","scribble"]) if(r[k]&&pictures[r[k]]) r[k]=pictures[r[k]];
  if(importMode==="replace"){
    if(!(await ask("Replace this project?",MODE==="team"?"Everything in "+(S.project.name||"this project")+" is replaced for the whole team. You can Undo straight afterwards.":"Everything in "+(S.project.name||"this project")+" is replaced. You can Undo straight afterwards.","Replace")))return;
    { const pend=[]; for(const d of doc.days) for(const r of d.rows) for(const k of ["ref1","ref2","ref3","scribble"]) if(String(r[k]||"").startsWith("data:")) pend.push([r,k]);
      let n=0; for(const [r,k] of pend){ toast(`Adding pictures: ${++n} of ${pend.length}…`); try{ r[k]=await storePicture(r[k]); }catch(e){ r[k]=""; } } }
    commit(); S.project=doc.project; S.cfg=doc.cfg; S.people=doc.people; S.cols=doc.cols; S.days=doc.days; commit(); P.activeByProject[pid()]=S.days[0]&&S.days[0].id; renderAll(); toast("Imported into this project");
  }else{
    const name=doc.project.name||file.name.replace(/\..*$/,"");
    try{const pend=takeDataRefs(doc.days);const id=await createProject(name,docToSeed(doc));await openProject(id);$("#setModal").classList.remove("open");await putDataRefs(pend);toast("Imported "+name)}catch(e){toast("Couldn't import: "+e.message)}
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
  { const t=P.colTint||"subtle"; document.body.classList.toggle("colgroups",t!=="off"); const k=dark?1.35:1; root.style.setProperty("--gb",(t==="strong"?9:5)*k+"%"); root.style.setProperty("--gh",(t==="strong"?22:14)*k+"%"); }
  const tl=P.tl||{}; [["setup","--setup"],["shoot","--shoot"],["break","--break"],["tech","--tech"],["wrap","--wrapc"]].forEach(([k,v])=>{if(tl[k])root.style.setProperty(v,tl[k]);else root.style.removeProperty(v)});
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
  try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),4000);const r=await fetch("/api/ping",{signal:ctl.signal,cache:"no-store",headers:{"x-admin-key":adminKey()}});clearTimeout(t);
    if(r.ok){const j=await r.json().catch(()=>null);if(j&&j.app==="shotlist-scheduler"){NEEDS_KEY=!!j.needsKey;P.needsKey=NEEDS_KEY;PROJECT_KEYS=!!j.projectKeys;IS_ADMIN=!!j.admin;return "team"}return "local"}
    return P.wasTeam?"unreachable":"local";
  }catch(e){return P.wasTeam?"unreachable":"local"}
}
function needKey(msg){
  clearTimeout(syncTimer); clearTimeout(flushTimer);
  $("#joinName").value=P.name||""; $("#joinKey").value=""; $("#joinErr").textContent=msg||"";
  $("#joinKeyRow").style.display=NEEDS_KEY?"":"none"; $("#joinKeyNote").style.display=NEEDS_KEY?"":"none";
  $("#joinPKeyRow").style.display=PROJECT_KEYS&&!IS_ADMIN&&!(P.projectId&&KEYS[P.projectId])&&!Object.keys(KEYS).length?"":"none";
  $("#joinModal").classList.add("open"); updateStatus();
}
async function startTeam(){
  try{
    await loadProjects();
    let ok=projects.filter(p=>!p.archived);
    if(!ok.length&&PROJECT_KEYS&&!IS_ADMIN){ $("#joinModal").classList.remove("open"); P.wasTeam=true; savePrefs(); showKeyPrompt(null,"Enter the project key you were sent to open your project."); return; }
    if(!ok.length){ await createProject("Untitled project",blankSeed("Untitled project")); ok=projects.filter(p=>!p.archived); }
    if(!P.projectId||!ok.some(p=>p.id===P.projectId)) P.projectId=(ok[0]||{}).id;
    $("#joinModal").classList.remove("open");
    P.wasTeam=true; savePrefs();
    await openProject(P.projectId);
    checkFeedback();
  }catch(e){ if(e.status===401) needKey(e.message); else { netErr=e.message; backoff=4000; updateStatus(); toast("Can't reach the team site: "+e.message); setTimeout(startTeam,5000) } }
}
let teamAvailable=false;
function rejoinTeam(){P.mode=null;savePrefs();location.reload()}
function showRejoin(){
  const st=$("#status"); if(!st) return;
  if(!$("#rejoinBtn")) st.after(h("button",{class:"btn small primary noprint",id:"rejoinBtn",title:"Go back to the shared team schedule",onclick:rejoinTeam},"Rejoin team project"));
  $("span",st).textContent="Working offline (your choice)";
  st.title="You chose Work offline, so this browser is using its own copy. Click Rejoin team project to go back to the shared schedule.";
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
  $("#changelog").append(...CHANGELOG.map(([v,d,t],i)=>h("li",{class:i>=4?"older":""},h("b",{},"v"+v),(i===0&&d?" ("+d+")":"")+" - "+t)),h("li",{class:"more"},h("button",{class:"btn small",onclick:e=>{$("#changelog").classList.add("all");e.target.parentElement.remove()}},"Show all versions")));
  buildHelpNav();
  setTimeout(checkVersion,5000); setInterval(checkVersion,60000);
  if(/[?&]team\b/.test(location.search)&&P.mode==="local-forced"){P.mode=null;savePrefs()}
  if(P.mode==="local-forced"){
    // chose to work offline: open the local copy, but check whether the team site is here so they can get back
    await startLocal();
    detectTeam().then(w=>{if(w==="team"){teamAvailable=true;showRejoin()}}).catch(()=>{});
    return;
  }
  { const q=new URLSearchParams(location.search), pq=q.get("p"); const hk=new URLSearchParams(location.hash.slice(1)).get("k"); if(pq&&hk){KEYS[pq]=hk.trim().toLowerCase();saveKeys();history.replaceState(null,"",location.pathname+location.search)} if(pq){P.projectId=pq;savePrefs();q.delete("p");history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:""))} }
  const where=await detectTeam();
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
$("#dupDayBtn").onclick=()=>{commit();const c=clone(D());c.id=uid("d");c.name=(c.name||"Day")+" (copy)";c.frozen=false;c.wrapNotes="";c.rows.forEach(r=>{r.id=uid("r");r.done=false;r.takes=0});delete c.pos;S.days.splice(S.days.indexOf(D())+1,0,c);P.activeByProject[pid()]=c.id;commit();renderAll();toast("Copied day")};
$("#tlColours").onclick=e=>{e.preventDefault();openSettings("display");setTimeout(()=>{const f=$("#colourForm");if(f)f.scrollIntoView({block:"start"})},50)};
$("#bandToggle").onclick=()=>{const c=$("#dayControls");const o=c.classList.toggle("open");$("#bandToggle").setAttribute("aria-expanded",o);$("#bandArrow").textContent=o?"▴":"▾"};
// iPhone / iPad zoom into small inputs on tap; stop that without blocking pinch-zoom (iOS still allows pinch)
if(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)){const m=document.querySelector("meta[name=viewport]");if(m)m.content="width=device-width, initial-scale=1, maximum-scale=1"}
$("#shareBtn").onclick=openShare;
$("#slateBtn").onclick=openSlate; $("#notesBtn").onclick=openNotes;
document.addEventListener("keydown",e=>{ if(e.target.closest&&e.target.closest("input,textarea,select"))return;
  // browser and system shortcuts (Ctrl/Cmd+R reload, Cmd+F find, Alt+…) are left alone
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  const k=e.key.toLowerCase();
  if($("#slateView").classList.contains("open")){ if(e.key==="Escape"){if($("#slSet").classList.contains("open"))$("#slSet").classList.remove("open");else closeSlate()} else if(e.key==="ArrowRight")slateStep(1); else if(e.key==="ArrowLeft")slateStep(-1); else if(e.key===" "||k==="c"){e.preventDefault();clap()} else if(k==="x"||k==="."){e.preventDefault();slateCut()} else if(k==="f")toggleFull($("#slateView")); }
  else if($("#seqView").classList.contains("open")){ const a=SQV.id&&R(SQV.id);
    if(e.key==="Escape")closeSeqView(); else if(e.key==="ArrowRight")seqStep(1); else if(e.key==="ArrowLeft")seqStep(-1);
    else if(k==="r"&&a){if(rollingTake(a))cutTake(a.id);else logTake(a.id,a&&D().kind!=="capture"?{caught:[]}:{});renderSeqView()}
    else if(k==="t"&&a){logTake(a.id,D().kind!=="capture"?{caught:[]}:{});renderSeqView()}
    else if(["g","n","h","s"].includes(k)&&a){const l=takeList(a);const last=l[l.length-1];if(last){const m={g:"good",n:"ng",h:"hero",s:"safety"}[k];last.mark=last.mark===m?"":m;setTakeList(a,l);syncMarks(a);commit();renderSeqView()}}
    else if(k==="f")toggleFull($("#seqView")); }
  else if($("#noteView").classList.contains("open")){ const r=NV.id&&R(NV.id);
    if(e.key==="Escape")closeNotes(); else if(e.key==="ArrowRight")notesStep(1); else if(e.key==="ArrowLeft")notesStep(-1);
    else if(k==="r"&&r){if(rollingTake(r))cutTake(r.id);else logTake(r.id);renderNotes()}
    else if(k==="t"&&r){logTake(r.id);renderNotes()}
    else if(["g","n","h","s"].includes(k)&&r){const a=takeList(r);const last=a[a.length-1];if(last){const m={g:"good",n:"ng",h:"hero",s:"safety"}[k];last.mark=last.mark===m?"":m;setTakeList(r,a);syncMarks(r);commit();renderNotes()}}
    else if(k==="f")toggleFull($("#noteView")); } });
function toggleFull(el){ if(!document.fullscreenEnabled) return; document.fullscreenElement?document.exitFullscreen().catch(()=>{}):el.requestFullscreen().catch(()=>{}); }
$("#keyGo").onclick=submitKey; $("#keyInput").addEventListener("keydown",e=>{if(e.key==="Enter")submitKey()});
$("#archDayBtn").onclick=async()=>{const d=D();if(!d)return;if(!(await ask("Archive "+d.name+"?","The tab is put away for everyone. Nothing is deleted: restore it any time from the Archived tab at the end of the day tabs.","Archive day")))return;d.archived=true;P.activeByProject[pid()]=null;commit();savePrefs();renderAll();toast("Archived "+d.name+" - restore it from Archived")};
$("#resetBtn").onclick=async()=>{const d=D();const seed=await getSeed();const o=seed&&(seed.days||[]).find(x=>x.id===d.id);if(!o){toast("This day wasn't imported, so there's nothing to reset to");return}
  if(!(await ask("Reset "+d.name+"?","Puts this day back exactly as it was imported"+(MODE==="team"?", for everyone":"")+". Undo straight afterwards brings your version back.","Reset")))return;
  const n=normDoc({days:[o]}).days[0];n.id=d.id;S.days[S.days.indexOf(d)]=n;commit();renderAll();toast("Reset "+d.name+" - Undo to go back")};
$("#undoBtn").onclick=undo; $("#redoBtn").onclick=redo;
$("#csvBtn").onclick=exportCSV;
$("#impBtn").onclick=()=>{commit();$("#sheetInput").value="";$("#sheetInput").click()};
$("#sheetInput").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;if(/\.pdf$/i.test(f.name)||f.type==="application/pdf")openPdfImport(f);else openImport(f)});
$("#impSheet").addEventListener("change",e=>setImpSheet(e.target.value));
$("#impHeader").addEventListener("change",e=>{IMP.header=Math.max(0,Math.min(IMP.rows.length-1,(Number(e.target.value)||1)-1));buildImpMap()});
["impGroup","impTakes","impDest"].forEach(id=>$("#"+id).addEventListener("change",updImpInfo));
$("#impGo").onclick=runImport;
$("#xlsxBtn").onclick=()=>{commit();openExport()};
$("#expGo").onclick=exportXlsx;
$("#updateGo").onclick=refreshForUpdate; $("#updateLater").onclick=()=>$("#updateBar").classList.remove("show");
document.addEventListener("dragover",e=>{if([...(e.dataTransfer||{}).types||[]].includes("Files"))e.preventDefault()});
document.addEventListener("drop",e=>{const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(!f)return;e.preventDefault();if(/\.json$/i.test(f.name)){importMode="new";importFile(f)}else if(/\.pdf$/i.test(f.name)||f.type==="application/pdf")openPdfImport(f);else openImport(f)}); $("#printBtn").onclick=()=>window.print();
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
document.addEventListener("click",e=>{if(e.target.isConnected&&!$("#colMenu").contains(e.target))$("#colMenu").classList.remove("open");if(!$("#fileBtn").contains(e.target)){$("#fileMenu").classList.remove("open");$("#fileBtn").setAttribute("aria-expanded","false")}});
// phone menu items stand in for the toolbar buttons that fold away
$$("#filePop [data-proxy]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();$("#fileMenu").classList.remove("open");$("#fileBtn").setAttribute("aria-expanded","false");const t=$("#"+b.dataset.proxy);if(t)t.click()}));
$("#fileBtn").onclick=e=>{e.stopPropagation();const o=$("#fileMenu").classList.toggle("open");$("#fileBtn").setAttribute("aria-expanded",o);$("#colMenu").classList.remove("open")};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#fileMenu").classList.contains("open")){$("#fileMenu").classList.remove("open");$("#fileBtn").focus()}});
$("#addShot").onclick=addShot; $("#addBreak").onclick=()=>D()&&insertBreakAt(D().rows.length); $("#addTech").onclick=()=>D()&&insertBreakAt(D().rows.length,"tech");
$("#pasteBtn").onclick=()=>{if(frozenNo())return;$("#pasteText").value="";$("#pasteModal").classList.add("open");$("#pasteText").focus()};
$("#pasteGo").onclick=()=>{const lines=$("#pasteText").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);const d=D();if(!lines.length||!d)return;
  const counts={};lines.forEach(a=>{const k=a.toLowerCase();counts[k]=(counts[k]||0)+1});
  for(const a of Object.keys(counts).length===lines.length?lines:[...new Set(lines.map(x=>x))]) d.rows.push(newShot({action:a,description:d.kind==="capture"?"":a}));
  commit();renderBody();$("#pasteModal").classList.remove("open");toast("Added "+lines.length+" shot"+(lines.length>1?"s":""))};
$("#fileInput").addEventListener("change",e=>{const f=e.target.files[0];if(f)importFile(f)});
$("#imgInput").addEventListener("change",e=>{const f=e.target.files[0];if(!f||!imgTarget)return;const tgt=imgTarget;imgTarget=null;const img=new Image();const rd=new FileReader();
  rd.onload=()=>{img.onload=async()=>{const sc=Math.min(1,640/img.width,420/img.height);const cv=document.createElement("canvas");cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
    let ref=cv.toDataURL("image/jpeg",.78);
    if(MODE==="team"){try{ref=(await api("/api/image",{data:ref})).ref}catch(err){toast("Couldn't upload the image: "+err.message);return}}
    const x=R(tgt.id);if(!x)return;x[tgt.key]=ref;commit();renderBody()};img.src=rd.result};rd.readAsDataURL(f)});
$("#joinGo").onclick=async()=>{const name=$("#joinName").value.trim(),key=$("#joinKey").value.trim();if(!name){$("#joinErr").textContent="Add your name so the team can see who's editing.";return}if(NEEDS_KEY&&!key){$("#joinErr").textContent="Enter the team key.";return}
  P.name=name;P.teamKey=key;P.mode=null;savePrefs();$("#joinErr").textContent="Checking…";
  try{await api("/api/projects",undefined,{noProject:true});
    const pk=$("#joinPKey").value.trim();
    if(pk){ const ok=await useKey(pk); if(!ok){$("#joinErr").textContent="That key doesn't match a project. Check it with whoever sent it.";return} }
    $("#joinErr").textContent="";await startTeam()}catch(e){$("#joinErr").textContent=e.message}};
$("#joinKey").addEventListener("keydown",e=>{if(e.key==="Enter")$("#joinGo").click()});
$("#joinLocal").onclick=async()=>{const nm=$("#joinName").value.trim();if(nm)P.name=nm;P.mode="local-forced";savePrefs();$("#joinModal").classList.remove("open");await startLocal();toast("Working offline in this browser. Settings > Team & sync explains how to join later.")};
document.addEventListener("keydown",e=>{
  if(e.key==="Escape") $$(".modal.open").forEach(m=>{if(!["joinModal","keyModal"].includes(m.id))m.classList.remove("open")});
  const tag=(document.activeElement||{}).tagName; if(tag==="TEXTAREA"||tag==="INPUT"||tag==="SELECT") return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}
});
document.addEventListener("visibilitychange",()=>{if(MODE==="team"&&!document.hidden){scheduleSync(100)}});
window.addEventListener("online",()=>{if(MODE==="team"){backoff=0;scheduleFlush(100);scheduleSync(200)}});
window.addEventListener("beforeunload",e=>{commit();if(MODE==="team"&&pending.length){e.preventDefault();e.returnValue=""}});

/*__SHOOT__*/
boot();
