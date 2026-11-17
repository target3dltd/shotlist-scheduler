import time
from playwright.sync_api import sync_playwright
URL="http://localhost:8888/"
with sync_playwright() as pw:
    b=pw.chromium.launch(); errs=[]
    def mk(name):
        ctx=b.new_context(viewport={"width":1500,"height":950},accept_downloads=True)
        pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(name+": "+str(e)))
        pg.goto(URL); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName",name); pg.click("#joinGo")
        pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0"); pg.evaluate("()=>{P.poll=2}"); return pg
    A=mk("Alice"); B=mk("Bob")
    for pg in (A,B): pg.click("#dayTabs .daytab:has-text('Day 3 - LV')"); pg.wait_for_timeout(200)
    A.evaluate("()=>{const p=['HIGH','MID','LOW','','HIGH','MID'];D().rows.forEach((r,i)=>{if(r.type!=='break')r.priority=p[i%6]});commit();renderAll()}")
    print("filter options:", A.evaluate("()=>$$('#prioFilter option').map(o=>o.textContent)"))
    counts={}
    for v in ["","=HIGH",">=MID","none"]:
        A.select_option("#prioFilter",v); A.wait_for_timeout(150); counts[v]=A.evaluate("()=>$$('#grid tbody tr[data-id]').length")
    print("rows shown:", counts, "| viewbar:", A.inner_text("#viewbar").replace("\n"," "))
    A.select_option("#prioFilter",">=MID"); A.wait_for_timeout(100); A.screenshot(path="test_out/prio_filter.png")
    # colours: set MID to blue, LOW none
    A.click("#setBtn"); A.click("#setTabs >> text=Columns"); A.wait_for_timeout(200)
    A.evaluate("()=>{S.cfg.priorityColors={MID:'#2f6fb0',LOW:'none'};commit();renderAll();renderSetTab()}"); A.wait_for_timeout(200)
    A.screenshot(path="test_out/prio_settings.png"); A.click("#setModal [data-close]")
    time.sleep(5); B.evaluate("()=>syncNow()"); time.sleep(2)
    print("Bob MID select colours:", B.evaluate("()=>{const s=$$('#grid tbody select[data-k=priority]').find(x=>x.value==='MID');return s&&[s.style.background,s.style.color]}"),
          "| LOW painted:", B.evaluate("()=>{const s=$$('#grid tbody select[data-k=priority]').find(x=>x.value==='LOW');return s&&s.classList.contains('prio')}"),
          "| HIGH row edge:", B.evaluate("()=>{const s=$$('#grid tbody select[data-k=priority]').find(x=>x.value==='HIGH');return s&&s.closest('tr').style.getPropertyValue('--prio')}"))
    print("Bob's filter untouched:", B.evaluate("()=>P.prioFilter||'(all)'"))
    # change via UI dropdown keeps paint
    B.locator('#grid tbody select[data-k=priority]').first.select_option("LOW"); B.wait_for_timeout(100)
    print("after Bob picks LOW:", B.evaluate("()=>{const s=$('#grid tbody select[data-k=priority]');return [s.classList.contains('prio'),s.closest('tr').classList.contains('prio')]}"))
    # xlsx colours
    A.select_option("#prioFilter",""); A.click("#xlsxBtn"); A.wait_for_timeout(200)
    with A.expect_download() as d: A.click("#expGo")
    d.value.save_as("test_out/prio.xlsx")
    print("ERRORS:", errs); b.close()
