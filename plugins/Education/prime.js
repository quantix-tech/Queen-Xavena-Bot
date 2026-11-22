import { getPrefix } from '../../lib/config.js';
export default {
    command: 'prime',
    description: 'Check if a number is prime - divisible only by 1 and itself',
    category: 'Education',
    usage: 'prime <n>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseInt(args[0]);
        if (isNaN(n)) return ctx.reply(`❌ Usage: \`${prefix}prime 17\``);
        if (n < 2) return ctx.reply(`🔢 *${n}* is NOT prime`);
        for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return ctx.reply(`🔢 *${n}* is NOT prime (divisible by ${i})`);
        return ctx.reply(`🔢 *${n}* IS prime ✅`);
    }
};