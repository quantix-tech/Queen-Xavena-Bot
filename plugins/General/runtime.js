import { getBotName } from '../../lib/config.js';

export default {
    command: 'runtime',
    description: 'Check how long the bot has been running',
    category: 'General',
    ownerOnly: false,
    usage: 'runtime',

    async execute(sock, m, args, ctx) {
        const uptime = process.uptime();
        
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        let timeStr = '';
        if (days > 0) timeStr += `*${days}d* `;
        if (hours > 0) timeStr += `*${hours}h* `;
        if (minutes > 0) timeStr += `*${minutes}m* `;
        timeStr += `*${seconds}s*`;

        // 👇 FIX: Added the parentheses to call the function
        const botName = getBotName();

        await ctx.reply(`⏱️ *${botName} Runtime*\n\nI have been online for:\n${timeStr}`);
    }
};