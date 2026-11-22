import { getPrefix } from '../../lib/config.js';
export default {
    command: 'trapezoidarea',
    aliases: ['trapezoid'],
    description: 'Calculate the area of a trapezoid from its two parallel sides and height',
    category: 'Education',
    usage: 'trapezoidarea <a> <b> <height>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [a, b, h] = args.map(Number);
        if (isNaN(a) || isNaN(b) || isNaN(h)) return ctx.reply(`📐 *Trapezoid Area*\n\nUsage: \`${prefix}trapezoidarea 10 6 4\`\nFormula: ½ × (a + b) × height`);
        const area = 0.5 * (a + b) * h;
        return ctx.reply(`📐 *Trapezoid Area*\n\nParallel sides: ${a}, ${b}\nHeight: ${h}\nArea = *${parseFloat(area.toFixed(4))}*`);
    }
};