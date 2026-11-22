import { getPrefix } from '../../lib/config.js';
export default {
    command: 'proportion',
    aliases: ['ratio'],
    description: 'Solve proportions a/b = c/d - find the missing value using cross multiplication',
    category: 'Education',
    usage: 'proportion <a> <b> <c> ? | proportion ? <b> <c> <d>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const vals = args.map(v => v === '?' || v.toLowerCase() === 'x' ? null : parseFloat(v));
        if (vals.length !== 4 || vals.filter(v => v === null).length !== 1) return ctx.reply(`📐 *Proportion*\n\nUsage: \`${prefix}proportion 2 3 4 ?\`\nSolve a/b = c/d, use ? for missing`);
        const [a, b, c, d] = vals;
        let res, label;
        if (a === null) { res = b * c / d; label = 'a'; }
        else if (b === null) { res = a * d / c; label = 'b'; }
        else if (c === null) { res = a * d / b; label = 'c'; }
        else { res = b * c / a; label = 'd'; }
        return ctx.reply(`📐 *Proportion*\n\na/b = c/d\nMissing ${label} = *${parseFloat(res.toFixed(4))}*`);
    }
};