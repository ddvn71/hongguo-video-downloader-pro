#!/usr/bin/env python3
"""
Hongguo Video Downloader (红果免费短剧) - Full Standalone Python Backend cho Render.com
=======================================================================================
Lưu ý kiến trúc:
- Website mặc định chạy ĐỘC LẬP 100% trên Cloudflare Pages / Workers (Free) mà KHÔNG cần Python server.
- File app.py này hỗ trợ ĐẦY ĐỦ tất cả các API (/api/parse, /api/episode, /api/search, /api/discover,
  /api/video, /api/download, /api/proxy) để bạn có thể chạy độc lập trên Render.com hoặc dùng làm
  Custom Decryption / Streaming API dự phòng cho các tập phim dung lượng lớn (>100MB).
"""

import os
import re
import json
import base64
import struct
from urllib.parse import urlencode, quote, urlparse, parse_qs
import requests
from flask import Flask, request, jsonify, Response, send_from_directory
from Crypto.Cipher import AES

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
app = Flask(__name__, static_folder=PUBLIC_DIR)

FQNOVEL_MIRRORS = [
    "https://api5-normal-sinfonlineb.fqnovel.com",
    "https://api5-normal-sinfonlinea.fqnovel.com",
    "https://api5-normal-sinfonlinec.fqnovel.com",
    "https://api5-normal-lf.fqnovel.com",
    "https://api5-normal-lq.fqnovel.com",
    "https://api5-normal-hl.fqnovel.com",
]
HONGGUO_WEB = "https://hongguoduanju.com"
APP_UA = "com.phoenix.read/71532 (Linux; U; Android 9; SM-N9860; Build/PQ3A.190705.10241111;tt-ok/3.12.13.20)"
WEB_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

COMMON_QUERY = {
    "klink_egdi": "AAI29o4dI-eMiO73_SRSbZ_0By1v3fUSriNeu8-L951MoXhWT88pzj5B",
    "iid": "3788260546453235",
    "device_id": "538083340353620",
    "ac": "wifi",
    "channel": "oppo_8662_64",
    "aid": "8662",
    "app_name": "novelread",
    "version_code": "71532",
    "version_name": "7.1.5.32",
    "device_platform": "android",
    "os": "android",
    "ssmix": "a",
    "device_type": "SM-N9860",
    "device_brand": "Samsung",
    "language": "zh",
    "os_api": "28",
    "os_version": "9",
    "manifest_version_code": "71532",
    "resolution": "900*1600",
    "dpi": "320",
    "update_version_code": "71532",
    "host_abi": "arm64-v8a",
    "dragon_device_type": "pad",
    "pv_player": "71532",
    "compliance_status": "0",
    "need_personal_recommend": "1",
    "player_so_load": "1",
    "is_android_pad_screen": "0",
    "rom_version": "PQ3A.190705.10241111+release-keys",
    "cdid": "b4f93387-5319-4134-aab9-2cd4e9279b8f",
}


@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "*"
    return resp


