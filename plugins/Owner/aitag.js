import { getAiTag, setAiTag, getPrefix } from '../../lib/config.js';

export default {
    command: 'aitag',
    description: 'Toggle the Meta AI icon on outgoing messages',
    category: 'Owner',
    ownerOnly: true,
    usage: 'aitag <on/off>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();
        const currentStatus = getAiTag();

        if (!action) {
            return ctx.reply(`🤖 *AI Tag*\n\n*Status:* ${currentStatus ? '✅ ON' : '❌ OFF'}\n\n*Usage:*\n\`${prefix}aitag on\` - Shows AI icon\n\`${prefix}aitag off\` - Removes AI icon`);
        }

        if (action === 'on') {
            setAiTag(true);
            return ctx.reply('✅ *AI Tag Enabled*\n\nAll bot replies will now show the Meta AI icon.');
        }

        if (action === 'off') {
            setAiTag(false);
            return ctx.reply('❌ *AI Tag Disabled*\n\nBot replies will look like normal messages.');
        }

        return ctx.reply(`❌ Invalid option. Use \`${prefix}aitag on\` or \`${prefix}aitag off\`.`);
    }
};
