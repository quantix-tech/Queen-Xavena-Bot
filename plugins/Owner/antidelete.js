import { getAntidelete, setAntidelete, getPrefix } from '../../lib/config.js';

export default {
    command: 'antidelete',
    description: 'Toggle forwarding deleted messages to owner',
    category: 'Owner',
    ownerOnly: true,
    usage: 'antidelete <on/off>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            setAntidelete(true);
            return ctx.reply('🛡️ *Antidelete Enabled*\n\nDeleted messages will now be forwarded to your DM.');
        }
        if (action === 'off') {
            setAntidelete(false);
            return ctx.reply('❌ *Antidelete Disabled*');
        }

        const status = getAntidelete() ? '✅ ON' : '❌ OFF';
        return ctx.reply(`🛡️ *Antidelete Mode*\n\n*Status:* ${status}\n\n*Usage:*\n\`${prefix}antidelete on\`\n\`${prefix}antidelete off\``);
    }
};