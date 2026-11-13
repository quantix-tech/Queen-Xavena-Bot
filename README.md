# 👑 Queen Xavena

A WhatsApp bot built on Baileys — modular plugins, private/public modes, media handling out of the box.

---

## Features

- 🔌 **Session-based auth** — pair once, restart forever (as long as `session/` persists)
- 🎨 **Auto-generated menu** — new plugins appear without touching `menu.js`
- 🔒 **Two-mode access** — `private` (owner + sudos) or `public` (everyone)
- 🧩 **Plugin architecture** — drop a `.js` file in `plugins/`, done
- 🖼️ **Media pipeline** — image / video / existing sticker → sticker with pack metadata
- 🔁 **Auto-reconnect** — exponential backoff, capped at 30s
- 🐳 **Docker-ready** — ffmpeg pre-installed in the image

---

## Requirements

- **Node.js 20+**
- **ffmpeg** — only for `.sticker` on video. `apt install ffmpeg` / `brew install ffmpeg`
- A **separate WhatsApp number** for the bot (do not use your personal number)

---

## Quick start

```bash
# 1. Install
npm install

# 2. Get a session
#    Use the Queen Xavena web pair:
#      - Pair code (phone number → 8-digit code)
#      - QR code
#    The session arrives in your WhatsApp DM.

# 3. Provide the session (pick ONE method)
#    a) Paste into session_id.txt, OR
#    b) export SESSION_ID='QueenXavena~...'

# 4. Run
npm start