import { getPrefix } from '../../lib/config.js';

export default {
    command: 'ping2',
    aliases: ['pingrich', 'speed2'],
    description: 'Check bot speed with interactive buttons',
    category: 'Tools',
    ownerOnly: false,
    usage: 'ping2',

    async execute(sock, m, args, ctx) {
        const start = Date.now();

        try {
            const latency = Date.now() - start;
            const uptimeSec = Math.floor(process.uptime());
            const uptime = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;
            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

            await sock.sendMessage(m.key.remoteJid, {
                text: `🏓 *Pong!* Bot is online\n\n*Ping:* ${latency}ms\n*Uptime:* ${uptime}\n*Memory:* ${memory} MB\n*Platform:* ${process.platform}`,
                footer: 'Bot Status • Interactive',
                optionText: '👉🏻 Select Options',
                optionTitle: '📄 Select Options',
                nativeFlow: [{
                    text: '🏓 Ping Again',
                    id: '.ping2',
                    icon: 'review'
                }, {
                    text: '📋 Menu',
                    id: '.menu',
                    icon: 'default'
                }, {
                    text: '📋 Copy Ping',
                    copy: `Ping: ${latency}ms | Uptime: ${uptime}`
                }, {
                    text: '📋 More Options',
                    sections: [{
                        title: '✨ Bot Options',
                        rows: [{
                            header: '',
                            title: '🏓 Ping Again',
                            description: 'Check speed again',
                            id: '.ping2'
                        }, {
                            header: '',
                            title: '🗄️ Interactive',
                            description: 'Show interactive demo',
                            id: '.interactive'
                        }, {
                            header: '',
                            title: '📋 Menu',
                            description: 'Show all commands',
                            id: '.menu'
                        }]
                    }],
                    icon: 'default'
                }],
            }, { quoted: m });

        } catch (e) {
            console.error('Ping2 Interactive error:', e);
            // Fallback if interactive not supported
            await ctx.reply(`🏓 *Pong!*\n\n*Speed:* ${Date.now() - start}ms`);
        }
    }
};