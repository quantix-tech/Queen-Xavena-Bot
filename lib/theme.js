// lib/theme.js
// Kaizen chat theme sender — Type 34 CHAT_THEME_SETTING

const THEME_PRESETS = {
    blue: {
        scheme: 'Default-Blue@Minimal',
        bgLight: 0xFFD9E8FF >>> 0,
        bgDark: 0xFF0A1628 >>> 0,
        doodleLight: 0xFF3B82F6 >>> 0,
        doodleDark: 0xFF1E40AF >>> 0,
    },
    darkblue: {
        scheme: 'Default-Darkblue@Minimal',
        bgLight: 0xFFD9E8FF >>> 0,
        bgDark: 0xFF0A1628 >>> 0,
        doodleLight: 0xFF1E40AF >>> 0,
        doodleDark: 0xFF1E3A8A >>> 0,
    },
    red: {
        scheme: 'Default-Red@Minimal',
        bgLight: 0xFFFFD9D9 >>> 0,
        bgDark: 0xFF2B0A0A >>> 0,
        doodleLight: 0xFFEF4444 >>> 0,
        doodleDark: 0xFF991B1B >>> 0,
    },
    green: {
        scheme: 'Default-Green@Minimal',
        bgLight: 0xFFD9FFE8 >>> 0,
        bgDark: 0xFF0A2B1A >>> 0,
        doodleLight: 0xFF22C55E >>> 0,
        doodleDark: 0xFF166534 >>> 0,
    },
    purple: {
        scheme: 'Default-Purple@Minimal',
        bgLight: 0xFFF0D9FF >>> 0,
        bgDark: 0xFF1A0A2B >>> 0,
        doodleLight: 0xFFA855F7 >>> 0,
        doodleDark: 0xFF6B21A8 >>> 0,
    },
    pink: {
        scheme: 'Default-Pink@Minimal',
        bgLight: 0xFFFFD9EC >>> 0,
        bgDark: 0xFF2B0A1E >>> 0,
        doodleLight: 0xFFEC4899 >>> 0,
        doodleDark: 0xFFBE185D >>> 0,
    },
};

const BUBBLE_SCHEMES = {
    bluebubble: 'Default-Blue@Bubble',
    redbubble: 'Default-Red@Bubble',
    greenbubble: 'Default-Green@Bubble',
};

function normalizeKey(name) {
    return String(name || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

async function relayChatTheme(sock, jid, theme) {
    const payload = {
        colorSchemeId: theme.colorSchemeId,
        solidColor: {
            backgroundLightArgb: theme.solidColor.backgroundLightArgb >>> 0,
            backgroundDarkArgb: theme.solidColor.backgroundDarkArgb >>> 0,
            isDoodleEnabled: !!theme.solidColor.isDoodleEnabled,
            doodleLightArgb: theme.solidColor.doodleLightArgb >>> 0,
            doodleDarkArgb: theme.solidColor.doodleDarkArgb >>> 0,
        }
    };

    // Type 34 — CHAT_THEME_SETTING, NOT chatModify
    return await sock.relayMessage(jid, {
        chatThemeSetting: payload
    }, {});
}

async function applyNamedTheme(sock, jid, name) {
    const key = normalizeKey(name);
    const preset = THEME_PRESETS[key];
    if (preset) {
        return relayChatTheme(sock, jid, {
            colorSchemeId: preset.scheme,
            solidColor: {
                backgroundLightArgb: preset.bgLight >>> 0,
                backgroundDarkArgb: preset.bgDark >>> 0,
                isDoodleEnabled: true,
                doodleLightArgb: preset.doodleLight >>> 0,
                doodleDarkArgb: preset.doodleDark >>> 0
            }
        });
    }
    if (BUBBLE_SCHEMES[key]) {
        return relayChatTheme(sock, jid, {
            colorSchemeId: BUBBLE_SCHEMES[key],
            solidColor: {
                backgroundLightArgb: 0xFFFFFFFF >>> 0,
                backgroundDarkArgb: 0xFF0B141A >>> 0,
                isDoodleEnabled: true,
                doodleLightArgb: 0xFF3B82F6 >>> 0,
                doodleDarkArgb: 0xFF1E40AF >>> 0
            }
        });
    }
    throw new Error(`Unknown theme preset: ${name}`);
}

export { THEME_PRESETS, BUBBLE_SCHEMES, relayChatTheme, applyNamedTheme };