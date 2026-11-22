import { getPrefix } from '../../lib/config.js';
export default {
    command: 'areaconv',
    aliases: ['area'],
    description: 'Convert area between square meters, hectares, acres, square feet and square inches',
    category: 'Education',
    usage: 'areaconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`🟦 *Area Converter*\n\nUsage: \`${prefix}areaconv 1 hectare to m2\`\nUnits: mm2, cm2, m2, km2, hectare, acre, ft2, in2`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'm2';
        const u = { mm2: 0.000001, cm2: 0.0001, m2: 1, km2: 1000000, hectare: 10000, ha: 10000, acre: 4046.86, ft2: 0.092903, in2: 0.00064516 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}areaconv 1 hectare to m2\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`🟦 *Area*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(6))} ${to}*`);
    }
};