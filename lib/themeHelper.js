import { proto } from '@itsliaaa/baileys';

const COLORS = {
    red: 'FF0000', green: '00FF00', blue: '0000FF', yellow: 'FFFF00',
    orange: 'FF8000', pink: 'FF69B4', purple: '800080', black: '000000',
    white: 'FFFFFF', brown: 'A52A2A', grey: '808080', gray: '808080',
    cyan: '00FFFF', lime: '00FF00', gold: 'FFD700', silver: 'C0C0C0'
};

export function installThemePatch() {
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
                        // 👇 ADDED DOODLE ARGB FIELDS
                        if (cts.solidColor.doodleLightArgb != null) sc.uint32(29).fixed32(cts.solidColor.doodleLightArgb >>> 0);
                        if (cts.solidColor.doodleDarkArgb != null) sc.uint32(37).fixed32(cts.solidColor.doodleDarkArgb >>> 0);
                        sc.ldelim();
                    }
                    sub.ldelim();
                }
                return w;
            };
        }
    }
    M.__themePatched = true;
    console.log('[theme] ProtocolMessage patched for chatThemeSetting (with doodles).');
}

export function getArgb(colorName) {
    const name = String(colorName || '').trim().toLowerCase();
    let hex = COLORS[name];
    
    if (!hex) {
        const clean = name.replace(/^#/, '').toUpperCase();
        if (/^[0-9A-F]{6}$/.test(clean)) hex = clean;
        else return null;
    }
    
    return (0xFF000000 | parseInt(hex, 16)) >>> 0;
}