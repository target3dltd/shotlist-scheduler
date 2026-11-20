"""Assemble the Shotlist Scheduler.

  python3 build/assemble.py <repo_dir> <standalone_out.html> <seed.json>

Writes into <repo_dir>:
  public/index.html            the app (no project data inside; the team server provides it)
  shared/model-core.mjs        merge rules, shared by browser and server
  shared/seed-data.mjs         the starting project (served only through the API)
  netlify/functions/api.mjs    copied from site/
  netlify.toml, package.json, README.md, .gitignore, src/, build/
and a standalone single file with the project embedded, for working offline.
"""
import json, re, shutil, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
repo, standalone, seed_path = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
src = ROOT / "src"

head = (src / "app_head.html").read_text()
help_html = (src / "help.html").read_text()
core = (src / "model_core.js").read_text()
app = (src / "app.js").read_text().replace("/*__XLSX__*/", (src / "xlsx.js").read_text())
app = app.replace("/*__SHOOT__*/", (src / "shoot.js").read_text())
seed = json.loads(seed_path.read_text())

version = re.search(r'const VERSION = "([\d.]+)"', app).group(1)

def page(seed_obj):
    js = app.replace("/*__MODEL_CORE__*/", core).replace("/*__SEED__*/null", json.dumps(seed_obj) if seed_obj else "null")
    html = head.replace("/*__HELP__*/", help_html)
    return html + "<script>\n" + js + "\n</script>\n</body>\n</html>\n"

for p in (page(None), page(seed)):
    bad = [c for c in ("—", "–") if c in p]
    assert not bad, f"dash found: {bad}"

(repo / "public").mkdir(parents=True, exist_ok=True)
(repo / "public" / "index.html").write_text(page(None))
(repo / "public" / "version.json").write_text(json.dumps({"version": version}) + "\n")
icons = ROOT / "icon"
for name in ("favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "site.webmanifest"):
    if (icons / name).exists(): shutil.copy(icons / name, repo / "public" / name)
vendor = ROOT / "vendor" / "exceljs.min.js"
if vendor.exists():
    (repo / "public" / "vendor").mkdir(exist_ok=True)
    shutil.copy(vendor, repo / "public" / "vendor" / "exceljs.min.js")
for extra in ("fflate.min.js",):                # fflate 0.8 (MIT): reads pictures out of .xlsx files
    if (ROOT / "vendor" / extra).exists():
        (repo / "public" / "vendor").mkdir(exist_ok=True); shutil.copy(ROOT / "vendor" / extra, repo / "public" / "vendor" / extra)
pdfjs = ROOT / "vendor" / "pdfjs"            # pdf.js 4.10 (Apache-2.0), only loaded when importing a PDF
if pdfjs.exists():
    dst = repo / "public" / "vendor" / "pdfjs"
    if dst.exists(): shutil.rmtree(dst)
    shutil.copytree(pdfjs, dst)
fonts = ROOT / "vendor" / "fonts"
if fonts.exists():
    dst = repo / "public" / "vendor" / "fonts"
    if dst.exists(): shutil.rmtree(dst)
    shutil.copytree(fonts, dst)
(repo / "shared").mkdir(exist_ok=True)
exports = "DAY_FIELDS, ROW_FIELDS, PERSON_FIELDS, COL_FIELDS, isCustomKey, PROJECT_FIELDS, CFG_DEFAULTS, SEED_STAMP, pad13, opStamp, stampTime, emptyModel, applyOp, foldBatch, mergeModels, cloneModel, seedModel, materialize, assignPositions, diffDocs"
(repo / "shared" / "model-core.mjs").write_text("// Generated from src/model_core.js by build/assemble.py - edit the source, not this file.\n" + core + f"\nexport {{ {exports} }};\n")
# No project data goes into the repo: every site starts empty and its data lives only in that site's own Blobs store.
# (The seed is only used for the standalone file.)
import os
if os.environ.get("TEST_SEED"):   # local test server only: never deployed
    (repo / "shared" / "seed-data.mjs").write_text("export default " + json.dumps(seed) + ";\n")
else:
  (repo / "shared" / "seed-data.mjs").write_text("// Intentionally empty: project data never ships with the code. Each site keeps its own projects in its own Netlify Blobs store.\nexport default null;\n")
(repo / "netlify" / "functions").mkdir(parents=True, exist_ok=True)
shutil.copy(ROOT / "site" / "netlify" / "functions" / "api.mjs", repo / "netlify" / "functions" / "api.mjs")
for d in ("src", "build", "vendor", "icon"):
    dst = repo / d
    if dst.exists(): shutil.rmtree(dst)
    shutil.copytree(ROOT / d, dst, ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "seed.json", "gen_seed.py", "deploy.sh"))   # project data never goes in the repo
