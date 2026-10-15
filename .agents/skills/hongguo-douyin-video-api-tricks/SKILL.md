---
name: hongguo-douyin-video-api-tricks
description: >-
  Comprehensive runbook, free API tricks, multi-provider rotation architecture,
  and CENC-AES-128-CTR (spade_a) MP4 decryption guide for Hongguo Short Drama
  (红果免费短剧 / Fanqie Novel / qznovelvod) and Douyin/TikTok video downloaders on
  Cloudflare Pages/Workers Free and Python Render.com. Activate this skill when
  building, debugging, or extending video parsers, short-drama scrapers, or
  ByteDance VOD decryptors.
---

# Hongguo Short Drama & Douyin/TikTok Video API Tricks & Decryption Skill

## 1. Hongguo Short Drama (红果免费短剧 / Fanqie) Input Resolution

1. **Short Share Links (`novelquickapp.com/s/...`, `changdunovel.com`)**:
   - Send a `GET` request with `redirect: "manual"` and mobile User-Agent.
   - Parse the `Location` header query string for `video_series_id`, `series_id`, `book_id`, `album_id`, `group_id`, `item_id`, or `vid` (19-digit numeric IDs).
2. **Official Web Links (`hongguoduanju.com`)**:
   - Series page: `https://hongguoduanju.com/detail?series_id={19_digit_id}`
   - Episode player page: `https://hongguoduanju.com/player/{series_id}/{vid}`

---

## 2. Trick #1: Bypassing `X-Gorgon` via Official Fqnovel App Preload Mirrors

Standard Fqnovel/Hongguo mobile endpoints enforce ByteDance `X-Gorgon` / `X-Argus` signatures. However, the **Preload v1 endpoints** across 6 official mirrors accept unauthenticated `POST` requests when passed the standard Android preload query parameters and `"dr_scene": "preload"`:

- **6 Active Mirrors**:
  1. `https://api5-normal-sinfonlineb.fqnovel.com`
  2. `https://api5-normal-sinfonlinea.fqnovel.com`
  3. `https://api5-normal-sinfonlinec.fqnovel.com`
  4. `https://api5-normal-lf.fqnovel.com`
  5. `https://api5-normal-lq.fqnovel.com`
  6. `https://api5-normal-hl.fqnovel.com`
- **Required Query String (`COMMON_APP_QUERY`)**:
  `klink_egdi=AAI29o4dI-eMiO73_SRSbZ_0By1v3fUSriNeu8-L951MoXhWT88pzj5B&iid=3788260546453235&device_id=538083340353620&ac=wifi&channel=oppo_8662_64&aid=8662&app_name=novelread&version_code=71532&version_name=7.1.5.32&device_platform=android&os=android&ssmix=a&device_type=SM-N9860&device_brand=Samsung&language=zh&os_api=28&os_version=9&manifest_version_code=71532&resolution=900*1600&dpi=320&update_version_code=71532&host_abi=arm64-v8a&dragon_device_type=pad&pv_player=71532&compliance_status=0&need_personal_recommend=1&player_so_load=1&is_android_pad_screen=0`
- **Required Headers**:
  - `User-Agent`: `com.phoenix.read/71532 (Linux; U; Android 9; SM-N9860; Build/PQ3A.190705.10241111;tt-ok/3.12.13.20)`
  - `Referer`: `https://novelquickapp.com/`
- **Endpoint A — Full Series Metadata & Episode List**:
  - Path: `POST /novel/player/multi_video_detail/preload/v1?{COMMON_APP_QUERY}`
  - JSON Body:
    ```json
    {
      "biz_param": {
        "detail_page_version": 0,
        "disable_digg_stat": false,
        "need_all_video_definition": false,
        "need_mp4_align": false,
        "screen_width_px": "900",
        "source": 7,
        "use_os_player": false,
        "use_server_dns": false
      },
      "dr_scene": "preload",
      "series_id": "7588802892412406808"
    }
    ```
  - Returns: `data[series_id].video_data` (`series_title`, `series_cover`, `series_intro`, `episode_cnt`, `celebrities`, and `video_list` containing all episode `vid`, `vid_index`, `duration`).
