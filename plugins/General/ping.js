// Queen Xavena — ping plugin.
// Replies with response time in milliseconds.

const start = Date.now();

export default {
    command: 'ping',
    description: 'Check bot response time',
    category: 'General',
    ownerOnly: false,
    usage: '.ping',

    async execute(sock, m, args, ctx) {
        const latency = Date.now() - start;
        const uptime  = formatUptime(process.uptime());

        await ctx.reply(
`🏓 *Pong!*

⚡ *Latency:* ${latency}ms
⏱️ *Uptime:* ${uptime}
📦 *Node:* ${process.version}`
        );
    }
};

function formatUptime(seconds) {
    const s = Math.floor(seconds);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    parts.push(`${sec}s`);
    return parts.join(' ');
}