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
            if (getChatbotMode()) return ctx.reply('🤖 Chatbot is already *ON*.');
            setChatbotMode(true);
            return ctx.reply('✅ *Chatbot Enabled*\n\nUsers can now chat with me naturally without using a prefix.');
        }

        if (action === 'off') {
            if (!getChatbotMode()) return ctx.reply('🤖 Chatbot is already *OFF*.');
            setChatbotMode(false);
            return ctx.reply('❌ *Chatbot Disabled*\n\nI will only respond to commands now.');
        }

        // No arg = show status + toggle
        if (action === 'toggle') {
            const newMode = !getChatbotMode();
            setChatbotMode(newMode);
            return ctx.reply(newMode ? '✅ *Chatbot Enabled*' : '❌ *Chatbot Disabled*');
        }

        const status = getChatbotMode() ? '✅ ON' : '❌ OFF';
        return ctx.reply(`🤖 *Chatbot Mode*\n\n*Status:* ${status}\n\n*Usage:*\n\`${prefix}chatbot on\` - Turn on\n\`${prefix}chatbot off\` - Turn off\n\`${prefix}chatbot toggle\` - Switch it`);
    }
};