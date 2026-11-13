import { getChatbotMode, setChatbotMode, getPrefix } from '../../lib/config.js';

export default {
    command: 'chatbot',
    description: 'Toggle AI chatbot (chat without prefix)',
    category: 'Owner',
    ownerOnly: true,
    usage: 'chatbot <on/off>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            setChatbotMode(true);
            return ctx.reply('✅ *Chatbot Enabled*\n\nUsers can now chat with me naturally without using a prefix.');
        }

        if (action === 'off') {
            setChatbotMode(false);
            return ctx.reply('❌ *Chatbot Disabled*\n\nI will only respond to commands now.');
        }

        const status = getChatbotMode() ? '✅ ON' : '❌ OFF';
        return ctx.reply(`🤖 *Chatbot Mode*\n\n*Status:* ${status}\n\n*Usage:*\n\`${prefix}chatbot on\`\n\`${prefix}chatbot off\``);
    }
};