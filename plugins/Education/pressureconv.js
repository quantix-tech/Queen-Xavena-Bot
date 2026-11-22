import { getPrefix } from '../../lib/config.js';
export default {
    command: 'pressureconv',
    aliases: ['pressure'],
    description: 'Convert pressure between pascals, bars, atmospheres, PSI and mmHg',
    category: 'Education',
    usage: 'pressureconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`🌬️ *Pressure Converter*\n\nUsage: \`${prefix}pressureconv 1 atm to pa\`\nUnits: pa, kpa, bar, atm, psi, mmhg, torr`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'pa';
        const u = { pa: 1, kpa: 1000, bar: 100000, mbar: 100, atm: 101325, psi: 6894.76, mmhg: 133.322, torr: 133.322 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}pressureconv 1 atm to pa\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`🌬️ *Pressure*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(4))} ${to}*`);
    }
};