from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch(); errs=[]
    pg=b.new_context(viewport={"width":1500,"height":900},accept_downloads=True).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("http://localhost:8888/"); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName","Leo"); pg.click("#joinGo")
    pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0")
    pg.click("#dayTabs .daytab:has-text('Day 1 - 14 Oct')"); pg.wait_for_timeout(300)
    snap=lambda: pg.evaluate("()=>{const d=D();return [d.name,d.kind,cols().filter(c=>!hidden().includes(c.key)).map(c=>c.label).join('|'),d.rows.map(r=>[r.shot,r.action,r.takes,r.done,r.hero,r.safety,r.director,r.body,r.face].join('~'))]}")
    before=snap()
    pg.click("#xlsxBtn"); pg.wait_for_timeout(300)
    pg.evaluate("()=>$$('#expDays input').forEach(c=>c.checked=c.parentElement.textContent.includes('Day 1'))")
    with pg.expect_download() as d: pg.click("#expGo")
    d.value.save_as("/tmp/rtm.xlsx")
    pg.set_input_files("#sheetInput","/tmp/rtm.xlsx"); pg.wait_for_selector("#impModal.open",timeout=15000); pg.wait_for_timeout(400)
    print("dest:",pg.evaluate("()=>$('#impDest').value"),"| takes ticked:",pg.is_checked("#impTakes"))
    pg.click("#impGo"); pg.wait_for_timeout(1000)
    after=snap()
    print("name/kind:",after[0],after[1],"| cols same:",after[2]==before[2],"| rows identical:",after[3]==before[3])
    if after[3]!=before[3]:
        for x,y in zip(before[3],after[3]):
            if x!=y: print("  B",x,"\n  A",y)
    print("errors",errs); b.close()
