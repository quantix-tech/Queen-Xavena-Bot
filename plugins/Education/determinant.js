import { getPrefix } from '../../lib/config.js';
export default {
    command: 'determinant',
    aliases: ['det'],
    description: 'Calculate the determinant of a 2x2 or 3x3 matrix for linear algebra',
    category: 'Education',
    usage: 'determinant <a> <b> <c> <d> | determinant 3x3 <9 numbers>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const nums = args.map(Number).filter(n => !isNaN(n));
        if (nums.length === 4) {
            const [a, b, c, d] = nums;
            const det = a * d - b * c;
            return ctx.reply(`🔢 *Determinant (2x2)*\n\n| ${a} ${b} |\n| ${c} ${d} |\ndet = ${a}×${d} - ${b}×${c} = *${det}*`);
        }
        if (nums.length === 9) {
            const [a, b, c, d, e, f, g, h, i] = nums;
            const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
            return ctx.reply(`🔢 *Determinant (3x3)*\n\ndet = *${parseFloat(det.toFixed(4))}*`);
        }
        return ctx.reply(`🔢 *Determinant*\n\nUsage: \`${prefix}determinant 1 2 3 4\` - 2x2\nUsage: \`${prefix}determinant 1 2 3 4 5 6 7 8 9\` - 3x3`);
    }
};