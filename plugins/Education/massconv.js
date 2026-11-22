import { getPrefix } from '../../lib/config.js';
export default {
    command: 'massconv',
    aliases: ['weightconv'],
    description: 'Convert mass and weight between mg, g, kg, tonnes, ounces, pounds and stones',
    category: 'Education',
    usage: 'massconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`⚖️ *Mass Converter*\n\nUsage: \`${prefix}massconv 1 kg to g\`\nUnits: mg, g, kg, t, oz, lb, st`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'g';
        const u = { mg: 0.001, g: 1, gram: 1, kg: 1000, t: 1000000, tonne: 1000000, oz: 28.3495, lb: 453.592, lbs: 453.592, st: 6350.29 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}massconv 1 kg to g\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`⚖️ *Mass*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(6))} ${to}*`);
    }
};