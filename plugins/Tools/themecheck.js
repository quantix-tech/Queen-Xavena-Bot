import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { getPrefix } from '../../lib/config.js';
import { getGroupMetadata, isBotAdmin } from '../../lib/utils.js';
import { __stThemePatchServerFile } from '../../lib/theme.js';

export default {
    command: 'themecheck',
    description: 'Diagnostic: full theme support check',
    category: 'Themes',
    ownerOnly: true,
    usage: 'themecheck',

    async execute(sock, m, args, ctx) {
        const prefix = ctx.prefix || await getPrefix() || '.';

        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const botIsAdmin = await isBotAdmin(sock, m.key.remoteJid, metadata);
            const isGroup = 'group';

            globalThis.__stThemeServerPatch = __stThemePatchServerFile();
            const _main = require.resolve('@itsliaaa/baileys');
            const _baileysRoot = path.join(path.dirname(_main), '..');
            const _lib = path.join(_baileysRoot, 'lib');

            let _pkgVer = '?';
            try { _pkgVer = JSON.parse(fs.readFileSync(path.join(_baileysRoot, 'package.json'), 'utf8')).version || '?'; } catch {}

            const _readAll = (dir) => {
                let out = '';
                const walk = (d) => {
                    let list = [];
                    try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
                    for (const e of list) {
                        const p = path.join(d, e.name);
                        if (e.isDirectory()) walk(p);
                        else if (e.name.endsWith('.js') || e.name.endsWith('.d.ts')) {
                            try { out += '\n' + fs.readFileSync(p, 'utf8'); } catch {}
                        }
                    }
                };
                walk(dir);
                return out;
            };
            const _all = _readAll(_lib);

            const _hasType34 = _all.includes('CHAT_THEME_SETTING') || _all.includes('chat_theme');
            const _hasProtoPatch = _all.includes('backgroundLightArgb') && (_all.includes('fixed32') || _all.includes('ARGB'));
            const _hasGetMediaType = _all.includes('chat_theme') && _all.includes('getMediaType');
            const _hasWallpaper = _all.includes('chat-wallpaper-image') && (_all.includes('HKDF') || _all.includes('hkdf') || _all.includes('encryptedStream'));

            const _yes = (v) => v ? 'yes' : 'no';

            let _msg = `🛠 *Theme check*\n`;
            _msg += `• Baileys: *@itsliaaa/baileys@${_pkgVer}*\n`;
            _msg += `• Type 34 CHAT_THEME_SETTING: *${_yes(_hasType34)}*\n`;
            _msg += `• Proto encode patch (fixed32 ARGB): *${_yes(_hasProtoPatch)}*\n`;
            _msg += `• getMediaType chat_theme: *${_yes(_hasGetMediaType)}*\n`;
            _msg += `• Wallpaper HKDF / path: *${_yes(_hasWallpaper)}*\n`;
            _msg += `• Chat: *${isGroup}*\n`;
            _msg += `• Bot is group admin: *${botIsAdmin ? 'yes' : 'no'}*\n`;
            _msg += `• Patch state: *${String(globalThis.__stThemeServerPatch)}*`;

            if (globalThis.__stThemeServerPatch === 'patched') _msg += `\n\nPatch was just applied — run ${prefix}theme red now, the bot restarts once, then run it again.`;
            return ctx.reply(_msg);
        } catch (e) {
            return ctx.reply('Theme check failed: ' + (e && e.message ? e.message : String(e)));
        }
    }
};