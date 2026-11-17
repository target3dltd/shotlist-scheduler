// Local stand-in for Netlify: serves public/ and routes /api/* to the function.
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const repo = process.argv[2], port = Number(process.argv[3] || 8888);
if (process.argv[4]) process.env.TEAM_KEY = process.argv[4];
const { default: handler } = await import(path.join(repo, "netlify/functions/api.mjs"));
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname.startsWith("/api/")) {
    if (globalThis.__OFFLINE__) { res.writeHead(503); return res.end("offline"); }
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await handler(new Request(url, { method: req.method, headers: req.headers, body: ["GET","HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) }));
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  if (url.pathname === "/__offline") { globalThis.__OFFLINE__ = url.searchParams.get("on") === "1"; res.end("ok"); return; }
  const f = path.join(repo, "public", url.pathname === "/" ? "index.html" : url.pathname);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".json") ? "application/json" : f.endsWith(".woff2") ? "font/woff2" : "text/html" }); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log("dev server on", port));
