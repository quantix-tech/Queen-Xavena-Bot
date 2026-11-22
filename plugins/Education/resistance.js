import { getPrefix } from '../../lib/config.js';
export default {
    command: 'resistance',
    aliases: ['resistor'],
    description: 'Calculate total resistance for resistors in series and parallel',
    category: 'Education',
    usage: 'resistance series <r1> <r2> ... | resistance parallel <r1> <r2> ...',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const mode = args[0]?.toLowerCase();
        const vals = args.slice(1).map(Number);
        if (!mode || vals.some(isNaN) || vals.length < 2) return ctx.reply(`🔌 *Resistance*\n\n\`${prefix}resistance series 10 20 30\`\n\`${prefix}resistance parallel 10 20\``);
        if (mode === 'series') {
            const total = vals.reduce((a, b) => a + b, 0);
            return ctx.reply(`🔌 *Series Resistance*\n\nResistors: ${vals.join('Ω, ')}Ω\nTotal = *${total} Ω*`);
        }
        if (mode === 'parallel') {
            const total = 1 / vals.reduce((a, b) => a + 1 / b, 0);
            return ctx.reply(`🔌 *Parallel Resistance*\n\nResistors: ${vals.join('Ω, ')}Ω\nTotal = *${parseFloat(total.toFixed(4))} Ω*`);
        }
        return ctx.reply(`❌ Use series or parallel`);
    }
};