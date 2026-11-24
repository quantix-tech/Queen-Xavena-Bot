import { getPrefix, getBotName, getMenuImage } from '../../lib/config.js';

export default {
    command: 'ping2',
    aliases: ['pingrich', 'speed2'],
    description: 'Check bot speed with interactive buttons',
    category: 'General',
    ownerOnly: false,
    usage: 'ping2',

    async execute(sock, m, args, ctx) {
        const start = Date.now();
        const prefix = getPrefix();
        const botName = getBotName();
        const menuImageUrl = getMenuImage();
        const chatJid = m.key.remoteJid;

        try {
            const latency = Date.now() - start;
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            let timeStr = '';
            if (days > 0) timeStr += `${days}d `;
            if (hours > 0) timeStr += `${hours}h `;
            if (minutes > 0) timeStr += `${minutes}m `;
            timeStr += `${seconds}s`;

            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

            const text = `🏓 *${botName} Pong!*\n\n` +
                `⚡ *Latency:* ${latency}ms\n` +
                `⏱️ *Uptime:* ${timeStr}\n` +
                `🧠 *Memory:* ${memory} MB\n` +
                `📦 *Node:* ${process.version}`;

            await sock.sendMessage(chatJid, {
                image: { url: menuImageUrl },
                caption: text,
                footer: 'QX-CORE • Interactive',
                optionText: '👉🏻 Select Options',
                optionTitle: '📄 Select Options',
                nativeFlow: [{
                    text: '🏓 Ping',
                    id: `${prefix}ping`,
                    icon: 'review'
                }, {
                    text: '⏱️ Runtime',
                    id: `${prefix}runtime`,
                    icon: 'default'
                }, {
                    text: '📋 Menu',
                    id: `${prefix}menu`,
                    icon: 'default'
                }],
            }, { quoted: m });

        } catch (e) {
            console.error('Ping2 error:', e);
            await ctx.reply(`🏓 *Pong!*\n\n⚡ *Latency:* ${Date.now() - start}ms`);
        }
    }
};