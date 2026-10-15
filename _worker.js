// Cloudflare Worker / Pages Advanced Mode Entrypoint (_worker.js)
// Định tuyến thống nhất cho cả Cloudflare Pages và Cloudflare Workers

import { onRequest as parseHandler } from "./functions/api/parse.js";
import { onRequest as episodeHandler } from "./functions/api/episode.js";
import { onRequest as searchHandler } from "./functions/api/search.js";
import { onRequest as videoHandler } from "./functions/api/video.js";
import { onRequest as downloadHandler } from "./functions/api/download.js";
import { onRequest as proxyHandler } from "./functions/api/proxy.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, "") || "/";

    const context = {
      request,
      env,
      ctx,
      waitUntil: (promise) => {
        if (ctx && typeof ctx.waitUntil === "function") {
          ctx.waitUntil(promise);
        } else {
          Promise.resolve(promise).catch(() => {});
        }
      }
    };

    // Định tuyến API endpoints
    if (pathname === "/api/parse") {
      return parseHandler(context);
    }
    if (pathname === "/api/episode") {
      return episodeHandler(context);
    }
    if (pathname === "/api/search" || pathname === "/api/discover") {
      return searchHandler(context);
    }
    if (pathname === "/api/video") {
      return videoHandler(context);
    }
    if (pathname === "/api/download") {
      return downloadHandler(context);
    }
    if (pathname === "/api/proxy") {
      return proxyHandler(context);
    }

    // Nếu có env.ASSETS (Cloudflare Pages), phục vụ static frontend
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
