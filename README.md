# 👑 Queen Xavena

A powerful and interactive WhatsApp bot. 

Queen Xavena is built to be fast, reliable, and packed with features to make your WhatsApp experience better. Whether you are using it for group management, AI chats, or interactive games, she is ready to go out of the box.

---

## ✨ What Queen Xavena Can Do

- 🔒 **Private & Public Modes** — Keep the bot restricted to yourself and your admins, or open it up for everyone to use.
- 🎨 **Auto-Updating Menu** — Just type the menu command to see everything she can do. It updates automatically.
- 🤖 **AI Integration** — Chat naturally with the bot or use AI to trigger commands without typing prefixes.
- 🖼️ **Media Tools** — Create custom stickers, save view-once messages, and auto-download images and videos.
- 🔁 **Always Online** — If the connection drops, the bot automatically reconnects.
- 🎮 **Interactive Games** — Play text-based and interactive games directly in the chat.

---

## ⚙️ Requirements

- **Node.js 20+** (The environment she runs on)
- **A secondary WhatsApp number** — We highly recommend using a separate number for the bot so it doesn't interfere with your personal chats.
- *(Note for hosters: If you plan to use the sticker features on videos, make sure `ffmpeg` is installed on your server).*

---

## 🚀 How to Set Up

1. Get your Session ID
Go to the official pairing website: https://queen-xavena.onrender.com

· Choose Pair Code (enter your phone number to get an 8-digit code) or QR Code.
· The website will send your Session ID to your WhatsApp DMs.

2. Add the Session ID
You only need to do one of these:

· Create a file named session_id.txt and paste the Session ID inside it, OR
· Add it to your hosting environment variables as: SESSION_ID='QueenXavena~...'

3. Start the bot