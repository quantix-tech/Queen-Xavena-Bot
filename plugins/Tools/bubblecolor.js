import { getPrefix } from '../../lib/config.js';
import { __stThemeSend } from '../../lib/theme.js';

export default {
    command: 'bubblecolor',
    description: 'Set bubble colour theme for everyone in this chat',
    category: 'Themes',
    ownerOnly: true,
    usage: 'bubblecolor <name> / bubblecolor list',

    async execute(sock, m, args, ctx) {
        const prefix = ctx.prefix || await getPrefix() || '.';
        const __stBubbles = { blue: 'Default-Blue@Minimal', tonal: 'Default-Blue@Tonal@Minimal', emerald: 'Emerald@Minimal', emeraldtonal: 'Emerald@Tonal@Minimal', pink: 'Pink@Minimal', red: 'Red@Minimal', royal: 'Royal-Blue@Minimal', purple: 'Tyrian-Purple@Minimal', green: 'WhatsApp-Green@Minimal' };
        const sub = (args[0] || '').toLowerCase();
        if (!sub || sub === 'list' || sub === 'help') {
            return ctx.reply(`BUBBLE COLOUR — chat bubble theme for everyone in this chat\n\n${prefix}bubblecolor <name> — set the bubble colour\n\nblue, tonal, emerald, emeraldtonal, pink, red, royal, purple, green`);
        }
        const id = __stBubbles[sub];
        if (!id) return ctx.reply(`Unknown bubble "${sub}". Use ${prefix}bubblecolor list for the names.`);
        const _sT = await __stThemeSend(sock, m.key.remoteJid, { colorSchemeId: id }, ctx.reply, `${prefix}bubblecolor ${sub}`);
        if (_sT !== 'sent') return;
        return ctx.reply('Bubble colour set to ' + sub + ' for everyone in this chat.');
    }
};