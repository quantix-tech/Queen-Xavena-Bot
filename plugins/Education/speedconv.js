import { getPrefix } from '../../lib/config.js';
export default {
    command: 'speedconv',
    aliases: ['speed'],
    description: 'Convert speed between m/s, km/h, mph, knots and feet per second',
    category: 'Education',
    usage: 'speedconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`🚀 *Speed Converter*\n\nUsage: \`${prefix}speedconv 100 kmh to ms\`\nUnits: ms, kmh, mph, knot, fps`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'ms';
        const u = { 'ms': 1, 'm/s': 1, kmh: 0.277778, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444, knots: 0.514444, fps: 0.3048, 'ft/s': 0.3048 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}speedconv 100 kmh to ms\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`🚀 *Speed*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(4))} ${to}*`);
    }
};