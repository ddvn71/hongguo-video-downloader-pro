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
    const pathname = url.pathname;

    // Định tuyến API endpoints
    if (pathname === "/api/parse") {
      return parseHandler({ request, env, ctx });
    }
    if (pathname === "/api/episode") {
      return episodeHandler({ request, env, ctx });
    }
    if (pathname === "/api/search" || pathname === "/api/discover") {
      return searchHandler({ request, env, ctx });
    }
    if (pathname === "/api/video") {
      return videoHandler({ request, env, ctx });
    }
    if (pathname === "/api/download") {
      return downloadHandler({ request, env, ctx });
    }
    if (pathname === "/api/proxy") {
      return proxyHandler({ request, env, ctx });
    }

    // Nếu có env.ASSETS (Cloudflare Pages), phục vụ static frontend
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
