from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch(); errs=[]
    pg=b.new_context(viewport={"width":1500,"height":950}).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("http://localhost:8888/"); pg.wait_for_selector("#joinModal.open"); pg.fill("#joinName","Leo"); pg.click("#joinGo")
    pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0"); pg.click("#dayTabs .daytab:has-text('Day 3')"); pg.wait_for_timeout(300)
    pg.evaluate("()=>{const p=['HIGH','MID','LOW','','LOW','MID'];D().rows.forEach((r,i)=>{if(r.type!=='break')r.priority=p[i%6]});commit();renderAll()}")
    print("planning:",pg.inner_text("#plan .planhead").replace("\n"," "))
    print("cuts:",pg.evaluate("()=>buildPlan(D(),compute()).cuts.map(x=>[x.r.shot,x.r.priority,x.save,!!x.last])"))
    print("wins:",pg.evaluate("()=>buildPlan(D(),compute()).wins.map(x=>[x.r.shot,x.anchor.shot,x.save])"))
    pg.screenshot(path="test_out/plan_planning.png",clip={"x":0,"y":220,"width":1500,"height":430})
    # live: today, call 2h ago, first 3 shots done, last one 20 min late
    pg.evaluate("""()=>{const d=D();const n=nowMin();d.date=todayISO();d.call=hhmm(n-75);d.wrap=hhmm(n-75+8*60+30);commit();const C=compute();
      const sh=d.rows.filter(r=>r.type!=='break');for(let i=0;i<3;i++){sh[i].done=true;sh[i].doneAt=C.rows[sh[i].id].end+(i===2?12:5)}commit();renderAll()}""")
    print("live card:",pg.evaluate("()=>{const c=$('.stat.live');return c&&[c.innerText.replace(/\\n/g,' | '),c.title]}"))
    print("now line:",pg.evaluate("()=>!!$('#timeline .nowline')"))
    pg.screenshot(path="test_out/plan_live.png",clip={"x":0,"y":0,"width":1500,"height":650})
    before=pg.evaluate("()=>compute().wrap")
    pg.click("#plan button.danger"); pg.wait_for_timeout(300)
    after=pg.evaluate("()=>compute().wrap")
    print("wrap before/after cut-all:",before,after,"| cut rows:",pg.evaluate("()=>$$('#grid tr.cut').length"),"| plan:",pg.inner_text("#plan .planhead").replace("\n"," "))
    pg.screenshot(path="test_out/plan_cut.png",clip={"x":0,"y":220,"width":1500,"height":600})
    # restore via row button
    pg.locator("#grid tr.cut .cutbtn").first.click(); pg.wait_for_timeout(200)
    print("after restore one, cut rows:",pg.evaluate("()=>$$('#grid tr.cut').length"))
    # tick sets doneAt
    rid=pg.evaluate("()=>D().rows.find(r=>r.type!=='break'&&!r.done&&!r.cut).id")
    pg.locator(f"#grid tr[data-id='{rid}'] td[data-col=handle] input[type=checkbox]").check(); pg.wait_for_timeout(200)
    print("doneAt set:",pg.evaluate(f"()=>typeof D().rows.find(r=>r.id==='{rid}').doneAt"))
    print("errors",errs); b.close()
