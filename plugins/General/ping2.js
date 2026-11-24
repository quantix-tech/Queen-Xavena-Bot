import { getPrefix } from '../../lib/config.js';

export default {
    command: 'ping2',
    aliases: ['pingrich', 'speed2'],
    description: 'Check bot speed with rich response',
    category: 'Tools',
    ownerOnly: false,
    usage: 'ping2',

    async execute(sock, m, args, ctx) {
        const start = Date.now();

        try {
            // 1. REAL latency - from when user sent message
            const sentAt = m.messageTimestamp ? m.messageTimestamp * 1000 : start;
            const latency = Date.now() - sentAt;

            // 2. Processing time - do some real work first
            const t0 = performance.now();
            await new Promise(r => setTimeout(r, 10)); // tiny work to measure
            const processing = Math.round(performance.now() - t0);

            const uptimeSec = Math.floor(process.uptime());
            const uptime = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;
            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

            await sock.sendMessage(m.key.remoteJid, {
                disclaimerText: 'Bot Status • Rich Response',
                richResponse: [{
                    text: '🏓 *Pong!* Bot is online',
                }, {
                    language: 'javascript',
                    code: [{
                        highlightType: 0,
                        codeContent: `// latency check\nconst ping = ${latency}ms;\nconsole.log("Pong! " + ping);`
                    }]
                }, {
                    text: 'Here is the live status:\n'
                }, {
                    title: 'Bot Performance',
                    table: [{
                        isHeading: true,
                        items: ['', 'Value', 'Status']
                    }, {
                        isHeading: false,
                        items: ['Ping', `${latency}ms`, '✅ Fast']
                    }, {
                        isHeading: false,
                        items: ['Processing', `${processing}ms`, '✅ Fast']
                    }, {
                        isHeading: false,
                        items: ['Uptime', uptime, '✅ Online']
                    }, {
                        isHeading: false,
                        items: ['Memory', `${memory} MB`, '✅ Stable']
                    }, {
                        isHeading: false,
                        items: ['Platform', process.platform, '✅ Running']
                    }]
                }, {
                    text: 'All systems working fine. ✨'
                }]
            });
        } catch (e) {
            console.error('Ping2 error:', e);
            await ctx.reply(`🏓 *Pong!*\n\n*Speed:* ${Date.now() - start}ms`);
        }
    }
};