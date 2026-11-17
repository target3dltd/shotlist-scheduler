import json, time, os
from playwright.sync_api import sync_playwright
URL="http://localhost:8888/"
with sync_playwright() as pw:
    b=pw.chromium.launch(); errs=[]
    ctx=b.new_context(viewport={"width":1500,"height":950},accept_downloads=True)
    pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName","Tester"); pg.click("#joinGo")
    pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0",timeout=10000)
    print("version:", pg.evaluate("()=>VERSION"))
    # --- export tracker xlsx (Day 1, Day 2, LV) ---
    pg.click("#xlsxBtn"); pg.wait_for_timeout(200)
    with pg.expect_download() as d: pg.click("#expGo")
    d.value.save_as("test_out/tracker.xlsx"); print("exported", os.path.getsize("test_out/tracker.xlsx"),"bytes")
    app_names=pg.evaluate("()=>{const out=[];for(const d of S.days){for(const r of d.rows){if(r.type==='break')continue;const b=takeBase(r,d),n=Math.max(1,Number(r.takes)||0);for(let t=1;t<=n;t++)out.push(shotName(r,d,b+t))}}return out}")
    json.dump(app_names,open("test_out/app_names.json","w"))
    # --- import their Shotlist tracker, split by Shoot Day ---
    pg.set_input_files("#sheetInput","/home/claude/src2/ref.xlsx"); pg.wait_for_selector("#impModal.open",timeout=15000); pg.wait_for_timeout(500)
    print("sheet:", pg.input_value("#impSheet"), "| header row:", pg.input_value("#impHeader"), "| dest:", pg.input_value("#impDest"), "| recorded:", pg.is_checked("#impTakes"))
    print("mapping:", pg.evaluate("()=>IMP.map.filter(m=>m.t!=='ignore').map(m=>m.h+'→'+m.t).join(', ')"))
    print("info:", pg.inner_text("#impInfo"))
    n_before=pg.evaluate("()=>S.days.length")
    pg.click("#impGo"); pg.wait_for_timeout(600)
    new=pg.evaluate(f"()=>S.days.slice({n_before}).map(d=>d.name+' ['+d.kind+'] '+d.rows.map(r=>(r.shot)+'x'+r.takes).join(' '))")
    print("new days:", new)
    print("names on imported Day 1 row 4 (39 return):", pg.evaluate(f"()=>{{const d=S.days[{n_before}];const r=d.rows[3];return shotName(r,d,lastTake(r,d))}}"))
    print("director note sample:", pg.evaluate(f"()=>S.days[{n_before}].rows[4].director"))
    pg.evaluate("()=>undo()"); pg.wait_for_timeout(300); print("after undo days:", pg.evaluate("()=>S.days.length"))
    # --- import our own CSV export back into a new day ---
    with pg.expect_download() as d: pg.click("#csvBtn")
    d.value.save_as("test_out/all.csv")
    pg.set_input_files("#sheetInput","test_out/all.csv"); pg.wait_for_selector("#impModal.open"); pg.wait_for_timeout(300)
    pg.select_option("#impDest","newday"); pg.uncheck("#impTakes")
    print("csv info:", pg.inner_text("#impInfo"))
    pg.click("#impGo"); pg.wait_for_timeout(400)
    print("csv new day rows:", pg.evaluate("()=>{const d=D();return d.name+' '+d.rows.length+' rows, kind '+d.kind}"))
    pg.evaluate("()=>undo()")
    # --- update bar ---
    open("out_repo/public/version.json","w").write('{"version":"9.9.9"}')
    pg.evaluate("()=>checkVersion()"); pg.wait_for_timeout(500)
    print("update bar:", pg.is_visible("#updateBar"), "|", pg.inner_text("#updateText"))
    pg.screenshot(path="test_out/update_bar.png")
    open("out_repo/public/version.json","w").write('{"version":"2.1.0"}\n')
    print("ERRORS:", errs); b.close()
