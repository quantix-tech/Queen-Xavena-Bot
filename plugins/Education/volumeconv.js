import { getPrefix } from '../../lib/config.js';
export default {
    command: 'volumeconv',
    aliases: ['volconv'],
    description: 'Convert volume between milliliters, liters, cubic meters, gallons, quarts and cups',
    category: 'Education',
    usage: 'volumeconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`🧪 *Volume Converter*\n\nUsage: \`${prefix}volumeconv 1 l to ml\`\nUnits: ml, l, m3, cm3, gal, qt, pt, cup, floz`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'ml';
        const u = { ml: 1, l: 1000, liter: 1000, litre: 1000, m3: 1000000, cm3: 1, gal: 3785.41, qt: 946.353, pt: 473.176, cup: 236.588, floz: 29.5735 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}volumeconv 1 l to ml\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`🧪 *Volume*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(6))} ${to}*`);
    }
};