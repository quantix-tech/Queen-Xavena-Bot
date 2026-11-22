import os from 'os';
import { getMode } from '../../lib/config.js';

export default {
    command: 'stats',
    description: 'Bot system statistics',
    category: 'General',
    ownerOnly: false,
    usage: 'stats',

    async execute(sock, m, args, ctx) {
        const totalMem = os.totalmem() / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        const uptime = process.uptime();
        const hrs = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const secs = Math.floor(uptime % 60);

        await ctx.reply(`📊 *Bot Statistics*\n\n*Mode:* ${getMode()}\n*Uptime:* ${hrs}h ${mins}m ${secs}s\n*RAM:* ${usedMem.toFixed(1)}MB / ${totalMem.toFixed(1)}MB\n*Cores:* ${os.cpus().length}\n*Platform:* ${os.platform()}\n*Node:* ${process.version}`);
    }
};