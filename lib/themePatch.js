import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const patchesApplied = {
    getMediaType: false,
    getMediaTypeError: null,
    protoEncodePatched: false,
};

// ─── 1. PROTO PATCH ───
export function patchProtoEncode(proto) {
    const M = proto?.Message;
    if (!M || M.__themePatched) return;
    const PM = M.ProtocolMessage;

    if (PM) {
        if (PM.Type && PM.Type.CHAT_THEME_SETTING == null) {
            PM.Type.CHAT_THEME_SETTING = 34;
            PM.Type[34] = 'CHAT_THEME_SETTING';
        }

        if (typeof PM.encode === 'function') {
            const prevEncode = PM.encode;
            PM.encode = function (message, writer) {
                const cts = message?.chatThemeSetting;
                if (cts) delete message.chatThemeSetting;
                const w = prevEncode.call(this, message, writer);

                if (cts) {
                    message.chatThemeSetting = cts;
                    const sub = w.uint32(242).fork();
                    if (cts.settingTimestampMs != null) sub.uint32(8).int64(cts.settingTimestampMs);
                    if (cts.clearTheme) sub.uint32(16).bool(true);
                    if (cts.colorSchemeId) sub.uint32(26).string(cts.colorSchemeId);

                    if (cts.solidColor) {
                        const sc = sub.uint32(90).fork();
                        if (cts.solidColor.backgroundLightArgb != null) sc.uint32(13).fixed32(cts.solidColor.backgroundLightArgb >>> 0);
                        if (cts.solidColor.backgroundDarkArgb != null) sc.uint32(21).fixed32(cts.solidColor.backgroundDarkArgb >>> 0);
                        if (cts.solidColor.isDoodleEnabled != null) sc.uint32(24).bool(!!cts.solidColor.isDoodleEnabled);
                        // FIXED: 37 = doodleLight, 45 = doodleDark (was 29 / 37)
                        if (cts.solidColor.doodleLightArgb != null) sc.uint32(37).fixed32(cts.solidColor.doodleLightArgb >>> 0);
                        if (cts.solidColor.doodleDarkArgb != null) sc.uint32(45).fixed32(cts.solidColor.doodleDarkArgb >>> 0);
                        sc.ldelim();
                    }
                    sub.ldelim();
                }
                return w;
            };
        }
    }
    M.__themePatched = true;
    patchesApplied.protoEncodePatched = true;
    console.log('[theme] ProtocolMessage patched for chatThemeSetting.');
}

// ─── 2. MEDIA MAPPINGS PATCH ───
function ensureMediaMappings() {
    try {
        const baileys = require('@itsliaaa/baileys');
        const hkdf = baileys.MEDIA_HKDF_KEY_MAPPING;
        const pathMap = baileys.MEDIA_PATH_MAP;

        if (hkdf && hkdf['chat-wallpaper-image'] == null) {
            hkdf['chat-wallpaper-image'] = 'Chat Wallpaper';
        }
        if (pathMap && pathMap['chat-wallpaper-image'] == null) {
            pathMap['chat-wallpaper-image'] = '/mms/image';
        }
    } catch (err) {
        console.warn('[theme] Failed to patch media mappings:', err.message);
    }
}

// ─── 3. GET MEDIA TYPE ON-DISK PATCH ───
function ensureGetMediaTypePatch() {
    if (patchesApplied.getMediaType) return true;
    try {
        const pkgRoot = path.dirname(require.resolve('@itsliaaa/baileys/package.json'));
        const file = path.join(pkgRoot, 'lib/Socket/messages-send.js');

        if (!fs.existsSync(file)) {
            patchesApplied.getMediaTypeError = 'messages-send.js not found';
            return false;
        }

        let src = fs.readFileSync(file, 'utf8');
        if (src.includes("return 'chat_theme'")) {
            patchesApplied.getMediaType = true;
            return true;
        }

        const backup = file + '.bak-chat-theme';
        if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);

        const branch =
            "        if (message.protocolMessage && (message.protocolMessage.type === 34 || message.protocolMessage.chatThemeSetting)) {\n" +
            "            return 'chat_theme';\n" +
            "        }\n";

        const anchor = '    const getMediaType = (message) => {\n        if (message.imageMessage) {';

        if (src.includes(anchor)) {
            src = src.replace(
                anchor,
                '    const getMediaType = (message) => {\n' + branch + '        if (message.imageMessage) {'
            );
        } else {
            patchesApplied.getMediaTypeError = 'getMediaType anchor not found';
            return false;
        }

        fs.writeFileSync(file, src);
        if (!fs.readFileSync(file, 'utf8').includes("return 'chat_theme'")) {
            patchesApplied.getMediaTypeError = 'write did not stick';
            return false;
        }

        patchesApplied.getMediaType = true;
        console.log('[theme] getMediaType patched successfully.');
        return true;
    } catch (err) {
        patchesApplied.getMediaTypeError = err.message;
        return false;
    }
}

// ─── INITIALIZER ───
export function initThemePatches() {
    try {
        const { proto } = require('@itsliaaa/baileys');
        patchProtoEncode(proto);
    } catch (err) {
        console.warn('[theme] proto patch:', err.message);
    }
    ensureMediaMappings();
    ensureGetMediaTypePatch();
    return patchesApplied;
}

