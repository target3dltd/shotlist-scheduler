"""Build the This Is Me seed project (4 days) from the Shotlist tracker and the LV PDF data."""
import json, re, sys
import openpyxl

ref_xlsx, lv_json, out_path = sys.argv[1:4]

def nodash(s):
    if isinstance(s, str):
        return s.replace("—", "-").replace("–", "-")
    return s

vals = openpyxl.load_workbook(ref_xlsx, data_only=True)["Shotlist"]

def num(v):
    return int(v) if isinstance(v, float) and v.is_integer() else v

def take_rows(day):
    out = []
    for r in range(3, 120):
        if vals.cell(r, 5).value == day and vals.cell(r, 2).value:
            g = lambda c: vals[f"{c}{r}"].value
            out.append(dict(row=r, id=g("B"), shot=num(g("C")), take=num(g("D")), perf=num(g("F")), props=g("G"),
                            perfs=g("H"), capture=g("I"), action=g("J"), body=g("L"), face=g("M"), glove=g("N"),
                            hero=g("O"), safety=g("P"), gs=g("Q"), notes=g("R")))
    return out

def slug(sid):
    s = re.sub(r"_\d+$", "", str(sid))
    s = s.split("_", 1)[1] if "_" in s else s
    return s.replace("_", " ").strip()

def T(v):
    return f"T{num(v)}"

def capture_rows(day, prefix):
    groups = []
    for tk in take_rows(day):
        if groups and str(groups[-1][0]["shot"]) == str(tk["shot"]):
            groups[-1].append(tk)
        else:
            groups.append([tk])
    rows = []
    for i, g in enumerate(groups):
        pick = lambda pred: ", ".join(T(x["take"]) for x in g if pred(x))
        U = lambda v: str(v or "").strip().upper()
        heros = pick(lambda x: U(x["hero"]) == "X")
        safes = pick(lambda x: U(x["safety"]) == "X")
        ngs = pick(lambda x: U(x["hero"]) == "NG")
        tests = pick(lambda x: U(x["hero"]) == "TEST")
        rng = T(g[0]["take"]) if len(g) == 1 else f"{T(g[0]['take'])}-{T(g[-1]['take'])}"
        bits = [f"{len(g)} take{'s' if len(g) > 1 else ''} ({rng})"]
        if heros: bits.append(f"Hero: {heros}")
        if safes: bits.append(f"Safety: {safes}")
        if ngs: bits.append(f"NG: {ngs}")
        if tests: bits.append(f"Test: {tests}")
        notes = "; ".join(f"{T(x['take'])}: {x['notes']}" for x in g if x["notes"])
        if notes: bits.append(f"Notes - {notes}")
        gs = "; ".join(f"{T(x['take'])}: {x['gs']}" for x in g if x["gs"])
        action = next((x["action"] for x in g if x["action"]), None)
        slugs = [slug(x["id"]) for x in g]
        desc = (action or max(set(slugs), key=slugs.count)).strip()
        props = ", ".join(dict.fromkeys(str(x["props"]) for x in g if x["props"] and x["props"] != "-"))
        perfs = " / ".join(dict.fromkeys(str(x["perfs"]) for x in g if x["perfs"]))
        caps = " / ".join(dict.fromkeys(str(x["capture"]) for x in g if x["capture"]))
        pc = next((x["perf"] for x in g if x["perf"]), "")
        on = lambda k: any(str(x[k]) in ("1", "1.0", "True") for x in g)
        rows.append(dict(id=f"{prefix}r{i+1:02d}", type="shot", shot=str(g[0]["shot"]), label="", duration="", setup=0, shoot=0,
            origStart="", origSetup=0, origShoot=0, location=caps, description=desc, script="", shotType="", camera="",
            vfx=(f"GS process - {gs}" if gs else ""), director=". ".join(bits) + ".", props=props, ref1="", ref2="", done=True,
            priority="", perfCount=pc, performers=perfs, genre="", action=desc, body=on("body"), face=on("face"), glove=on("glove"),
            hero="", safety="", takes=len(g), takeLog=None))
    return rows

lv = json.load(open(lv_json))
lv_rows = []
for r in lv:
    r = {k: nodash(v) for k, v in r.items()}
    base = dict(type="shot", shot="", label="", duration="", setup=0, shoot=0, origStart="", origSetup=0, origShoot=0,
                location="", description="", script="", shotType="", camera="", vfx="", director="", props="", ref1="", ref2="",
                done=False, priority="", perfCount="", performers="", genre="", action="", body=False, face=False, glove=False,
                hero="", safety="", takes=0, takeLog=None)
    base.update({k: v for k, v in r.items() if k in base or k == "id"})
    if r.get("type") == "break":
        base.update(type="break", label=r.get("label", "Lunch"), shoot=r.get("shoot", 45))
    base.pop("inferredShot", None)
    lv_rows.append(base)

def day(id, name, kind, no, date, rows, origWrap=None):
    return dict(id=id, name=name, kind=kind, dayNo=no, date=date, call="09:00", wrap="18:00", setupPct=100, shootPct=100,
                minSetup=0, origWrap=origWrap, rows=rows)

id_parts = [
    {"key": "shot", "on": True, "prefix": ""}, {"key": "take", "on": True, "prefix": "T"}, {"key": "prod", "on": True, "prefix": ""},
    {"key": "day", "on": True, "prefix": "d"}, {"key": "perfCount", "on": True, "prefix": "a"}, {"key": "props", "on": True, "prefix": "p"},
    {"key": "performers", "on": True, "prefix": ""}, {"key": "genre", "on": True, "prefix": ""}, {"key": "action", "on": True, "prefix": ""},
    {"key": "body", "on": True, "prefix": "yB"}, {"key": "face", "on": True, "prefix": "yF"}, {"key": "glove", "on": True, "prefix": "yG"},
    {"key": "hero", "on": False, "prefix": ""}, {"key": "shotType", "on": False, "prefix": ""}, {"key": "location", "on": False, "prefix": ""}]

seed = dict(
    id="thisisme",
    project=dict(name="This Is Me", client="Free Animal", prodId="10357", fps="120", dates="14 Oct, 21 Oct 2026, LV day, Day 4 Mocap (tbc)",
                 location="London", system="Mocap / VolCap; LV on camera", lead="", notes="Keywords Mocap Test. Shot IDs and take counts on Day 1 and Day 2 come from the Shotlist tracker."),
    people=[dict(id="pc1", group="Cast", name="Victoria", role="Veronica", phone="", email="", notes="Performer on all days so far"),
            dict(id="pc2", group="Cast", name="Leo", role="Second Victoria (shots 36, 42)", phone="", email="", notes="")],
    cfg=dict(idParts=id_parts),
    days=[day("d1", "Day 1 - 14 Oct", "capture", 1, "2026-10-14", capture_rows(1, "d1")),
          day("d2", "Day 2 - 21 Oct", "capture", 2, "2026-10-21", capture_rows(2, "d2")),
          day("lv", "Day 3 - LV", "schedule", 3, "2026-11-21", lv_rows, origWrap="17:30"),
          day("d4", "Day 4 - Mocap", "capture", 4, "", [])])

txt = json.dumps(seed)
assert "—" not in txt and "–" not in txt
json.dump(seed, open(out_path, "w"))
print({d["name"]: len(d["rows"]) for d in seed["days"]})
print(seed["days"][0]["rows"][0])
