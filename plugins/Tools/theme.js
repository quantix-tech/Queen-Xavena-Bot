import { getPrefix } from '../../lib/config.js';
import { __stThemeArgb, __stThemeSend } from '../../lib/theme.js';

export default {
    command: 'theme',
    description: 'Set solid background colour for everyone in this chat',
    category: 'Themes',
    ownerOnly: true,
    usage: 'theme <colour> / theme off / theme list',

    async execute(sock, m, args, ctx) {
        const prefix = ctx.prefix || await getPrefix() || '.';
        const sub = (args[0] || '').toLowerCase();
        if (!sub || sub === 'list' || sub === 'help') {
            return ctx.reply(`CHAT THEME — background colour for everyone in this chat\n\n${prefix}theme <colour> — set a solid background colour\n${prefix}theme off — remove the theme (back to default)\n\nColours: red, blue, green, yellow, orange, pink, purple, black, white, brown, grey, cyan, lime, gold, silver, maroon, navy, teal, magenta, violet, indigo, peach, sky, mint, coral, lavender, crimson, turquoise — or a hex like FF0000\n\nRun it inside the group or chat you want to repaint. In groups the bot must be admin (or the group setting Edit group info = All participants), that is WhatsApp own rule.`);
        }
        if (sub === 'off' || sub === 'clear' || sub === 'default') {
            const _sT = await __stThemeSend(sock, m.key.remoteJid, { clearTheme: true }, ctx.reply, `${prefix}theme off`);
            if (_sT !== 'sent') return;
            return ctx.reply('Theme cleared — this chat is back to the default background for everyone.');
        }
        const argb = __stThemeArgb(sub);
        if (argb == null) return ctx.reply(`Unknown colour "${sub}". Use ${prefix}theme list for the colour names.`);
        const _sT = await __stThemeSend(sock, m.key.remoteJid, { solidColor: { backgroundLightArgb: argb, backgroundDarkArgb: argb, isDoodleEnabled: false } }, ctx.reply, `${prefix}theme ${sub}`);
        if (_sT !== 'sent') return;
        return ctx.reply('Background set to ' + sub + ' for everyone in this chat.');
    }
};