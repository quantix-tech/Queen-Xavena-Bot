import { getPrefix } from '../../lib/config.js';
export default {
    command: 'ratiosimplify',
    aliases: ['simplifyratio'],
    description: 'Simplify a ratio to its lowest terms like 12:18 = 2:3',
    category: 'Education',
    usage: 'ratiosimplify <a> : <b> | ratiosimplify <a> <b>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const nums = args.join(' ').replace(/:/g, ' ').split(' ').map(Number).filter(n => !isNaN(n));
        if (nums.length !== 2) return ctx.reply(`📐 *Simplify Ratio*\n\nUsage: \`${prefix}ratiosimplify 12 18\`\nUsage: \`${prefix}ratiosimplify 12:18\``);
        const [a, b] = nums;
        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        const g = gcd(Math.abs(a), Math.abs(b));
        return ctx.reply(`📐 *Simplify Ratio*\n\n${a} : ${b} = *${a / g} : ${b / g}*`);
    }
};