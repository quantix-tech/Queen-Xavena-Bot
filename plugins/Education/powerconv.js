import { getPrefix } from '../../lib/config.js';
export default {
    command: 'powerconv',
    aliases: ['power'],
    description: 'Convert power between watts, kilowatts, megawatts and horsepower',
    category: 'Education',
    usage: 'powerconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`🔌 *Power Converter*\n\nUsage: \`${prefix}powerconv 1 hp to w\`\nUnits: w, kw, mw, hp`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'w';
        const u = { w: 1, kw: 1000, mw: 1000000, hp: 745.7 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}powerconv 1 hp to w\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`🔌 *Power*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(4))} ${to}*`);
    }
};