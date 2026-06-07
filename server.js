import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function handleApi(req, res, pathname) {
  try {
    const apiFile = pathname.replace(/^\/api\//, "");
    const modulePath = path.join(__dirname, "api", apiFile.endsWith(".js") ? apiFile : `${apiFile}.js`);
    const mod = await import(pathToFileURL(modulePath).href + `?t=${Date.now()}`);
    const body = await readJsonBody(req);
    const url = new URL(req.url, `http://${req.headers.host}`);

    const localReq = {
      method: req.method,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
    };

    const localRes = {
      statusCode: 200,
      setHeader: (...args) => res.setHeader(...args),
      end: (body) => {
        res.statusCode = localRes.statusCode;
        res.end(body);
      },
    };

    await mod.default(localReq, localRes);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: error.message || "API error" }));
  }
}

async function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = decodeURIComponent(filePath).replace(/\\/g, "/");
  const absolute = path.normalize(path.join(__dirname, filePath));

  if (!absolute.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  try {
    const info = await stat(absolute);
    const finalPath = info.isDirectory() ? path.join(absolute, "index.html") : absolute;
    const data = await readFile(finalPath);
    const ext = path.extname(finalPath).toLowerCase();
    res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url.pathname);
    return;
  }
  await serveStatic(req, res, url.pathname);
});

server.listen(port, () => {
  console.log(`STONPayouts running at http://localhost:${port}`);
  console.log("No Vite. Static UI + local Node API bridge for Omniston.");
});
