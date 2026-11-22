import { getPrefix } from '../../lib/config.js';
export default {
    command: 'lengthconv',
    aliases: ['length'],
    description: 'Convert length between mm, cm, m, km, inches, feet, yards and miles',
    category: 'Education',
    usage: 'lengthconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`📏 *Length Converter*\n\nUsage: \`${prefix}lengthconv 1 km to m\`\nUnits: mm, cm, m, km, in, ft, yd, mi, nmi`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'm';
        const units = { mm: 0.001, cm: 0.01, m: 1, meter: 1, meters: 1, km: 1000, in: 0.0254, inch: 0.0254, ft: 0.3048, feet: 0.3048, yd: 0.9144, mi: 1609.34, mile: 1609.34, nmi: 1852 };
        if (isNaN(val) || !units[from] || !units[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}lengthconv 1 km to m\``);
        const res = val * units[from] / units[to];
        return ctx.reply(`📏 *Length*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(6))} ${to}*`);
    }
};