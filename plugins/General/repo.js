import { getBotName } from '../../lib/config.js';

export default {
    command: 'repo',
    description: 'Get the bot repository link',
    category: 'General',
    ownerOnly: false,
    usage: 'repo',

    async execute(sock, m, args, ctx) {
        const REPO_URL = 'https://github.com/Quantix-tech/Queen-Xavena-Bot';
        const botName = getBotName();

        const text = `🐙 *${botName} Repository*\n\n` +
            `You can view the source code, report issues, or fork the project here:\n\n` +
            `🔗 ${REPO_URL}\n\n` +
            `_Don't forget to star the repo!_ ⭐`;

        await ctx.reply(text);
    }
};