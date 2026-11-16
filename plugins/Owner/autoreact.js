import { getPrefix } from '../../lib/config.js';
import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';

export default {
    command: 'autoreact',
    description: 'Toggle Auto React for messages',
    category: 'Owner',
    ownerOnly: true,
    usage: 'autoreact <on/off>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            setGroupFeature('global', 'autoreact', true);
            return ctx.reply('❤️ *AutoReact Enabled*\n\nI will now react to messages with random emojis.');
        }
        if (action === 'off') {
            setGroupFeature('global', 'autoreact', false);
            return ctx.reply('❌ *AutoReact Disabled*');
        }

        const status = getGroupFeature('global', 'autoreact') ? '✅ ON' : '❌ OFF';
        return ctx.reply(`❤️ *AutoReact*\n\n*Status:* ${status}\n\n*Usage:*\n\`${prefix}autoreact on\`\n\`${prefix}autoreact off\``);
    }
};