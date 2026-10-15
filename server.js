// Local development & Node.js server (Render.com / Localhost)
// Sử dụng trực tiếp các Cloudflare Pages Functions trong ./functions/api/* để đồng bộ 100% logic
// Chạy: node server.js -> Mở http://localhost:3000

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { URL, fileURLToPath } from "node:url";

import { onRequest as parseHandler } from "./functions/api/parse.js";
import { onRequest as episodeHandler } from "./functions/api/episode.js";
import { onRequest as searchHandler } from "./functions/api/search.js";
import { onRequest as videoHandler } from "./functions/api/video.js";
import { onRequest as downloadHandler } from "./functions/api/download.js";
import { onRequest as proxyHandler } from "./functions/api/proxy.js";
import { onRequest as healthHandler } from "./functions/api/health.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const HANDLERS = {
  "/api/parse": parseHandler,
  "/api/episode": episodeHandler,
  "/api/search": searchHandler,
  "/api/discover": searchHandler,
  "/api/video": videoHandler,
  "/api/download": downloadHandler,
  "/api/proxy": proxyHandler,
  "/api/health": healthHandler
};

// In-memory cache cho static files để tăng tốc độ phản hồi <1ms
const staticCache = new Map();

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const fullUrl = `http://${req.headers.host || `localhost:${PORT}`}${req.url}`;
  const parsedUrl = new URL(fullUrl);
  const pathname = parsedUrl.pathname;

  // Định tuyến API qua Cloudflare Functions handlers
  if (pathname.startsWith("/api/")) {
    try {
      const handler = HANDLERS[pathname];
      if (!handler) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, message: `API route not found: ${pathname}` }));
        return;
      }

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : String(v));
      }

      const hasBody = !["GET", "HEAD", "OPTIONS"].includes(req.method || "GET");
      const bodyBuf = hasBody ? await readRequestBody(req) : undefined;

      const webReq = new Request(fullUrl, {
        method: req.method || "GET",
        headers,
        body: hasBody && bodyBuf && bodyBuf.length > 0 ? bodyBuf : undefined
      });

      const webResp = await handler({
        request: webReq,
        env: process.env,
        ctx: { waitUntil: p => Promise.resolve(p).catch(() => {}) }
      });

      const respHeaders = {};
      webResp.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });
      res.writeHead(webResp.status, respHeaders);

      if (!webResp.body) {
        res.end();
        return;
      }

      const reader = webResp.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  // Phục vụ Static Files từ thư mục public/ (kèm nén Gzip tự động)
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon"
  };

  const acceptEncoding = String(req.headers["accept-encoding"] || "");
  const wantGzip = acceptEncoding.includes("gzip") && /\.(html|js|css|json|xml|svg|txt)$/i.test(ext || ".html");
  const cacheKey = `${filePath}:${wantGzip ? "gz" : "raw"}`;

  if (staticCache.has(cacheKey)) {
    const entry = staticCache.get(cacheKey);
    res.writeHead(200, entry.headers);
    res.end(entry.body);
    return;
  }

  const serveContent = (resolvedPath, content, contentType) => {
    const key = `${resolvedPath}:${wantGzip ? "gz" : "raw"}`;
    if (wantGzip && content.length > 1024) {
      zlib.gzip(content, (gzErr, gzBuf) => {
        if (!gzErr) {
          const headers = {
            "Content-Type": contentType,
            "Content-Encoding": "gzip",
            "Vary": "Accept-Encoding",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
          };
          staticCache.set(key, { headers, body: gzBuf });
          res.writeHead(200, headers);
          res.end(gzBuf);
        } else {
          const headers = { "Content-Type": contentType };
          res.writeHead(200, headers);
          res.end(content);
        }
      });
    } else {
      const headers = {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
      };
      staticCache.set(key, { headers, body: content });
      res.writeHead(200, headers);
      res.end(content);
    }
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        const fallbackPath = path.join(PUBLIC_DIR, "index.html");
        fs.readFile(fallbackPath, (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            res.end("404 Not Found");
          } else {
            serveContent(fallbackPath, content2, "text/html; charset=utf-8");
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      serveContent(filePath, content, mimeTypes[ext] || "application/octet-stream");
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 Hongguo & Douyin Pro Video Downloader đang chạy tại:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`=============================================================\n`);
});
