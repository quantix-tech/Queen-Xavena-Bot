import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { generateWAMessageFromContent } from '@itsliaaa/baileys';

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

function __stFindGetMediaTypeFile() {
    const _main = require.resolve('@itsliaaa/baileys');
    const _lib = path.join(path.dirname(_main), '..', 'lib');
    let found = null;
    const walk = (d) => {
        if (found) return;
        let list = [];
        try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
        for (const e of list) {
            if (found) return;
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith('.js')) {
                let src = '';
                try { src = fs.readFileSync(p, 'utf8'); } catch { continue; }
                if (src.includes('getMediaType') && (src.includes('function getMediaType') || src.includes('getMediaType =') || src.includes('const getMediaType') || src.includes('getMediaType('))) {
                    if (src.includes('imageMessage') || src.includes('videoMessage')) found = p;
                }
            }
        }
    };
    walk(_lib);
    return found;
}

export function __stThemePatchServerFile() {
    try {
        const file = __stFindGetMediaTypeFile();
        if (!file) return 'failed:no-file';
        let src = fs.readFileSync(file, 'utf8');
        if (src.includes('chatThemeMessage') && src.includes('chat_theme')) return 'present';
        let patched = src.replace(
            /(function getMediaType[^{]*\{)/,
            `$1\n    if (message && (message.chatThemeMessage || message.chatTheme)) return 'chat_theme';`
        );
        if (patched === src) {
            patched = src.replace(
                /(getMediaType\s*=\s*\(?[^)]*\)?\s*=>\s*\{)/,
                `$1\n    if (message && (message.chatThemeMessage || message.chatTheme)) return 'chat_theme';`
            );
        }
        if (patched === src) {
            patched = src.replace(
                /(const getMediaType\s*=\s*function[^{]*\{)/,
                `$1\n    if (message && (message.chatThemeMessage || message.chatTheme)) return 'chat_theme';`
            );
        }
        if (patched !== src) {
            fs.writeFileSync(file, patched);
            return 'patched:' + path.basename(file);
        }
        return 'failed:no-match-in-' + path.basename(file);
    } catch (e) { return 'failed:' + (e.message || String(e)); }
}

export function __stThemePatchProto() {
    try {
        const _main = require.resolve('@itsliaaa/baileys');
        const _lib = path.join(path.dirname(_main), '..', 'lib');
        let patchedAny = false;
        let foundAny = false;
        const walk = (d) => {
            let list = [];
            try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
            for (const e of list) {
                const p = path.join(d, e.name);
                if (e.isDirectory()) walk(p);
                else if (e.name.endsWith('.js')) {
                    let src = '';
                    try { src = fs.readFileSync(p, 'utf8'); } catch { continue; }
                    if (!src.includes('backgroundLightArgb') && !src.includes('BackgroundLightArgb')) continue;
                    foundAny = true;
                    let next = src;
                    next = next.replace(/backgroundLightArgb[^}]*?type\s*:\s*["']uint32["']/gi, (m) => m.replace(/uint32/i, 'fixed32'));
                    next = next.replace(/backgroundDarkArgb[^}]*?type\s*:\s*["']uint32["']/gi, (m) => m.replace(/uint32/i, 'fixed32'));
                    if (next !== src) { fs.writeFileSync(p, next); patchedAny = true; }
                }
            }
        };
        walk(_lib);
        if (patchedAny) return 'patched';
        if (foundAny) return 'present-or-no-uint32';
        return 'failed:not-found';
    } catch (e) { return 'failed:' + (e.message || String(e)); }
}

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
                    if (src.includes('chat-wallpaper-image')) found = true;
                }
            }
        };
        walk(_lib);
        return found ? 'present' : 'missing';
    } catch { return 'failed'; }
}

export function __stThemePatchAll() {
    return { server: __stThemePatchServerFile(), proto: __stThemePatchProto(), wallpaper: __stThemePatchWallpaper() };
}

export function __stThemeNeedRestart() {
    const r = __stThemePatchAll();
    return String(r.server).startsWith('patched') || String(r.proto).startsWith('patched');
}

export function __stThemeRestartSoon() {
    setTimeout(() => { try { process.exit(0); } catch {} }, 1500);
}

export function __stWallpaperFixMappings() { return true; }

export async function __stThemeSend(sock, jid, themeObj, reply, cmdText) {
    try {
        // Do NOT use sock.sendMessage() — it calls getMediaType and throws "Invalid media type"
        // for chat_theme because chat_theme is not media.
        // Build the WA message directly and relay it, bypassing the media pipeline.
        const content = {
            chatThemeMessage: {
                theme: themeObj
            }
        };
        const waMsg = generateWAMessageFromContent(jid, content, {
            userJid: sock.user?.id,
        });
        await sock.relayMessage(jid, waMsg.message, {
            messageId: waMsg.key.id,
        });
        return 'sent';
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        await reply('Theme failed: ' + msg + '\nRun themecheck.');
        return 'failed';
    }
}