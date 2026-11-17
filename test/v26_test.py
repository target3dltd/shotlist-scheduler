import time
from playwright.sync_api import sync_playwright
URL="http://localhost:8888/"
with sync_playwright() as pw:
    b=pw.chromium.launch(); errs=[]
    def mk(name,w=1500):
        ctx=b.new_context(viewport={"width":w,"height":950})
        pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(name+": "+str(e)))
        pg.goto(URL); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName",name); pg.click("#joinGo")
        pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0"); pg.evaluate("()=>{P.poll=1}"); return pg
    A=mk("Alice"); B=mk("Bob")
    for pg in (A,B): pg.click("#dayTabs .daytab:has-text('Day 3 - LV')"); pg.wait_for_timeout(200)
    # timeline labels inside the box
    for ui in (13,20):
        A.evaluate(f"()=>{{P.ui={ui};applyDisplay();renderAll()}}"); A.wait_for_timeout(150)
        r=A.evaluate("()=>{const t=$('#timeline').getBoundingClientRect();return $$('#timeline .tick').map(x=>{const b=x.getBoundingClientRect();return b.left>=t.left-0.5&&b.right<=t.right+0.5&&b.bottom<=t.bottom+0.5&&b.top>=t.top})}")
        print("ui",ui,"ticks inside:",all(r),len(r))
    A.evaluate("()=>{P.ui=13;applyDisplay();renderAll()}")
    A.screenshot(path="test_out/v26_header.png",clip={"x":0,"y":0,"width":1500,"height":330})
    # custom text column wraps
    A.evaluate("()=>{S.cols.push({id:'runner',label:'Runner notes',type:'text',options:''});commit();renderAll()}"); A.wait_for_timeout(200)
    el=A.locator("#grid tbody tr[data-id] [data-k=c_runner]").first
    print("runner cell tag:",el.evaluate("e=>e.tagName"))
    h1=el.evaluate("e=>e.offsetHeight"); el.click(); el.type("Pick up the spare battery belt and the second helmet from the van before lunch"); el.press("Enter")
    A.wait_for_timeout(100); h2=el.evaluate("e=>e.offsetHeight"); print("height grew:",h1,"->",h2,"| no newline:", "\n" not in el.input_value())
    # peer highlight off by default
    print("peerRows default:",B.evaluate("()=>P.peerRows"))
    rid=A.evaluate("()=>D().rows[3].id"); A.locator(f"#grid tbody tr[data-id='{rid}'] [data-k=c_runner]").click()
    time.sleep(3); B.evaluate("()=>syncNow()"); time.sleep(1.5)
    print("Bob sees peer (off):",B.evaluate("()=>$$('#grid tr.peer').length"))
    B.evaluate("()=>{P.peerRows=true;savePrefs();applyDisplay()}"); B.wait_for_timeout(100)
    print("Bob sees peer (on):",B.evaluate(f"()=>{{const tr=$('#grid tr.peer');return tr&&[tr.dataset.id==='{rid}',tr.style.getPropertyValue('--peer')===colorFor('Alice'),$('.peerchip',tr).textContent]}}"))
    B.screenshot(path="test_out/v26_peer.png",clip={"x":0,"y":250,"width":1500,"height":450})
    # archive
    A.click("#archDayBtn"); A.click("#askYes"); A.wait_for_timeout(200)
    print("A tabs:",A.evaluate("()=>$$('#dayTabs .daytab').map(x=>x.textContent.slice(0,22))"))
    time.sleep(2.5); B.evaluate("()=>syncNow()"); time.sleep(1.5)
    print("B has LV tab:",B.evaluate("()=>$$('#dayTabs .daytab').some(x=>x.textContent.includes('Day 3 - LV'))"),"| B on:",B.evaluate("()=>D().name"))
    B.click("#dayTabs .daytab.arch"); B.wait_for_timeout(150); B.screenshot(path="test_out/v26_arch.png")
    B.click("#archList button"); B.wait_for_timeout(200)
    print("B restored, on:",B.evaluate("()=>D().name"),"rows:",B.evaluate("()=>D().rows.length"))
    time.sleep(2.5); A.evaluate("()=>syncNow()"); time.sleep(1.5)
    print("A sees LV back:",A.evaluate("()=>S.days.some(d=>d.name==='Day 3 - LV'&&!d.archived)"))
    # colours
    A.evaluate("()=>{P.tl={shoot:'#8e44ad'};P.band='#2e7d4f';P.bandMix=18;savePrefs();applyDisplay()}")
    print("shoot var:",A.evaluate("()=>getComputedStyle(document.documentElement).getPropertyValue('--shoot')"))
    A.click("#dayTabs .daytab:has-text('Day 3 - LV')"); A.wait_for_timeout(200)
    A.screenshot(path="test_out/v26_custom.png",clip={"x":0,"y":0,"width":1500,"height":330})
    A.click("#setBtn"); A.click("#setTabs >> text=Display"); A.wait_for_timeout(200); A.locator("#colourForm").scroll_into_view_if_needed(); A.screenshot(path="test_out/v26_settings.png")
    A.evaluate("()=>{P.theme='dark';P.band='';P.tl={};applyDisplay()}"); A.click("#setModal [data-close]"); A.wait_for_timeout(150)
    A.screenshot(path="test_out/v26_dark.png",clip={"x":0,"y":0,"width":1500,"height":330})
    print("errors:",errs)
    b.close()
