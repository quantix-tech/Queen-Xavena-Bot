export default {
    command: 'ping',
    description: 'Check bot response time',
    category: 'General',
    ownerOnly: false,
    usage: 'ping',

    async execute(sock, m, args, ctx) {
        // Start the stopwatch exactly when the command triggers
        const startTime = Date.now();
        
        // Send a temporary "Pong" message
        const sentMsg = await ctx.reply('🏓 *Pong!*');

        // Stop the stopwatch
        const endTime = Date.now();
        const latency = endTime - startTime;

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

        // Edit the message with the real latency and uptime
        await sock.sendMessage(m.key.remoteJid, {
            text: `🏓 *Pong!*\n\n⚡ *Latency:* ${latency}ms\n⏱️ *Uptime:* ${timeStr}\n📦 *Node:* ${process.version}`,
            edit: sentMsg.key
        });
    }
};