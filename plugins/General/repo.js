import { getBotName } from '../../lib/config.js';

export default {
    command: 'repo',
    description: 'Get the bot repository link',
    category: 'General',
    ownerOnly: false,
    usage: 'repo',

    async execute(sock, m, args, ctx) {
    
        const botName = getBotName();

        const text = `🐙 *${botName} Repository*\n\n` +
            `Please note: The Queen Xavena repository is not publicly disclosed. For access requests, kindly contact the developer at https://t.me/dark_heart011`;

        await ctx.reply(text);
    }
};