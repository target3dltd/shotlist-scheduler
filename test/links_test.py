from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch(); errs=[]
    pg=b.new_context(viewport={"width":1500,"height":950},accept_downloads=True).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("http://localhost:8888/"); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName","Leo"); pg.click("#joinGo")
    pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0"); pg.click("#dayTabs .daytab:has-text('Day 1 - 14 Oct')"); pg.wait_for_timeout(300)
    pg.evaluate("()=>{const r=D().rows.filter(r=>r.type!=='break');r[0].hero='T3';r[1].safety='T2';r[2].director='Hero: T5. good one';commit();renderAll()}")
    pg.wait_for_timeout(200)
    print("panel:",pg.inner_text("#links .planhead").replace("\n"," | "))
    print("pill:",pg.evaluate("()=>$$('#warnings .pill').map(x=>x.textContent)"))
    pg.locator("#links input").first.fill("https://drive.google.com/file/d/abc/view"); pg.locator("#links input").first.press("Tab"); pg.wait_for_timeout(300)
    pg.locator("#links input").nth(1).fill("not a link"); pg.wait_for_timeout(100)
    print("bad flagged:",pg.evaluate("()=>$$('#links input')[1].classList.contains('bad')"))
    print("after one:",pg.inner_text("#links .planhead").split("\n")[0],"| stored:",pg.evaluate("()=>D().rows.find(r=>r.hero==='T3').heroUrl"))
    print("grid col value:",pg.evaluate("()=>{const r=D().rows.find(r=>r.hero==='T3');const el=$(`#grid tr[data-id='${r.id}'] [data-k=heroUrl]`);return el&&el.value}"))
    pg.screenshot(path="test_out/links.png",clip={"x":0,"y":200,"width":1500,"height":420})
    # xlsx export has link
    pg.click("#xlsxBtn"); pg.wait_for_timeout(300)
    pg.evaluate("()=>$$('#expDays input').forEach(c=>c.checked=c.parentElement.textContent.includes('Day 1'))")
    with pg.expect_download() as d: pg.click("#expGo")
    d.value.save_as("/tmp/lk.xlsx")
    import openpyxl; ws=openpyxl.load_workbook("/tmp/lk.xlsx")["Shotlist"]; hdr={ws.cell(1,c).value:c for c in range(1,ws.max_column+1)}
    print("xlsx hero link:",[ws.cell(r,hdr["Hero link"]).hyperlink.target if ws.cell(r,hdr["Hero link"]).hyperlink else None for r in range(3,6)])
    # print
    pg.emulate_media(media="print"); pg.evaluate("()=>{printWidths();printText(true)}"); pg.wait_for_timeout(200)
    print("print tabs visible:",pg.evaluate("()=>$$('#dayTabs .daytab,#dayTabs .tabgroup').filter(x=>getComputedStyle(x).display!=='none').map(x=>x.textContent.slice(0,20))"))
    print("checkbox fits:",pg.evaluate("()=>{const td=$('#grid tbody td[data-col=handle]');const cb=$('input[type=checkbox]',td);const a=td.getBoundingClientRect(),c=cb.getBoundingClientRect();return c.left>=a.left&&c.right<=a.right+0.5}"))
    pg.pdf(path="test_out/print.pdf",format="A4",landscape=True,print_background=True)
    pg.evaluate("()=>printText(false)"); pg.emulate_media(media='screen'); pg.click("#dayTabs .daytab:has-text('Day 3')"); pg.wait_for_timeout(300); pg.emulate_media(media='print'); pg.evaluate("()=>{printWidths();printText(true)}"); pg.wait_for_timeout(200)
    pg.pdf(path="test_out/print3.pdf",format="A4",landscape=True,print_background=True)
    print("errors",errs); b.close()
