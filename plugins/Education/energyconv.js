import { getPrefix } from '../../lib/config.js';
export default {
    command: 'energyconv',
    aliases: ['energy'],
    description: 'Convert energy between joules, calories, kilocalories, kWh, BTU and electronvolts',
    category: 'Education',
    usage: 'energyconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`⚡ *Energy Converter*\n\nUsage: \`${prefix}energyconv 1 kcal to j\`\nUnits: j, kj, cal, kcal, kwh, ev, btu`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'j';
        const u = { j: 1, kj: 1000, cal: 4.184, kcal: 4184, kwh: 3600000, wh: 3600, ev: 1.602e-19, btu: 1055.06 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}energyconv 1 kcal to j\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`⚡ *Energy*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(6))} ${to}*`);
    }
};