// ─── COLORS — FROM 3RD FILE ───
const COLORS = {
    red: 'FF0000', green: '00FF00', blue: '0000FF', yellow: 'FFFF00',
    orange: 'FF8000', pink: 'FF69B4', purple: '800080', black: '000000',
    white: 'FFFFFF', brown: 'A52A2A', grey: '808080', gray: '808080',
    cyan: '00FFFF', lime: '00FF00', gold: 'FFD700', silver: 'C0C0C0',
    maroon: '800000', navy: '000080', teal: '008080', magenta: 'FF00FF',
    violet: '8A2BE2', indigo: '4B0082', peach: 'FFDAB9', sky: '87CEEB',
    mint: '98FF98', coral: 'FF7F50', lavender: 'E6E6FA', crimson: 'DC143C',
    turquoise: '40E0D0'
};

// ─── PRESETS — FROM 3RD FILE ───
export const THEME_PRESETS = {
    blue: { scheme: 'Default-Blue@Minimal', bgLight: 0xFFE7F3FB, bgDark: 0xFF0B141A, doodleLight: 0xFF7EC8E3, doodleDark: 0xFF4A9FD8 },
    tonal: { scheme: 'Default-Blue@Tonal@Minimal', bgLight: 0xFFE7F3FB, bgDark: 0xFF0B141A, doodleLight: 0xFF7EC8E3, doodleDark: 0xFF4A9FD8 },
    emerald: { scheme: 'Emerald@Minimal', bgLight: 0xFFE8F8EF, bgDark: 0xFF0B1A12, doodleLight: 0xFF6BCF9B, doodleDark: 0xFF3D9B6E },
    emeraldtonal: { scheme: 'Emerald@Tonal@Minimal', bgLight: 0xFFE8F8EF, bgDark: 0xFF0B1A12, doodleLight: 0xFF6BCF9B, doodleDark: 0xFF3D9B6E },
    pink: { scheme: 'Pink@Minimal', bgLight: 0xFFFFF0F5, bgDark: 0xFF1A0B12, doodleLight: 0xFFF48FB1, doodleDark: 0xFFE91E8C },
    red: { scheme: 'Red@Minimal', bgLight: 0xFFFFEBEE, bgDark: 0xFF1A0B0B, doodleLight: 0xFFEF9A9A, doodleDark: 0xFFE53935 },
    royal: { scheme: 'Royal-Blue@Minimal', bgLight: 0xFFE8EEFF, bgDark: 0xFF0B0F1A, doodleLight: 0xFF90CAF9, doodleDark: 0xFF3F51B5 },
    purple: { scheme: 'Tyrian-Purple@Minimal', bgLight: 0xFFF3E5F5, bgDark: 0xFF120B1A, doodleLight: 0xFFCE93D8, doodleDark: 0xFF9C27B0 },
    green: { scheme: 'WhatsApp-Green@Minimal', bgLight: 0xFFE8F5E9, bgDark: 0xFF0B1A0F, doodleLight: 0xFFA5D6A7, doodleDark: 0xFF25D366 }
};

// ─── BUBBLE SCHEMES — FROM 3RD FILE, for bubble.js only ───
export const BUBBLE_SCHEMES = {
    blue: 'Default-Blue@Minimal',
    tonal: 'Default-Blue@Tonal@Minimal',
    emerald: 'Emerald@Minimal',
    emeraldtonal: 'Emerald@Tonal@Minimal',
    pink: 'Pink@Minimal',
    red: 'Red@Minimal',
    royal: 'Royal-Blue@Minimal',
    purple: 'Tyrian-Purple@Minimal',
    green: 'WhatsApp-Green@Minimal'
};

function normHex(name) {
    const n = String(name || '').trim().toLowerCase();
    if (COLORS[n]) return '#' + COLORS[n];
    const clean = n.replace(/^#/, '').toUpperCase();
    if (/^[0-9A-F]{6}$/.test(clean)) return '#' + clean;
    return null;
}

export function themeArgbPair(name) {
    const key = String(name || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    // Preset first — exactly like 3rd file
    if (THEME_PRESETS[key]) {
        const p = THEME_PRESETS[key];
        return { light: p.bgLight >>> 0, dark: p.bgDark >>> 0, doodleLight: p.doodleLight >>> 0, doodleDark: p.doodleDark >>> 0, scheme: p.scheme };
    }
    const hex = normHex(name);
    if (!hex) return null;

    const light = (0xFF000000 | parseInt(hex.slice(1, 7), 16)) >>> 0;
    const rgb = hex.slice(1, 7);

    const r = Math.round(parseInt(rgb.slice(0, 2), 16) * 0.35);
    const g = Math.round(parseInt(rgb.slice(2, 4), 16) * 0.35);
    const b = Math.round(parseInt(rgb.slice(4, 6), 16) * 0.35);
    const dark = (0xFF000000 | (r << 16) | (g << 8) | b) >>> 0;

   
    return { light, dark, doodleLight: light, doodleDark: dark, scheme: null };
}