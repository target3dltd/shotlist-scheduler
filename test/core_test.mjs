import fs from "node:fs";
const src = fs.readFileSync(new URL("../src/model_core.js", import.meta.url), "utf8");
const M = new Function(src + "; return {applyOp,foldBatch,mergeModels,seedModel,materialize,assignPositions,diffDocs,cloneModel,opStamp,pad13};")();
const days=[{id:"d1",name:"Day 1",call:"09:00",wrap:"18:00",setupPct:100,shootPct:100,minSetup:0,rows:[
  {id:"a",type:"shot",shot:"1",setup:10,shoot:10},{id:"b",type:"shot",shot:"2",setup:10,shoot:10},{id:"c",type:"shot",shot:"3",setup:10,shoot:10},{id:"d",type:"shot",shot:"4",setup:10,shoot:10}]}];
const base=M.seedModel({project:{name:"T"},days});
let doc=M.materialize(base);
const clone=o=>JSON.parse(JSON.stringify(o));
// 1. move d to top -> only d's pos changes
let b=clone(doc); const [d]=b.days[0].rows.splice(3,1); b.days[0].rows.unshift(d);
let ops=M.diffDocs(doc,b); console.log("move-to-top ops:",JSON.stringify(ops.map(o=>[o.id,o.set])));
// 2. concurrent: Alice moves d to top, Bob edits c.setup and inserts row e after a
const alice=ops.map(({e,id,set})=>({e,id,set}));
let bob=clone(doc); bob.days[0].rows[2].setup=45; bob.days[0].rows.splice(1,0,{id:"e",type:"shot",shot:"1b",setup:5,shoot:5});
const bobOps=M.diffDocs(doc,bob).map(({e,id,set})=>({e,id,set}));
console.log("bob ops:",JSON.stringify(bobOps.map(o=>[o.id,Object.keys(o.set).join(",")])));
// server order A then B vs B then A, and duplicates
const bA={k:M.pad13(1000)+"-aaaa",ops:alice}, bB={k:M.pad13(1001)+"-bbbb",ops:bobOps};
const m1=M.foldBatch(M.foldBatch(M.cloneModel(base),bA),bB);
const m2=M.foldBatch(M.foldBatch(M.foldBatch(M.cloneModel(base),bB),bA),bB);
const s1=JSON.stringify(M.materialize(m1)), s2=JSON.stringify(M.materialize(m2));
console.log("order-independent:", s1===s2);
const out=M.materialize(m1).days[0].rows.map(r=>r.shot+(r.id==="c"?"(setup "+r.setup+")":""));
console.log("merged order:", out.join(" "));
// 3. same-field conflict: later stamp wins
const cA={k:M.pad13(2000)+"-x",ops:[{e:"row",id:"a",set:{setup:20}}]}, cB={k:M.pad13(2001)+"-y",ops:[{e:"row",id:"a",set:{setup:30}}]};
console.log("same field LWW:", M.materialize(M.foldBatch(M.foldBatch(M.cloneModel(m1),cB),cA)).days[0].rows.find(r=>r.id==="a").setup);
// 4. delete vs concurrent edit; undo restores data
const del={k:M.pad13(3000)+"-d",ops:[{e:"row",id:"b",set:{_del:true}}]}, ed={k:M.pad13(3001)+"-e",ops:[{e:"row",id:"b",set:{director:"note"}}]};
let m3=M.foldBatch(M.foldBatch(M.cloneModel(m1),del),ed);
console.log("deleted stays deleted:", !M.materialize(m3).days[0].rows.some(r=>r.id==="b"));
m3=M.foldBatch(m3,{k:M.pad13(3002)+"-u",ops:[{e:"row",id:"b",set:{_del:false}}]});
console.log("undo delete keeps later edit:", M.materialize(m3).days[0].rows.find(r=>r.id==="b").director);
// 5. many moves keep positions sane
let cur=M.materialize(m3), mm=M.cloneModel(m3);
for(let i=0;i<200;i++){ const nx=clone(cur); const rows=nx.days[0].rows; const [x]=rows.splice(i%rows.length,1); rows.splice((i*7)%rows.length,0,x);
  const o=M.diffDocs(cur,nx).map(({e,id,set})=>({e,id,set})); mm=M.foldBatch(mm,{k:M.pad13(5000+i)+"-m",ops:o}); const got=M.materialize(mm);
  if(JSON.stringify(got.days[0].rows.map(r=>r.id))!==JSON.stringify(nx.days[0].rows.map(r=>r.id))){console.log("ORDER MISMATCH at",i);break;} cur=got; }
console.log("200 random moves ok, order:", cur.days[0].rows.map(r=>r.shot).join(" "));
