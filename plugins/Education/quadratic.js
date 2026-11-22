import { getPrefix } from '../../lib/config.js';
export default {
    command: 'quadratic',
    aliases: ['quad'],
    description: 'Solve quadratic equations ax² + bx + c = 0 using the quadratic formula',
    category: 'Education',
    usage: 'quadratic <a> <b> <c>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [a, b, c] = args.map(Number);
        if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) return ctx.reply(`📐 *Quadratic Solver*\n\nUsage: \`${prefix}quadratic 1 -5 6\`\nFor x² - 5x + 6 = 0`);
        const disc = b * b - 4 * a * c;
        if (disc < 0) {
            const real = -b / (2 * a);
            const imag = Math.sqrt(-disc) / (2 * a);
            return ctx.reply(`📐 *Quadratic*\n\n${a}x² + ${b}x + ${c} = 0\nDiscriminant = ${disc} (negative)\nComplex roots:\nx₁ = *${parseFloat(real.toFixed(4))} + ${parseFloat(imag.toFixed(4))}i*\nx₂ = *${parseFloat(real.toFixed(4))} - ${parseFloat(imag.toFixed(4))}i*`);
        }
        const x1 = (-b + Math.sqrt(disc)) / (2 * a);
        const x2 = (-b - Math.sqrt(disc)) / (2 * a);
        return ctx.reply(`📐 *Quadratic*\n\n${a}x² + ${b}x + ${c} = 0\nDiscriminant = *${disc}*\nx₁ = *${parseFloat(x1.toFixed(4))}*\nx₂ = *${parseFloat(x2.toFixed(4))}*`);
    }
};