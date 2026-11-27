import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// ---------- COLOURS ----------
const __stColors = {
    red: 'FFFF0000', blue: 'FF0000FF', green: 'FF00FF00', yellow: 'FFFFFF00',
    orange: 'FFFFA500', pink: 'FFFFC0CB', purple: 'FF800080', black: 'FF000000',
    white: 'FFFFFFFF', brown: 'FFA52A2A', grey: 'FF808080', gray: 'FF808080',
    cyan: 'FF00FFFF', lime: 'FF00FF00', gold: 'FFFFD700', silver: 'FFC0C0C0',
    maroon: 'FF800000', navy: 'FF000080', teal: 'FF008080', magenta: 'FFFF00FF',
    violet: 'FFEE82EE', indigo: 'FF4B0082', peach: 'FFFFDAB9', sky: 'FF87CEEB',
    mint: 'FF98FF98', coral: 'FFFF7F50', lavender: 'FFE6E6FA', crimson: 'FFDC143C',
    turquoise: 'FF40E0D0'
};

export function __stThemeArgb(name) {
    if (!name) return null;
    let s = String(name).trim().toLowerCase();
    if (__stColors[s]) s = __stColors[s];
    s = s.replace(/^#/, '').replace(/^0x/, '');
    if (/^[0-9a-f]{6}$/i.test(s)) s = 'FF' + s.toUpperCase();
    if (/^[0-9a-f]{8}$/i.test(s)) return parseInt(s, 16) >>> 0;
    return null;
}

// ---------- SERVER PATCH ----------
export function __stThemePatchServerFile() {
    try {
        const _main = require.resolve('@itsliaaa/baileys');
        const _send = path.join(path.dirname(_main), 'Socket', 'messages-send.js');
        let src = fs.readFileSync(_send, 'utf8');
        if (src.includes("return 'chat_theme';")) return 'present';
        if (!src.includes("getMediaType")) return 'failed';
        // Inject chat_theme branch into getMediaType
        const patched = src.replace(
            /function getMediaType\(/,
            `function getMediaType(message) { if (message && message.chatThemeMessage) return 'chat_theme'; return getMediaType_orig(message); } function getMediaType_orig(`
        );
        if (patched !== src) {
            fs.writeFileSync(_send, patched);
            return 'patched';
        }
        // Fallback: simple string inject
        if (src.includes("if (message.imageMessage)")) {
            const p2 = src.replace("if (message.imageMessage)", "if (message.chatThemeMessage) return 'chat_theme';\n    if (message.imageMessage)");
            if (p2 !== src) { fs.writeFileSync(_send, p2); return 'patched'; }
        }
        return 'failed';
    } catch { return 'failed'; }
}

// ---------- PROTO PATCH (fixed32 ARGB) ----------
export function __stThemePatchProto() {
    try {
        const _main = require.resolve('@itsliaaa/baileys');
        const _lib = path.join(path.dirname(_main), '..', 'lib');
        let _patched = false;
        const walk = (d) => {
            let list = [];
            try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
            for (const e of list) {
                const p = path.join(d, e.name);
                if (e.isDirectory()) walk(p);
                else if (e.name.endsWith('.js')) {
                    let src = '';
                    try { src = fs.readFileSync(p, 'utf8'); } catch { continue; }
                    if (!src.includes('backgroundLightArgb')) continue;
                    let next = src;
                    next = next.replace(/backgroundLightArgb/gi, 'backgroundLightArgb');
                    // Force fixed32 for ARGB encode paths
                    if (next.includes('backgroundLightArgb') && !next.includes('fixed32')) {
                        next = next.replace(/\.uint32\(/g, '.fixed32(');
                        next = next.replace(/uint32/g, 'fixed32');
                    }
                    if (next !== src) { fs.writeFileSync(p, next); _patched = true; }
                }
            }
        };
        walk(_lib);
        return _patched ? 'patched' : 'present';
    } catch { return 'failed'; }
}

// ---------- WALLPAPER PATCH (HKDF / path) ----------
export function __stThemePatchWallpaper() {
    try {
        const _main = require.resolve('@itsliaaa/baileys');
        const _lib = path.join(path.dirname(_main), '..', 'lib');
        let found = false;
        const walk = (d) => {
            let list = [];
            try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
            for (const e of list) {
                const p = path.join(d, e.name);
                if (e.isDirectory()) walk(p);
                else if (e.name.endsWith('.js')) {
                    let src = '';
                    try { src = fs.readFileSync(p, 'utf8'); } catch { continue; }
                    if (src.includes('chat-wallpaper-image') && (src.includes('HKDF') || src.includes('hkdf') || src.includes('encryptedStream'))) found = true;
                }
            }
        };
        walk(_lib);
        return found ? 'present' : 'missing';
    } catch { return 'failed'; }
}

export function __stThemePatchAll() {
    const a = __stThemePatchServerFile();
    const b = __stThemePatchProto();
    const c = __stThemePatchWallpaper();
    return { server: a, proto: b, wallpaper: c };
}

// ---------- RESTART ----------
export function __stThemeNeedRestart() {
    const r = __stThemePatchAll();
    return r.server === 'patched' || r.proto === 'patched';
}
export function __stThemeRestartSoon() {
    setTimeout(() => { try { process.exit(0); } catch {} }, 1500);
}
export function __stWallpaperFixMappings() { return true; }

// ---------- SEND ----------
export async function __stThemeSend(sock, jid, themeObj, reply, cmdText) {
    try {
        const patch = __stThemePatchAll();
        if (patch.server === 'patched' || patch.proto === 'patched') {
            __stThemeRestartSoon();
            await reply('Server patch installed — restarting the bot once to load it. Run ' + cmdText + ' again in ~20 seconds.');
            return 'restarting';
        }
        // Build chat theme message
        const chatTheme = {
            chatThemeMessage: {
                theme: themeObj
            }
        };
        // Try sendMessage with chatThemeMessage
        await sock.sendMessage(jid, chatTheme);
        return 'sent';
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        if (msg.includes('chat_theme') || msg.includes('getMediaType') || msg.includes('media type')) {
            await reply('Theme failed: Baileys getMediaType does not know chat_theme. Run themecheck.');
            return 'failed';
        }
        await reply('Theme failed: ' + msg);
        return 'failed';
    }
}