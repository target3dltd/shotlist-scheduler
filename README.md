# Shotlist Scheduler v2.0.0

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
