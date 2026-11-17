# Shotlist Scheduler v2.6.2

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
- `public/vendor/exceljs.min.js` is ExcelJS 4.4.0 (MIT) and `public/vendor/fonts/` holds Atkinson Hyperlegible and Lexend (SIL OFL 1.1), hosted here so nothing loads from a third-party CDN.
