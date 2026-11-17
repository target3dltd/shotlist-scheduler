import json, time
from playwright.sync_api import sync_playwright
URL="http://localhost:8888/"
with sync_playwright() as pw:
    b=pw.chromium.launch(); errs=[]
    def mk(name):
        ctx=b.new_context(viewport={"width":1500,"height":950},permissions=["clipboard-read","clipboard-write"],accept_downloads=True)
        pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(name+": "+str(e)))
        pg.goto(URL); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName",name); pg.click("#joinGo")
        pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0"); pg.evaluate("()=>{P.poll=2}"); return pg
    A=mk("Alice"); B=mk("Bob")
    print("tabs:", A.evaluate("()=>$$('#dayTabs .daytab').map(b=>b.textContent)"))
    print("kind options:", A.evaluate("()=>$$('#dayKind option').map(o=>o.textContent)"))
    print("priority visible on LA + Mocap:", A.evaluate("()=>{const out=[];for(const id of ['lv','d1']){P.activeByProject[pid()]=id;renderAll();out.push(!hidden().includes('priority'))}return out}"))
    # both add a column at the same time through Settings UI
    for pg,label in ((A,"Mic"),(B,"Wardrobe")):
        pg.click("#setBtn"); pg.click("#setTabs >> text=Columns"); pg.click("#addColBtn"); pg.wait_for_timeout(150)
        inp=pg.locator("#setBody table.plain >> nth=0").locator("tbody tr").last.locator("input").first; inp.fill(label); inp.dispatch_event("change")
    A.locator("#setBody table.plain >> nth=0").locator("tbody tr").last.locator("select").select_option("flag")
    A.wait_for_timeout(200)
    # tick 'In shot name' for Mic
    A.locator("#setBody table.plain >> nth=0").locator("tbody tr").last.locator("input[type=checkbox]").check(); A.wait_for_timeout(200)
    for pg in (A,B): pg.click("#setModal [data-close]")
    time.sleep(6); 
    for pg in (A,B): pg.evaluate("()=>syncNow()")
    time.sleep(3)
    print("cols A:", A.evaluate("()=>S.cols.map(c=>c.label+':'+c.type)"), "| cols B:", B.evaluate("()=>S.cols.map(c=>c.label+':'+c.type)"))
    # values: Bob fills Wardrobe on Day 4 row, Alice ticks Mic
    A.evaluate("()=>{P.activeByProject[pid()]='d4';renderAll();D().rows.push(newShot({action:'walk_cycle',performers:'Victoria',perfCount:1,body:true}));commit();renderAll()}")
    time.sleep(5); B.evaluate("()=>syncNow()"); time.sleep(2)
    B.evaluate("()=>{P.activeByProject[pid()]='d4';renderAll();const w=S.cols.find(c=>c.label==='Wardrobe');D().rows[0]['c_'+w.id]='Suit A';D().rows[0].priority='HIGH';commit();renderAll()}")
    A.evaluate("()=>{const m=S.cols.find(c=>c.label==='Mic');D().rows[0]['c_'+m.id]=true;commit();renderAll()}")
    time.sleep(6); 
    for pg in (A,B): pg.evaluate("()=>syncNow()")
    time.sleep(3)
    for pg,n in ((A,"A"),(B,"B")):
        print(n, pg.evaluate("()=>{const r=D().rows[0];return [r.priority,Object.entries(r).filter(([k])=>k.startsWith('c_')).map(([k,v])=>colMap()[k].label+'='+v).join(','),shotName(r,D(),1)]}"))
    print("row prio class:", A.evaluate("()=>$('#grid tbody tr').className"), "| select class:", A.evaluate("()=>$('#grid tbody tr select[data-k=priority]').className"))
    # rename builtin, sort by priority
    A.evaluate("()=>{S.cfg.colLabels={hero:'Hero code'};commit();renderAll()}")
    print("header renamed:", A.evaluate("()=>$('#grid th[data-col=hero] .thl').textContent"))
    # delete Mic then undo
    A.evaluate("()=>{S.cols=S.cols.filter(c=>c.label!=='Mic');commit();renderAll()}"); 
    print("after delete:", A.evaluate("()=>S.cols.map(c=>c.label)"), "name:", A.evaluate("()=>shotName(D().rows[0],D(),1)"))
    A.evaluate("()=>{undo();undo()}"); print("after undo x2:", A.evaluate("()=>S.cols.map(c=>c.label)"), A.evaluate("()=>colMap()['hero'].label"), "mic value back:", A.evaluate("()=>{const m=S.cols.find(c=>c.label==='Mic');return m&&D().rows[0]['c_'+m.id]}"))
    # xlsx export with custom columns, CSV header
    A.click("#xlsxBtn"); A.wait_for_timeout(200)
    with A.expect_download() as d: A.click("#expGo")
    d.value.save_as("test_out/tracker_cols.xlsx")
    with A.expect_download() as d: A.click("#csvBtn")
    d.value.save_as("test_out/cols.csv"); print("csv header tail:", open("test_out/cols.csv",encoding="utf-8-sig").readline().strip().split(",")[-3:])
    # import a CSV with an unknown heading -> new column
    open("test_out/newcol.csv","w").write("Action,Performer(s),Lens,Rig ready\nrun,Victoria,35mm,yes\njump,Victoria,50mm,no\n")
    A.set_input_files("#sheetInput","test_out/newcol.csv"); A.wait_for_selector("#impModal.open"); A.wait_for_timeout(300)
    print("import map:", A.evaluate("()=>IMP.map.map(m=>m.h+'→'+m.t).join(', ')"))
    A.select_option("#impDest","append"); A.click("#impGo"); A.wait_for_timeout(400)
    print("cols after import:", A.evaluate("()=>S.cols.map(c=>c.label+':'+c.type+(c.options?'['+c.options+']':''))"))
    A.screenshot(path="test_out/cols_grid.png")
    print("ERRORS:", errs); b.close()
