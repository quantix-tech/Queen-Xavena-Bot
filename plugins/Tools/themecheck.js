import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { getPrefix } from '../../lib/config.js';
import { getGroupMetadata, isBotAdmin } from '../../lib/utils.js';
import { __stThemePatchServerFile } from '../../lib/theme.js';

export default {
    command: 'themecheck',
    description: 'Diagnostic: shows patch state + Baileys version + if bot is group admin',
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

            globalThis.__stThemeServerPatch = __stThemePatchServerFile();
            const _main = require.resolve('@itsliaaa/baileys');
            const _send = path.join(path.dirname(_main), 'Socket', 'messages-send.js');
            let _pkgVer = '?';
            try { _pkgVer = JSON.parse(fs.readFileSync(path.join(path.dirname(_main), '..', 'package.json'), 'utf8')).version || '?'; } catch {}
            const _src = fs.readFileSync(_send, 'utf8');
            const _hasBranch = _src.includes("return 'chat_theme';");
            const _count = (_src.match(/chat_theme/g) || []).length;

            let _msg = 'THEME CHECK\n\npatch state: ' + String(globalThis.__stThemeServerPatch) + '\nBaileys: ' + _pkgVer + '\nbranch in file: ' + _hasBranch + '\nchat_theme mentions: ' + _count + '\nbot is group admin: ' + String(botIsAdmin) + '\nfile: ' + _send;
            if (globalThis.__stThemeServerPatch === 'patched') _msg += `\n\nPatch was just applied — run ${prefix}theme red now, the bot restarts once, then run it again.`;
            return ctx.reply(_msg);
        } catch (e) {
            return ctx.reply('Theme check failed: ' + (e && e.message ? e.message : String(e)));
        }
    }
};