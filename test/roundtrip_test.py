from playwright.sync_api import sync_playwright
import openpyxl, json
def boot(pw):
    b=pw.chromium.launch(); errs=[]
    pg=b.new_context(viewport={"width":1500,"height":900},accept_downloads=True).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("http://localhost:8888/"); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName","Leo"); pg.click("#joinGo")
    pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0"); return b,pg,errs
with sync_playwright() as pw:
    b,pg,errs=boot(pw)
    pg.evaluate("()=>{S.cols.push({id:'runner',label:'Runner notes',type:'list',options:'Go,Wait'});const d=S.days.find(x=>x.name.startsWith('Day 3'));d.rows[1].c_runner='Wait';commit();renderAll()}")
    pg.click("#dayTabs .daytab:has-text('Day 3')"); pg.wait_for_timeout(300)
    snap=lambda: pg.evaluate("()=>{const d=D();return {name:d.name,kind:d.kind,date:d.date,call:d.call,wrap:d.wrap,cols:cols().filter(c=>!hidden().includes(c.key)).map(c=>c.label),rows:d.rows.map(r=>[r.type,r.shot,r.script,r.duration,r.origStart,r.ref1,r.c_runner||'',r.description,r.camera])}}")
    before=snap()
    pg.click("#xlsxBtn"); pg.wait_for_timeout(300)
    pg.evaluate("()=>$$('#expDays input').forEach(c=>c.checked=c.parentElement.textContent.includes('Day 3'))")
    with pg.expect_download() as d: pg.click("#expGo")
    d.value.save_as("/tmp/rt.xlsx")
    # edit in "Google Sheets"
    wb=openpyxl.load_workbook("/tmp/rt.xlsx"); ws=wb["Shotlist"]
    hdr={ws.cell(1,c).value:c for c in range(1,ws.max_column+1)}
    print("sheets:",wb.sheetnames,"| App data state:",wb["App data"].sheet_state,"| rid hidden:",ws.column_dimensions[openpyxl.utils.get_column_letter(hdr["App row ID"])].hidden)
    ws.cell(3,hdr["Description"]).value="EDITED IN SHEETS"
    ws.cell(4,hdr["Technical Notes"]).value=None
    r5=[ws.cell(5,c).value for c in range(1,ws.max_column+1)]
    for c in range(1,ws.max_column+1): ws.cell(5,c).value=None   # delete a shot
    n=3
    while ws.cell(n,hdr["App row ID"]).value: n+=1
    ws.cell(n,hdr["Shot #"]).value="99"; ws.cell(n,hdr["Description"]).value="Added in sheets"; ws.cell(n,hdr["Shoot Day"]).value=3
    wb.save("/tmp/rt2.xlsx")
    for dest in ("restore","newproject"):
        pg.evaluate("()=>{$('#sheetInput').value=''}"); pg.set_input_files("#sheetInput","/tmp/rt2.xlsx"); pg.wait_for_selector("#impModal.open",timeout=15000); pg.wait_for_timeout(400)
        print(dest,"default dest:",pg.evaluate("()=>$('#impDest').value"),"| custom col maps to:",pg.evaluate("()=>{const i=IMP.map.findIndex(m=>m.h==='Runner notes');return IMP.map[i]&&IMP.map[i].t}"))
        ncols=pg.evaluate("()=>S.cols.length")
        pg.select_option("#impDest",dest); pg.click("#impGo"); pg.wait_for_timeout(1500)
        after=snap()
        print(" name/kind/date/call:",after["name"],after["kind"],after["date"],after["call"],"| cols same:",after["cols"]==before["cols"], "| S.cols:",pg.evaluate("()=>S.cols.map(c=>c.label+':'+c.type)"))
        if after["cols"]!=before["cols"]: print("  ",before["cols"],"\n  ",after["cols"])
        print(" rows before/after:",len(before["rows"]),len(after["rows"]))
        print(" row0:",after["rows"][0][7], "| row1 camera emptied:",repr(after["rows"][1][8]),"| runner kept:",after["rows"][1][6])
        bm={(r[0],r[1]):r for r in before["rows"]}; bad=[(r[1],r[2:6],bm[(r[0],r[1])][2:6]) for r in after["rows"] if (r[0],r[1]) in bm and r[2:6]!=bm[(r[0],r[1])][2:6]]
        print(" script/dur/origStart/refs kept:",not bad, bad[:2], "| missing:",[k for k in bm if k not in {(r[0],r[1]) for r in after["rows"]}])
        print(" last row:",after["rows"][-1][1],after["rows"][-1][7])
        if dest=="restore": pg.evaluate("()=>{undo&&undo()}") 
    print("errors",errs); b.close()