- **Endpoint B — Multi-Resolution Video Streams & `spade_a` Keys**:
  - Path: `POST /novel/player/multi_video_model/preload/v1?{COMMON_APP_QUERY}`
  - JSON Body:
    ```json
    {
      "biz_param": {
        "detail_page_version": 0,
        "device_level": 3,
        "disable_digg_stat": false,
        "need_all_video_definition": true,
        "need_mp4_align": false,
        "use_os_player": false,
        "use_server_dns": false,
        "video_platform": 1024
      },
      "dr_scene": "preload",
      "mixed_video_id_map": { "1004": ["7588804476701690904"] }
    }
    ```
  - Returns: `data[vid].video_model` (JSON string). Inside `video_list` (`video_1` to `video_5`), each item contains `definition` (`360p`..`1080p`), `main_url`, `backup_url`, `encrypt_info.spade_a`, plus `fallback_api` (`https://vas-lf-x.snssdk.com/video/fplay/1/...`).

---

## 3. Trick #2: Hongguo Official Web SSR (`window._ROUTER_DATA`) & Direct H.264 Stream

1. **Extracting `window._ROUTER_DATA`**:
   - Fetch `https://hongguoduanju.com/` pages with standard Desktop Browser UA:
     - Trending/Home: `https://hongguoduanju.com/` (`loaderData.page.homeSections`)
     - Category pages: `https://hongguoduanju.com/category/{real-drama|comic-drama|ai-drama}` (`loaderData.category_page.recommendList`)
     - Keyword Search: `https://hongguoduanju.com/search/{encodeURIComponent(keyword)}` (`loaderData["search_(keyword)/page"].searchList`)
     - Series Detail: `https://hongguoduanju.com/detail?series_id={seriesId}` (`seriesDetail.vid_list`)
   - Extract the JSON assigned to `_ROUTER_DATA` via brace-balanced parsing starting at the first `{` after `_ROUTER_DATA`.
2. **Unencrypted H.264 Stream (`360p-h264`)**:
   - Every episode `vid` has a direct unencrypted H.264/AAC MP4 endpoint:
     `https://hongguoduanju.com/video/public/{vid}/360p.mp4`
   - Must be fetched with header `Referer: https://hongguoduanju.com/`.
   - Use this stream for instant `<video>` preview in browsers (since browsers cannot natively play CENC-encrypted `encv` streams without EME/MSE).

---

## 4. Trick #3: `spade_a` Key Derivation & Fast WebCrypto `CENC-AES-128-CTR` Decryption

1. **`spade_a` to 16-Byte AES Key (`key_hex` — `libttmplayer.so` algorithm)**:
   - Base64-decode `spade_a` into `buf` (`L = buf.length`).
   - Compute `key0 = buf[0] ^ buf[1] ^ buf[2]`, `x27 = key0 - 0x30`, `w22 = L - key0 + 0x2f`.
   - Slice `x21 = buf.slice(1, 1 + w22)`. Initialize `w11 = 0x55`, `w12 = 0xfa`, `w10 = 0xeb`.
   - For each index `i`, compute popcount `pc = popcount(i)`, `w14 = (i & 1) === 0 ? w12 : w11`, update `w11`/`w12` with `x21[i]`, and set `x21[i] = ((w10 - pc) + (w14 ^ x21[i])) & 0xff`.
   - Decode base36 digit `hval` from `x21[0]`, compute `w9 = w22 - hval`, and extract ASCII hex string `x21.slice(1, w9)` (32 hex chars = 16-byte AES key).
2. **Decrypting ISO-BMFF `cenc` MP4 (`encv` -> `hvc1`, `enca` -> `mp4a`)**:
   - Locate `moov` box and iterate over each `trak -> mdia -> minf -> stbl`:
     - Parse `stsz` (sample sizes), `stsc` (sample-to-chunk), `stco` (chunk offsets), and `senc` (8-byte IV per sample at `senc.off + 16 + i * 8`).
     - Zero-pad each 8-byte IV into a 16-byte AES-CTR counter block (`counter[0..7] = iv8`, `counter[8..15] = 0`) and decrypt each sample with `crypto.subtle.decrypt({ name: "AES-CTR", counter, length: 64 }, cryptoKey, sampleSlice)`.
   - Rebuild `moov`:
     - Rename `encv` -> `hvc1`, `enca` -> `mp4a`, remove `sinf`, `senc`, `saio`, `saiz` boxes, and subtract `delta = oldMoovSize - newMoovSize` from every offset in `stco` that follows `moov` (or overwrite `sinf`/`senc`/`saio`/`saiz` in-place with `free` boxes to keep `moov` size constant).

