import json, time, sys
from playwright.sync_api import sync_playwright
URL="http://localhost:8888/"
def rows_state(pg, day=None):
    return pg.evaluate("""()=>{const d=D();return d.rows.map(r=>({id:r.id,shot:r.shot||r.label,setup:r.setup,shoot:r.shoot,director:r.director,takes:r.takes}))}""")
def doc(pg): return pg.evaluate("()=>JSON.stringify(materialize((()=>{const m=cloneModel(base);for(const p of pending)for(const op of p.ops)applyOp(m,op,'~',true);return m})()))")
with sync_playwright() as pw:
    b=pw.chromium.launch()
    errs=[]
    def mk(name):
        ctx=b.new_context(viewport={"width":1500,"height":950},permissions=["clipboard-read","clipboard-write"])
        pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(name+": "+str(e)))
        pg.goto(URL); pg.wait_for_selector("#joinModal.open",timeout=8000)
        assert not pg.is_visible("#joinKeyRow"), "key row should be hidden"
        pg.fill("#joinName",name); pg.click("#joinGo"); pg.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0",timeout=10000)
        pg.evaluate("()=>{P.poll=2}")
        return pg
    A=mk("Alice"); Bp=mk("Bob")
    print("days:", A.evaluate("()=>S.days.map(d=>d.name+' ['+d.kind+'] '+d.rows.length)"))
    # both open Day 3 - LV
    for pg in (A,Bp): pg.click("#dayTabs .daytab:has-text('Day 3 - LV')"); pg.wait_for_timeout(200)
    # 1. different fields on same row + another row, at the same time
    A.evaluate("()=>{const r=D().rows[0];r.setup=20;commit()}")
    Bp.evaluate("()=>{const r=D().rows[0];r.director='Bob note';D().rows[1].shoot=25;commit()}")
    # 2. same field conflict
    A.evaluate("()=>{D().rows[2].setup=30;commit()}"); Bp.evaluate("()=>{D().rows[2].setup=40;commit()}")
    # 3. A moves row 3 to top, B inserts a new shot after row 1
    A.evaluate("()=>{const rows=D().rows;const [m]=rows.splice(3,1);rows.unshift(m);commit()}")
    Bp.evaluate("()=>{const rows=D().rows;rows.splice(2,0,newShot({shot:'NEW',action:'bob_insert'}));commit()}")
    time.sleep(7)
    for pg in (A,Bp): pg.evaluate("()=>syncNow()")
    time.sleep(3)
    da,db=doc(A),doc(Bp)
    print("converged:", da==db)
    ra=rows_state(A)
    print("first rows A:", [(r['shot'],r['setup'],r['shoot'],(r['director'] or '')[:10]) for r in ra[:6]])
    lv=json.loads(da)["days"][2]["rows"]
    r02=[r for r in lv if r["shot"]=="02"][0]; r04=[r for r in lv if r["shot"]=="04"][0]; r05=[r for r in lv if r["shot"]=="05"][0]
    print("02 setup/director:", r02["setup"], r02["director"], "| 04 shoot:", r04["shoot"], "| 05 setup (conflict):", r05["setup"], "| NEW present:", any(r["shot"]=="NEW" for r in lv), "| 03 first:", lv[0]["shot"])
    # 4. undo by Alice reverts only her setup change, keeps Bob's note
    A.evaluate("()=>{undoStack=undoStack.filter(Boolean)}")
    A.evaluate("()=>{while(undoStack.length) undo()}")
    time.sleep(6); Bp.evaluate("()=>syncNow()"); time.sleep(2)
    lv=json.loads(doc(Bp))["days"][2]["rows"]; r02=[r for r in lv if r["shot"]=="02"][0]
    print("after Alice undo-all, on Bob: 02 setup", r02["setup"], "director", r02["director"], "| order first:", lv[0]["shot"], "| NEW still:", any(r["shot"]=="NEW" for r in lv))
    # 5. offline queue
    A.goto(URL+"__offline?on=1"); A.go_back(); A.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0",timeout=10000)
    A.evaluate("()=>{P.activeByProject[pid()]='lv';renderAll();D().rows[0].director='typed while offline';commit()}")
    time.sleep(4); print("A status while offline:", A.inner_text("#status"), "| pending:", A.evaluate("()=>pending.length"))
    A.reload(); A.wait_for_function("()=>typeof S!=='undefined'&&S&&S.days.length>0",timeout=10000); print("pending survives reload:", A.evaluate("()=>pending.length"))
    Bp.evaluate("()=>fetch('/__offline?on=0')"); time.sleep(8); Bp.evaluate("()=>syncNow()"); time.sleep(3)
    lv=json.loads(doc(Bp))["days"][2]["rows"]; print("Bob sees offline edit:", lv[0]["director"], "| A pending now:", A.evaluate("()=>pending.length"), "| A status:", A.inner_text("#status"))
    # 6. Day 4 capture: paste actions, DIT next take
    A.click("#dayTabs .daytab:has-text('Day 4')"); A.wait_for_timeout(300)
    A.click("#pasteBtn"); A.fill("#pasteText","walk_cycle\nsit_down\npick_up_box"); A.click("#pasteGo"); A.wait_for_timeout(300)
    A.evaluate("()=>{D().rows[0].performers='Victoria';D().rows[0].perfCount=1;D().rows[0].body=true;commit();renderBody()}")
    A.click("#ditBtn"); A.wait_for_timeout(200)
    A.click("#ditRows tr >> nth=0 >> text=Next take → copy"); A.wait_for_timeout(300)
    A.click("#ditRows tr >> nth=0 >> text=Next take → copy"); A.wait_for_timeout(300)
    print("clipboard:", A.evaluate("()=>navigator.clipboard.readText()"))
    print("DIT out:", A.input_value("#ditOut").split("\n"))
    A.screenshot(path="src_dit.png")
    A.click("#ditModal [data-close]")
    # Day 1 continuing takes: shot 39 second row should be T7 next take -> T8
    A.click("#dayTabs .daytab:has-text('Day 1')"); A.wait_for_timeout(300)
    print("Day1 names:", A.evaluate("()=>D().rows.map(r=>shotName(r,D(),nextTake(r,D())))")[:4])
    # 7. project name propagates
    A.evaluate("()=>{S.project.name='This Is Me (team)';commit();renderAll()}"); time.sleep(6); Bp.evaluate("()=>syncNow()"); time.sleep(2)
    print("Bob title:", Bp.inner_text("#projTitle"), "| presence on Bob:", Bp.evaluate("()=>presence.map(p=>p.name)"))
    # 8. dark mode + settings tabs render
    Bp.click("#themeBtn"); Bp.click("#setBtn")
    for t in ["Project","Cast & crew","Shot names","Team defaults","Display","Projects","Team & sync"]:
        Bp.click(f"#setTabs >> text={t}"); Bp.wait_for_timeout(250)
    Bp.click("#setTabs >> text=Shot names"); Bp.wait_for_timeout(200); Bp.screenshot(path="src_settings_dark.png")
    Bp.click("#setModal [data-close]"); Bp.click("#actBtn"); Bp.wait_for_timeout(800); print("activity items:", Bp.evaluate("()=>$$('#actList li').length"), "| first:", Bp.inner_text("#actList li >> nth=0")[:120].replace("\n"," / "))
    Bp.click("#actModal [data-close]"); Bp.screenshot(path="src_main_dark.png")
    print("ERRORS:", errs)
    b.close()
