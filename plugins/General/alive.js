import os from 'os';
import { getBotName } from '../../lib/config.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'alive',
    description: 'Check if the bot is alive',
    category: 'General',
    ownerOnly: false,
    usage: 'alive',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const ram = (os.totalmem() - os.freemem()) / (1024 * 1024);
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const secs = Math.floor(uptime % 60);
        const botName = getBotName();

        await ctx.reply(`✅ *${botName} is Alive!*\n\n*Uptime:* ${hours}h ${mins}m ${secs}s\n*RAM:* ${ram.toFixed(1)} MB\n*Prefix:* \`${prefix}\`\n\n_Type ${prefix}menu to see commands_`);
    }
};