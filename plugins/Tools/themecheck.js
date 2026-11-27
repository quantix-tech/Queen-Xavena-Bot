import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { getPrefix } from '../../lib/config.js';
import { getGroupMetadata, isBotAdmin } from '../../lib/utils.js';
import { __stThemePatchServerFile, __stThemePatchProto, __stThemePatchWallpaper } from '../../lib/theme.js';

export default {
    command: 'themecheck',
    description: 'Diagnostic: real theme support check',
    category: 'Themes',
    ownerOnly: true,
    usage: 'themecheck',
    async execute(sock, m, args, ctx) {
        const prefix = ctx.prefix || await getPrefix() || '.';
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');
        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const botIsAdmin = await isBotAdmin(sock, m.key.remoteJid, metadata);
            const serverPatch = __stThemePatchServerFile();
            const protoPatch = __stThemePatchProto();
            const wallPatch = __stThemePatchWallpaper();

            const _main = require.resolve('@itsliaaa/baileys');
            const _root = path.join(path.dirname(_main), '..');
            const _lib = path.join(_root, 'lib');
            let _pkgVer = '?';
            try { _pkgVer = JSON.parse(fs.readFileSync(path.join(_root, 'package.json'), 'utf8')).version || '?'; } catch {}

            // REAL check: find getMediaType file, does ITS body contain chat_theme?
            let _realGetMedia = false;
            let _realFile = '';
            const walk = (d) => {
                let list = [];
                try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
                for (const e of list) {
                    const p = path.join(d, e.name);
                    if (e.isDirectory()) walk(p);
                    else if (e.name.endsWith('.js')) {
                        let src = '';
                        try { src = fs.readFileSync(p, 'utf8'); } catch { continue; }
                        if (src.includes('getMediaType') && src.includes('imageMessage')) {
                            _realFile = path.relative(_lib, p);
                            if (src.includes('chatThemeMessage') && src.includes("'chat_theme'")) _realGetMedia = true;
                        }
                    }
                }
            };
            walk(_lib);

            let _msg = `🛠 *Theme check*\n`;
            _msg += `• Baileys: *@itsliaaa/baileys@${_pkgVer}*\n`;
            _msg += `• Type 34 CHAT_THEME_SETTING: *yes*\n`;
            _msg += `• Proto encode patch (fixed32 ARGB): *${protoPatch === 'patched' || protoPatch === 'present-or-no-uint32' ? 'yes' : 'no'}* (${protoPatch})\n`;
            _msg += `• getMediaType chat_theme: *${_realGetMedia ? 'yes' : 'no'}* (${_realFile} / ${serverPatch})\n`;
            _msg += `• Wallpaper HKDF / path: *${wallPatch === 'present' ? 'yes' : 'no'}*\n`;
            _msg += `• Chat: *group*\n`;
            _msg += `• Bot is group admin: *${botIsAdmin ? 'yes' : 'no'}*\n`;
            _msg += `• Patch state: *${serverPatch}*`;
            if (String(serverPatch).startsWith('patched') || String(protoPatch).startsWith('patched')) _msg += `\n\nPatch was just applied — bot will restart. Run ${prefix}theme red again after restart.`;
            return ctx.reply(_msg);
        } catch (e) {
            return ctx.reply('Theme check failed: ' + (e && e.message ? e.message : String(e)));
        }
    }
};