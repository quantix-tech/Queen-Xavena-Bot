import { getPrefix } from '../../lib/config.js';
export default {
    command: 'factorial',
    aliases: ['fact'],
    description: 'Calculate the factorial of a number (n! = 1 × 2 × 3 ... × n) for combinatorics',
    category: 'Education',
    usage: 'factorial <n>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 0) return ctx.reply(`❌ Usage: \`${prefix}factorial 5\``);
        if (n > 170) return ctx.reply(`❌ Number too large (max 170)`);
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return ctx.reply(`❗ *Factorial*\n\n*${n}!* = *${r}*`);
    }
};