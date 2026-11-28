import { getAnticall, setAnticall, getPrefix } from '../../lib/config.js';

export default {
    command: 'anticall',
    aliases: ['callblock', 'antical'],
    description: 'Auto-reject incoming calls',
    category: 'Owner',
    ownerOnly: true,
    usage: 'anticall <on/off>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            if (getAnticall()) return ctx.reply('📵 Anticall is already *ON*.');
            setAnticall(true);
            return ctx.reply('✅ *Anticall Enabled*\n\nIncoming calls will be rejected automatically.');
        }

        if (action === 'off') {
            if (!getAnticall()) return ctx.reply('📵 Anticall is already *OFF*.');
            setAnticall(false);
            return ctx.reply('❌ *Anticall Disabled*\n\nIncoming calls will now come through.');
        }

        const status = getAnticall() ? '✅ ON' : '❌ OFF';
        return ctx.reply(`📵 *Anticall*\n\n*Status:* ${status}\n\n*Usage:*\n\`${prefix}anticall on\` - Reject calls\n\`${prefix}anticall off\` - Allow calls`);
    }
};