---

## 5. Trick #4: Cloudflare Free Tier 10ms CPU Bypass & Multi-Provider Douyin Rotation

1. **Hybrid Client + Server Decryption**:
   - On Cloudflare Free Tier (10ms CPU limit), expose `/api/download?url=...&raw=1` (streaming passthrough with `Referer: https://novelquickapp.com/`).
   - Perform `CENC-AES-128-CTR` decryption in the browser via `window.HongguoClientDecryptor` using hardware-accelerated WebCrypto (0ms Worker CPU cost), while keeping server-side decryption in `/api/download` and Python `app.py` (Render.com with `pycryptodome`) as fallback.
2. **Douyin / TikTok Multi-Provider Failover**:
   - Primary: `TikWM` (`https://www.tikwm.com/api/`, `POST url=...&hd=1`) — no cooldown.
   - Fallback: `Apihz` 4 routes (`https://cn.apihz.cn/api/fun/douyin.php` + 3 HTTP IP mirrors proxied server-side via Cloudflare Worker to avoid browser HTTPS Mixed-Content blocking).
   - Note: `api.cenguigui.cn/api/duanju.html` is deprecated (HTTP 404); keep only as last-resort fallback.

---

## 6. Trick #5: Cloudflare Free "Max Ping" & Quota Optimization Runbook

To achieve `<2ms` Edge delivery, zero CPU overruns, and prevent burning the 100,000/day Cloudflare Free Worker invocation quota:

1. **Static Asset Quota Bypass (`public/_routes.json`)**:
   - Use `"include": ["/api/*"]` and `"exclude": ["/", "/index.html", "/articles.js", "/ads.txt", "/robots.txt", "/sitemap.xml", "/favicon.svg"]`.
   - Result: Static files are served directly by Cloudflare CDN at Edge PoPs (~5ms ping) and consume **zero** Worker invocations.
2. **Singleflight Request Coalescing (`INFLIGHT_MAP`)**:
   - Coalesce concurrent incoming requests for the same series, episode, or category into a single Promise. Downstream requests await the existing inflight fetch, preventing duplicate upstream calls.
3. **Stale-While-Revalidate (SWR) in V8 Isolate RAM**:
   - Cache parsed JSON in module-level `MEM_CACHE`. If a request arrives after soft TTL expires but within hard TTL (3x), return cached data instantly (`0.0ms`) and trigger an asynchronous background refresh via `ctx.waitUntil`.
4. **Adaptive Mirror Latency Scoreboard (EMA Tracker + Hedging)**:
   - Continually measure RTT across all 6 Fqnovel preload mirrors (`sinfonlineb`, `sinfonlinea`, `sinfonlinec`, `lf`, `lq`, `hl`).
   - Dynamically sort mirrors by lowest EMA latency and hedge upstream requests with a `650ms` parallel timeout.
5. **15-Episode Single-Request Batching**:
   - Fqnovel's `/novel/player/multi_video_model/preload/v1` accepts up to 15 VIDs in `mixed_video_id_map: { "1004": [vid1, vid2, ... vid15] }`.
   - Prefetch 15 episodes on the initial `/api/parse` call and during batch downloads via `/api/episode?vids=...&indices=...`, cutting 93% of API roundtrips.
6. **Smart Placement (`wrangler.toml`)**:
   - Specify `[placement] mode = "smart"` so Cloudflare executes Workers at Edge datacenters near ByteDance/Hongguo Asian upstreams, reducing multi-hop network latency by 40-70%.
7. **Edge Cache API (`caches.default`)**:
   - Cache cover images (`/api/proxy`) for 30 days (`immutable`) and small decrypted MP4s (`<= 20MB`) for 1-2 hours so repeated requests and range requests serve directly from Edge RAM.

