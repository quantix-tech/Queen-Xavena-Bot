import { getPrefix } from '../../lib/config.js';
export default {
    command: 'lcm',
    description: 'Find the least common multiple - the smallest number both numbers divide into',
    category: 'Education',
    usage: 'lcm <a> <b>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let [a, b] = args.map(Number);
        if (isNaN(a) || isNaN(b) || a === 0 || b === 0) return ctx.reply(`❌ Usage: \`${prefix}lcm 4 6\``);
        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        const lcm = Math.abs(a * b) / gcd(Math.abs(a), Math.abs(b));
        return ctx.reply(`🔢 *LCM*\n\nLCM(${a}, ${b}) = *${lcm}*`);
    }
};