(repo / "netlify.toml").write_text("""[build]
  publish = "public"
  command = "echo 'No build step: public/ and netlify/functions are committed ready to run.'"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[headers]]
  for = "/vendor/pdfjs/*"
  [headers.values]
    Content-Type = "text/javascript; charset=utf-8"

[[headers]]
  for = "/*"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"
    Referrer-Policy = "no-referrer"
    X-Content-Type-Options = "nosniff"
""")
(repo / "package.json").write_text(json.dumps({
    "name": "shotlist-scheduler", "version": version, "private": True, "type": "module",
    "description": "Shoot scheduler and DIT shot-naming tool with live team sync on Netlify",
    "dependencies": {"@netlify/blobs": "^10.0.0"}}, indent=2) + "\n")
(repo / ".gitignore").write_text("node_modules/\n.netlify/\n*.pyc\n__pycache__/\n")
readme = f"""# Shotlist Scheduler v{version}

Shoot scheduler and DIT shot-naming tool. Projects with cast and crew, schedule and capture days,
timings that cascade, shot names with take numbers, and live team editing.

## How it's deployed
Netlify builds this repo on every push to `main` (no build command needed):
- `public/index.html` is the whole app. It carries no project data.
- `netlify/functions/api.mjs` stores the shared schedule in Netlify Blobs.
- Access is the Netlify site password. Optionally set `TEAM_KEY` in the site's environment variables
  for a second key.

## How simultaneous edits are kept safe
Each change is saved as its own small, never-overwritten record ("set this field on this row").
Every device merges them the same way: different fields always combine, and for the same field the
later save wins. Rows have fractional positions, so moves and inserts merge, and deletes keep the
data, so Undo can restore it. Offline changes queue on the device and send when back online. See
`src/model_core.js`.

## Changing it
Edit `src/` (app, help, model) and run:

    python3 build/assemble.py . dist/standalone.html build/seed.json

Bump `VERSION` and add a `CHANGELOG` line in `src/app.js` with every change (Semantic Versioning).

## Compatibility rules (so updates never lose anyone's work)
- The shared schedule lives in the `shotlist` Blobs store, not in the deploy, so deploys don't touch it.
- Never rename the store, an entity type or an existing field; only add new ones (unknown fields are ignored by older copies).
- Changes not yet sent are kept in each browser and sent after the update. Open copies see a "new version" bar and save before refreshing.
- Deploy previews and branch deploys use their own store (`shotlist-<context>`), so testing can't touch live data.
- `public/vendor/exceljs.min.js` is ExcelJS 4.4.0 (MIT) and `public/vendor/fonts/` holds Atkinson Hyperlegible and Lexend (SIL OFL 1.1), and `public/vendor/pdfjs/` is pdf.js 4.10 (Apache-2.0, used for importing storyboard PDFs), hosted here so nothing loads from a third-party CDN.
"""
(repo / "README.md").write_text(readme)

standalone.parent.mkdir(parents=True, exist_ok=True)
# the standalone file has no folder next to it, so its icons travel inside it
import base64
sa = page(seed)
if (ROOT / "icon" / "icon-32.png").exists():
    png32 = base64.b64encode((ROOT / "icon" / "icon-32.png").read_bytes()).decode()
    png180 = base64.b64encode((ROOT / "icon" / "apple-touch-icon.png").read_bytes()).decode()
    svg = base64.b64encode((ROOT / "icon" / "favicon.svg").read_bytes()).decode()
    sa = sa.replace('href="favicon.ico" sizes="32x32"', f'href="data:image/png;base64,{png32}" sizes="32x32"')
    sa = sa.replace('href="favicon.svg" type="image/svg+xml"', f'href="data:image/svg+xml;base64,{svg}" type="image/svg+xml"')
    sa = sa.replace('href="apple-touch-icon.png"', f'href="data:image/png;base64,{png180}"')
    sa = sa.replace('<link rel="manifest" href="site.webmanifest">\n', '')
standalone.write_text(sa)
print("version", version, "| index.html", len(page(None)) // 1024, "KB | standalone", len(page(seed)) // 1024, "KB")
