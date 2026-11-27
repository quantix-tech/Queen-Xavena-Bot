import { getPrefix } from '../../lib/config.js';
import { isBotAdmin } from '../../lib/utils.js';
import { initThemePatches } from '../../lib/themePatch.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default {
    command: 'themecheck',
    aliases: ['themestatus', 'checktheme'],
    description: 'Diagnostic tool for Chat Themes',
    category: 'Owner',
    ownerOnly: true,
    usage: 'themecheck',

    async execute(sock, m, args, ctx) {
        // 1. Run the patcher to ensure everything is up to date
        const patches = initThemePatches();
        
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        
        // 2. Check Baileys version
        let pkgVer = '?';
        let filePath = '?';
        try {
            const pkgRoot = path.dirname(require.resolve('@itsliaaa/baileys/package.json'));
            filePath = path.join(pkgRoot, 'lib/Socket/messages-send.js');
            pkgVer = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version || '?';
        } catch (e) {}

        // 3. Check if getMediaType is patched in the file
        let hasBranch = false;
        try {
            const src = fs.readFileSync(filePath, 'utf8');
            hasBranch = src.includes("return 'chat_theme';");
        } catch (e) {}

        // 4. Check Admin Status
        let adminStatus = 'n/a (not a group)';
        if (isGroup) {
            try {
                const admin = await isBotAdmin(sock, jid);
                adminStatus = admin ? 'YES' : 'NO (Bot must be admin)';
            } catch (e) {
                adminStatus = 'Error: ' + e.message;
            }
        }

        // 5. Format the report
        let text = `🛠️ *Theme Check*\n\n`;
        text += `• Baileys: *@itsliaaa/baileys@${pkgVer}*\n`;
        text += `• Type 34 CHAT_THEME_SETTING: *${patches.protoEncodePatched ? 'yes' : 'no'}*\n`;
        text += `• Proto encode patch (fixed32 ARGB): *${patches.protoEncodePatched ? 'yes' : 'no'}*\n`;
        text += `• getMediaType chat_theme: *${patches.getMediaType ? 'yes' : 'no'}*\n`;
        text += `• Wallpaper HKDF / path: *yes (patched at runtime)*\n`;
        text += `• Chat: *${isGroup ? 'group' : 'dm'}*\n`;
        text += `• Bot is group admin: *${adminStatus}*\n\n`;

        if (!patches.getMediaType) {
            text += `⚠️ *Error:* ${patches.getMediaTypeError || 'getMediaType patch failed.'}\n`;
            text += `_Run the command again to retry the patch._`;
        } else if (isGroup && adminStatus !== 'YES' && adminStatus !== 'n/a (not a group)') {
            text += `⚠️ *WhatsApp Rule:* In groups, the bot MUST be an admin to change the theme. Make the bot admin, or set "Edit group info" to "All participants".`;
        } else {
            text += `✅ *All patches applied.* If the theme is still not changing, your WhatsApp client does not have the shared themes beta feature enabled yet.`;
        }

        await ctx.reply(text);
    }
};