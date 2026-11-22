import { getPrefix } from '../../lib/config.js';
export default {
    command: 'linearsolve',
    aliases: ['linear'],
    description: 'Solve linear equations ax + b = c and 2-variable systems for x and y',
    category: 'Education',
    usage: 'linearsolve <a> <b> <c> | linearsolve system <a1> <b1> <c1> <a2> <b2> <c2>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toLowerCase() === 'system') {
            const [a1, b1, c1, a2, b2, c2] = args.slice(1).map(Number);
            if ([a1, b1, c1, a2, b2, c2].some(isNaN)) return ctx.reply(`❌ Usage: \`${prefix}linearsolve system 2 3 8 1 -1 1\``);
            const det = a1 * b2 - a2 * b1;
            if (det === 0) return ctx.reply(`❌ No unique solution (lines are parallel or same)`);
            const x = (c1 * b2 - c2 * b1) / det;
            const y = (a1 * c2 - a2 * c1) / det;
            return ctx.reply(`📐 *Linear System*\n\n${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}\nx = *${parseFloat(x.toFixed(4))}*\ny = *${parseFloat(y.toFixed(4))}*`);
        }
        const [a, b, c] = args.map(Number);
        if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) return ctx.reply(`📐 *Linear Equation*\n\nUsage: \`${prefix}linearsolve 2 3 11\` - for 2x + 3 = 11\nUsage: \`${prefix}linearsolve system 2 3 8 1 -1 1\``);
        const x = (c - b) / a;
        return ctx.reply(`📐 *Linear Equation*\n\n${a}x + ${b} = ${c}\nx = *${parseFloat(x.toFixed(4))}*`);
    }
};