def av_base64_decode(s: str) -> bytes:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    table = {ord(c): i for i, c in enumerate(chars)}
    dst = bytearray()
    i = 0
    n = len(s)
    while i + 4 <= n:
        vals = []
        ok = True
        for j in range(4):
            c = ord(s[i + j])
            if c in table:
                vals.append(table[c])
            else:
                ok = False
                break
        if not ok:
            v = 0
            for val in vals:
                v = (v << 6) | val
            if len(vals) == 3:
                dst.extend([(v >> 10) & 0xFF, (v >> 2) & 0xFF])
            elif len(vals) == 2:
                dst.append((v >> 4) & 0xFF)
            break
        v = (vals[0] << 18) | (vals[1] << 12) | (vals[2] << 6) | vals[3]
        dst.extend([(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF])
        i += 4
    return bytes(dst)


def derive_spade_key_hex(spade_a: str):
    if not spade_a:
        return None
    buf = av_base64_decode(spade_a.strip())
    L = len(buf)
    if L < 3:
        return None
    key0 = buf[0] ^ buf[1] ^ buf[2]
    x27 = key0 - 0x30
    w22 = L - key0 + 0x2F
    if x27 < 2 or w22 < 2 or w22 > L - 1:
        return None
    x21 = bytearray(buf[1 : 1 + w22])
    w11, w12, w10 = 0x55, 0xFA, 0xEB
    for i in range(len(x21)):
        w13 = x21[i]
        pc = bin(i).count("1")
        w14 = w12 if (i & 1) == 0 else w11
        if (i & 1) == 1:
            w11 = w13
        else:
            w12 = w13
        x21[i] = ((w10 - pc) + (w14 ^ w13)) & 0xFF
    c0 = x21[0]
    if 0x30 <= c0 <= 0x39:
        hval = c0 - 0x30
    elif 0x61 <= c0 <= 0x7A:
        hval = c0 - 0x57
    else:
        return None
    w9 = w22 - hval
    if w9 < 2:
        return None
    hex_str = bytes(x21[1 : 1 + w9 - 1]).decode("ascii", errors="ignore")
    if len(hex_str) == 32:
        return hex_str.lower()
    return None


def decrypt_cenc_mp4_bytes(raw_bytes: bytes, key_hex: str) -> bytes:
    """Giải mã CENC-AES-128-CTR MP4 trong bộ nhớ bằng PyCryptodome"""
    if not key_hex or len(key_hex) != 32:
        return raw_bytes
    key = bytes.fromhex(key_hex)
    data = bytearray(raw_bytes)
    total = len(data)

    def parse_boxes(start, end):
        boxes = []
        off = start
        while off + 8 <= end:
            size = struct.unpack(">I", data[off : off + 4])[0]
            typ = data[off + 4 : off + 8].decode("latin1")
            hdr = 8
            if size == 1:
                size = struct.unpack(">Q", data[off + 8 : off + 16])[0]
                hdr = 16
            elif size == 0:
                size = end - off
            if size < hdr or off + size > end:
                break
            children = None
            if typ in ("moov", "trak", "mdia", "minf", "stbl", "edts", "dinf", "udta", "meta"):
                children = parse_boxes(off + hdr, off + size)
            boxes.append({"typ": typ, "off": off, "size": size, "hdr": hdr, "children": children})
            off += size
        return boxes

    top = parse_boxes(0, total)
    moov = next((b for b in top if b["typ"] == "moov"), None)
    if not moov:
        return raw_bytes

    def walk_boxes(boxes):
        for b in boxes or []:
            if b["children"]:
                yield from walk_boxes(b["children"])
            yield b

    for stbl in (b for b in walk_boxes(top) if b["typ"] == "stbl"):
        ch = {c["typ"]: c for c in (stbl["children"] or [])}
        if not all(k in ch for k in ("stsz", "stco", "stsc", "senc")):
            continue
        stsz, stco, stsc, senc = ch["stsz"], ch["stco"], ch["stsc"], ch["senc"]
        ss = struct.unpack(">I", data[stsz["off"] + 12 : stsz["off"] + 16])[0]
        n = struct.unpack(">I", data[stsz["off"] + 16 : stsz["off"] + 20])[0]
        if ss == 0:
            sizes = [struct.unpack(">I", data[stsz["off"] + 20 + i * 4 : stsz["off"] + 24 + i * 4])[0] for i in range(n)]
        else:
            sizes = [ss] * n

        nc = struct.unpack(">I", data[stco["off"] + 12 : stco["off"] + 16])[0]
        chunk_offs = [struct.unpack(">I", data[stco["off"] + 16 + i * 4 : stco["off"] + 20 + i * 4])[0] for i in range(nc)]

        ns = struct.unpack(">I", data[stsc["off"] + 12 : stsc["off"] + 16])[0]
        stsc_tab = [
            struct.unpack(">III", data[stsc["off"] + 16 + i * 12 : stsc["off"] + 28 + i * 12])
            for i in range(ns)
        ]

        sc = struct.unpack(">I", data[senc["off"] + 12 : senc["off"] + 16])[0]
        ivs = [bytes(data[senc["off"] + 16 + i * 8 : senc["off"] + 24 + i * 8]) for i in range(sc)]

        chunk_spc = {}
        for i, (fc, spc, _) in enumerate(stsc_tab):
            nxt = stsc_tab[i + 1][0] if i + 1 < len(stsc_tab) else nc + 1
            for ci in range(fc - 1, nxt - 1):
                chunk_spc[ci] = spc

        sample_offs = []
        si = 0
        for ci in range(nc):
            off = chunk_offs[ci]
            spc = chunk_spc.get(ci, 1)
            for _ in range(spc):
                if si >= n:
                    break
                sample_offs.append(off)
                off += sizes[si]
                si += 1

        for i, off in enumerate(sample_offs):
            sz = sizes[i]
            if sz <= 0 or off + sz > total or i >= len(ivs):
                continue
            cipher = AES.new(key, AES.MODE_CTR, nonce=ivs[i][:8], initial_value=0)
            data[off : off + sz] = cipher.decrypt(bytes(data[off : off + sz]))

    moov_slice = data[moov["off"] : moov["off"] + moov["size"]]
    moov_bytes = bytes(moov_slice).replace(b"encv", b"hvc1").replace(b"enca", b"mp4a")
    moov_arr = bytearray(moov_bytes)
    for tag in (b"sinf", b"senc", b"saio", b"saiz"):
        pos = 0
        while True:
            found = moov_arr.find(tag, pos)
            if found < 4:
                break
            bsize = struct.unpack(">I", moov_arr[found - 4 : found])[0]
            if 8 <= bsize <= len(moov_arr) - (found - 4):
                moov_arr[found : found + 4] = b"free"
                for k in range(found + 4, found - 4 + bsize):
                    moov_arr[k] = 0
                pos = found - 4 + bsize
            else:
                pos = found + 4
    data[moov["off"] : moov["off"] + moov["size"]] = moov_arr
    return bytes(data)


def extract_router_data(html: str):
    idx = html.find("_ROUTER_DATA")
    if idx < 0:
        return None
    start = html.find("{", idx)
    if start < 0:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(html)):
        ch = html[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(html[start : i + 1])
                except Exception:
                    return None
    return None


DETAIL_BIZ_PARAM = {
    "detail_page_version": 0,
    "disable_digg_stat": False,
    "image_shrink_datas_str": "W3siaW1hZ2VfdHlwZSI6MywiaW1hZ2Vfd2lkdGgiOjkwMCwic2hyaW5rX3R5cGUiOjN9LHsiaW1hZ2VfdHlwZSI6NCwiaW1hZ2Vfd2lkdGgiOjcyLCJzaHJpbmtfdHlwZSI6NH1d\n",
    "need_all_video_definition": False,
    "need_mp4_align": False,
    "screen_width_px": "900",
    "source": 7,
    "use_os_player": False,
    "use_server_dns": False,
}

MODEL_BIZ_PARAM = {
    "detail_page_version": 0,
    "device_level": 3,
    "disable_digg_stat": False,
    "need_all_video_definition": True,
    "need_mp4_align": False,
    "use_os_player": False,
    "use_server_dns": False,
    "video_platform": 1024,
}


def clean_url(u: str) -> str:
    return (
        str(u or "")
        .replace("\\u002F", "/")
        .replace("\\/", "/")
        .replace("\\u0026", "&")
        .replace("&amp;", "&")
        .strip()
    )


def format_series_card(item: dict):
    if not isinstance(item, dict):
        return None
    src = item.get("video_data") if isinstance(item.get("video_data"), dict) else item
    sid = str(src.get("series_id") or src.get("seriesId") or src.get("id") or "").strip()
    title = re.sub(r"<[^>]+>", "", str(src.get("series_name") or src.get("series_title") or src.get("title") or "")).strip()
    if not sid or not title:
        return None
    ep_cnt = int(src.get("episode_cnt") or src.get("episodeCount") or (src.get("series_episode_info") or {}).get("episode_cnt") or 0)
    raw_tags = src.get("tags") or src.get("category_list") or []
    tags = [t.get("name") if isinstance(t, dict) else str(t) for t in raw_tags if t]
    return {
        "series_id": sid,
        "title": title,
        "cover": clean_url(src.get("series_cover") or src.get("cover") or src.get("seriesCover") or ""),
        "episode_cnt": ep_cnt,
        "status_text": src.get("episode_right_text") or (f"全{ep_cnt}集" if ep_cnt else "Phim ngắn"),
        "tags": tags[:5],
        "intro": str(src.get("series_intro") or src.get("description") or src.get("intro") or "").strip(),
        "rank": int(src.get("rank") or 0),
    }


def fetch_series_detail(series_id: str):
    qs = urlencode(COMMON_QUERY)
    for idx, host in enumerate(FQNOVEL_MIRRORS):
        try:
            url = f"{host}/novel/player/multi_video_detail/preload/v1?{qs}"
            r = requests.post(
                url,
                json={"biz_param": DETAIL_BIZ_PARAM, "dr_scene": "preload", "series_id": str(series_id)},
                headers={"User-Agent": APP_UA, "Content-Type": "application/json; charset=utf-8"},
                timeout=8,
            )
            j = r.json()
            data = j.get("data") or {}
            if not data:
                continue
            sid = next(iter(data.keys()), None)
            vd = (data.get(sid) or {}).get("video_data") if sid else None
            if not vd:
                continue
            vlist = vd.get("video_list") or []
            if not vlist:
                continue
            episodes = [
                {
                    "vid": str(ep.get("vid", "")),
                    "vid_index": int(ep.get("vid_index") or (i + 1)),
                    "title": ep.get("title") or f"Tập {i + 1}",
                    "duration": int(ep.get("duration") or 0),
                    "cover": clean_url(ep.get("episode_cover") or ep.get("cover") or vd.get("series_cover") or ""),
                }
                for i, ep in enumerate(vlist)
            ]
            episodes.sort(key=lambda x: x["vid_index"])
            return {
                "provider": f"fqnovel-mirror-{idx}",
                "platform": "hongguo",
                "series_id": str(sid),
                "title": vd.get("series_title") or "Phim Ngắn Hongguo",
                "cover": clean_url(vd.get("series_cover") or vd.get("cover_url") or ""),
                "intro": vd.get("series_intro") or "",
                "total_episodes": int(vd.get("episode_cnt") or len(episodes)),
                "status_text": vd.get("episode_right_text") or f"Trọn bộ {len(episodes)} tập",
                "tags": [],
                "celebrities": [],
                "stats": {
                    "views": int(vd.get("series_play_cnt") or 0),
                    "likes": int(vd.get("digg_cnt") or 0),
                    "favorites": int(vd.get("followed_cnt") or 0),
                },
                "episodes": episodes,
            }
        except Exception:
            continue
    return None


def fetch_episode_streams(vid: str, series_title: str = "hongguo", ep_index: int = 1):
    qs = urlencode(COMMON_QUERY)
    qualities = []
    score_map = {"1080p": 1080, "720p": 720, "540p": 540, "480p": 480, "360p": 360}
    for idx, host in enumerate(FQNOVEL_MIRRORS[:3]):
        try:
            url = f"{host}/novel/player/multi_video_model/preload/v1?{qs}"
            payload = {
                "biz_param": MODEL_BIZ_PARAM,
                "dr_scene": "preload",
                "mixed_video_id_map": {"1004": [str(vid)]},
            }
            r = requests.post(url, json=payload, headers={"User-Agent": APP_UA}, timeout=8)
            item = (r.json().get("data") or {}).get(str(vid)) or {}
            vm_raw = item.get("video_model")
            if not vm_raw:
                continue
            vm = json.loads(vm_raw) if isinstance(vm_raw, str) else vm_raw
            raw_vlist = vm.get("video_list") or {}
            vlist = raw_vlist if isinstance(raw_vlist, list) else list(raw_vlist.values())
            for v in vlist:
                if not isinstance(v, dict):
                    continue
                stream_url = clean_url(v.get("main_url") or "")
                if not stream_url:
                    continue
                meta = v.get("video_meta") or v
                defn = meta.get("definition") or v.get("definition") or "720p"
                spade_a = (v.get("encrypt_info") or {}).get("spade_a") or v.get("spade_a") or ""
                key_hex = derive_spade_key_hex(spade_a) if spade_a else None
                qualities.append(
                    {
                        "definition": defn,
                        "label": f"{defn.upper()} ({meta.get('codec_type') or v.get('codec_type') or 'bytevc1'})",
                        "score": score_map.get(defn, 500),
                        "codec": meta.get("codec_type") or v.get("codec_type") or "bytevc1",
                        "size": int(meta.get("size") or v.get("size") or 0),
                        "url": stream_url,
                        "encrypted": bool(key_hex),
                        "key_hex": key_hex,
                    }
                )
            if qualities:
                break
        except Exception:
            continue

    qualities.sort(key=lambda x: x["score"], reverse=True)
    h264_url = f"{HONGGUO_WEB}/video/public/{vid}/360p.mp4"
    qualities.append(
        {
            "definition": "360p-h264",
            "label": "360P Web Direct (H.264)",
            "score": 365,
            "codec": "h264",
            "size": 0,
            "url": h264_url,
            "encrypted": False,
            "key_hex": None,
        }
    )
    safe_base = f"{series_title}_Tap_{ep_index:03d}"[:60]
    for q in qualities:
        fname = f"{safe_base}_{q['definition']}.mp4"
        key_param = f"&key={q['key_hex']}" if q.get("encrypted") and q.get("key_hex") else ""
        q["proxy_download_url"] = f"/api/download?url={quote(q['url'])}{key_param}&filename={quote(fname)}"
        q["proxy_stream_url"] = f"/api/video?url={quote(q['url'])}{key_param}"

    return {
        "vid": str(vid),
        "preview_url": h264_url,
        "proxy_preview_url": f"/api/video?url={quote(h264_url)}",
        "qualities": qualities,
    }


@app.route("/api/discover")
@app.route("/api/search")
def api_search_discover():
    q = (request.args.get("q") or request.args.get("keyword") or "").strip()
    cat = (request.args.get("category") or "hot").strip()
    page = int(request.args.get("page") or "1")
    try:
        if q:
            r = requests.get(f"{HONGGUO_WEB}/search/{quote(q)}", headers={"User-Agent": WEB_UA}, timeout=9)
            rd = extract_router_data(r.text) or {}
            loader = rd.get("loaderData") or {}
            page_data = loader.get("search_(keyword)/page") or loader.get("search_page") or {}
            items = []
            seen = set()
            for s in page_data.get("searchList") or []:
                card = format_series_card(s)
                if card and card["series_id"] not in seen:
                    seen.add(card["series_id"])
                    items.append(card)
            return jsonify({"success": True, "mode": "search", "data": {"keyword": q, "page": page, "list": items, "results": items}})

        if cat == "hot":
            target_path = f"/category?sort_type=1&page={page}" if page > 1 else "/"
        elif cat == "latest":
            target_path = f"/category?sort_type=2&page={page}" if page > 1 else "/category?sort_type=2"
        elif cat in ("real-drama", "comic-drama", "ai-drama"):
            target_path = f"/category/{cat}?page={page}" if page > 1 else f"/category/{cat}"
        else:
            target_path = "/category"

        r = requests.get(f"{HONGGUO_WEB}{target_path}", headers={"User-Agent": WEB_UA}, timeout=9)
        rd = extract_router_data(r.text) or {}
        loader = rd.get("loaderData") or {}
        items = []
        seen = set()
        if isinstance(loader.get("page"), dict):
            for sec in loader["page"].get("homeSections") or []:
                for it in sec.get("video_list") or []:
                    card = format_series_card(it)
                    if card and card["series_id"] not in seen:
                        seen.add(card["series_id"])
                        items.append(card)
        cat_page = loader.get("category_page") or loader.get("category_$") or {}
        for it in cat_page.get("recommendList") or []:
            card = format_series_card(it)
            if card and card["series_id"] not in seen:
                seen.add(card["series_id"])
                items.append(card)
        return jsonify({"success": True, "mode": "discover", "data": {"category": cat, "page": page, "list": items}})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/parse", methods=["GET", "POST"])
def api_parse():
    raw = ""
    if request.method == "POST":
        body = request.get_json(silent=True) or {}
        raw = (body.get("url") or body.get("input") or body.get("q") or "").strip()
    else:
        raw = (request.args.get("url") or request.args.get("input") or request.args.get("q") or "").strip()

    if not raw:
        return jsonify({"success": False, "message": "Missing input url or series_id"}), 400

    m_id = re.search(r"(\d{16,20})", raw)
    if not m_id and not raw.startswith("http"):
        return api_search_discover()

    series_id = m_id.group(1) if m_id else ""
    series = fetch_series_detail(series_id)
    if not series:
        return jsonify({"success": False, "message": "Series not found"}), 404

    first_ep = series["episodes"][0] if series["episodes"] else None
    stream = fetch_episode_streams(first_ep["vid"], series["title"], first_ep["vid_index"]) if first_ep else None
    series["active_episode"] = first_ep
    series["active_stream"] = stream
    return jsonify({"success": True, "mode": "hongguo_series", "data": series})


@app.route("/api/episode")
def api_episode():
    vid = (request.args.get("vid") or "").strip()
    title = request.args.get("title") or "hongguo"
    idx = int(request.args.get("index") or "1")
    if not vid:
        return jsonify({"success": False, "message": "Missing vid"}), 400
    stream = fetch_episode_streams(vid, title, idx)
    return jsonify({"success": True, "data": stream})


@app.route("/api/proxy")
def api_proxy():
    target_url = request.args.get("url", "")
    if not target_url:
        return Response("Missing url", status=400)
    r = requests.get(target_url, headers={"User-Agent": WEB_UA, "Referer": "https://hongguoduanju.com/"}, timeout=15)
    return Response(r.content, status=r.status_code, headers={"Content-Type": r.headers.get("Content-Type", "image/jpeg")})


@app.route("/api/video")
def api_video():
    target_url = request.args.get("url", "")
    key_hex = request.args.get("key", "").strip()
    if not target_url:
        return Response("Missing url", status=400)
    headers = {
        "User-Agent": APP_UA if "qznovelvod" in target_url else WEB_UA,
        "Referer": "https://qznovelvod.com/" if "qznovelvod" in target_url else "https://hongguoduanju.com/",
    }
    if "Range" in request.headers and len(key_hex) != 32:
        headers["Range"] = request.headers["Range"]
    r = requests.get(target_url, headers=headers, timeout=60)
    content = r.content
    if len(key_hex) == 32:
        content = decrypt_cenc_mp4_bytes(content, key_hex)
        return Response(content, status=200, headers={"Content-Type": "video/mp4", "Content-Length": str(len(content))})
    resp_headers = {"Content-Type": r.headers.get("Content-Type", "video/mp4"), "Accept-Ranges": "bytes"}
    if "Content-Range" in r.headers:
        resp_headers["Content-Range"] = r.headers["Content-Range"]
    return Response(content, status=r.status_code, headers=resp_headers)


@app.route("/api/download")
def api_download():
    target_url = request.args.get("url", "")
    filename = request.args.get("filename", "hongguo_video.mp4")
    key_hex = request.args.get("key", "").strip()
    raw_mode = request.args.get("raw") == "1"
    if not target_url:
        return Response("Missing url parameter", status=400)

    headers = {
        "User-Agent": APP_UA if "qznovelvod" in target_url else WEB_UA,
        "Referer": "https://qznovelvod.com/" if "qznovelvod" in target_url else "https://hongguoduanju.com/",
    }
    r = requests.get(target_url, headers=headers, timeout=60)
    content = r.content
    is_decrypted = False
    if len(key_hex) == 32 and not raw_mode:
        content = decrypt_cenc_mp4_bytes(content, key_hex)
        is_decrypted = True

    safe_name = quote(re.sub(r'[\\/:*?"<>|]', "_", filename))
    resp_headers = {
        "Content-Type": "video/mp4",
        "Content-Length": str(len(content)),
        "Content-Disposition": f"attachment; filename=\"{safe_name}\"; filename*=UTF-8''{safe_name}",
    }
    if is_decrypted:
        resp_headers["X-Hongguo-Decrypted"] = "CENC-AES-128-CTR"
    return Response(content, status=200, headers=resp_headers)


@app.route("/")
def serve_index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/<path:subpath>")
def serve_static(subpath):
    full_path = os.path.join(PUBLIC_DIR, subpath)
    if os.path.isfile(full_path):
        return send_from_directory(PUBLIC_DIR, subpath)
    return send_from_directory(PUBLIC_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"🚀 Hongguo Python Render Server listening on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port)
