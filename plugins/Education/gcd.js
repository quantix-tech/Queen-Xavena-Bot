import { getPrefix } from '../../lib/config.js';
export default {
    command: 'gcd',
    description: 'Find the greatest common divisor - the largest number that divides both numbers',
    category: 'Education',
    usage: 'gcd <a> <b>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let [a, b] = args.map(Number);
        if (isNaN(a) || isNaN(b)) return ctx.reply(`❌ Usage: \`${prefix}gcd 12 18\``);
        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        return ctx.reply(`🔢 *GCD*\n\nGCD(${a}, ${b}) = *${gcd(Math.abs(a), Math.abs(b))}*`);
    }
};