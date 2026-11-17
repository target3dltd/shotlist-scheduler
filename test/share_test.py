from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch(); errs=[]
    ctx=b.new_context(viewport={"width":1300,"height":950}); ctx.grant_permissions(["clipboard-read","clipboard-write"])
    pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("http://localhost:8888/"); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName","Alice"); pg.click("#joinGo")
    pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0")
    # make a second project and switch to it so the link must carry the id
    pid2=pg.evaluate("async()=>{const id=await createProject('Second shoot',blankSeed('Second shoot'));await openProject(id);return id}")
    pg.wait_for_timeout(500)
    pg.click("#shareBtn"); pg.wait_for_selector("#shareModal.open")
    pg.fill("#shareBody input[placeholder='e.g. Sam']","Sam")
    msg=pg.evaluate("()=>$('#shareBody textarea').value")
    print("link ok:", ("?p="+pid2) in msg, "| pw by default:", "Site password:" in msg)
    print(msg)
    pg.check("#shareBody .form label.inline:has-text('site password') input"); pg.fill("#shareBody input[type=password]","hunter2"); pg.wait_for_timeout(100)
    print("pw included when ticked:", "Site password: hunter2" in pg.evaluate("()=>$('#shareBody textarea').value"))
    pg.check("#shareBody label.inline:has-text('Cast') input"); pg.click("#shareBody button:has-text('Copy invite')"); pg.wait_for_timeout(300)
    print("added crew:",pg.evaluate("()=>S.people.map(p=>p.name)"), "| pw stored anywhere:", "hunter2" in pg.evaluate("()=>JSON.stringify(localStorage)+JSON.stringify(S)"))
    pg.screenshot(path="test_out/share.png")
    # new person opens the link
    ctx2=b.new_context(viewport={"width":1300,"height":900}); p2=ctx2.new_page(); p2.on("pageerror",lambda e:errs.append(str(e)))
    p2.goto(f"http://localhost:8888/?p={pid2}"); p2.wait_for_selector("#joinModal.open"); p2.fill("#joinName","Sam"); p2.click("#joinGo")
    p2.wait_for_function("()=>typeof S!=='undefined'&&S"); p2.wait_for_timeout(800)
    print("Sam opened:",p2.evaluate("()=>S.project.name"),"| url cleaned:",p2.url)
    print("errors",errs); b.close()
