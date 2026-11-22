import { getPrefix } from '../../lib/config.js';
export default {
    command: 'combinations',
    aliases: ['choose', 'ncr'],
    description: 'Calculate combinations C(n,r) - ways to choose r items from n without order',
    category: 'Education',
    usage: 'combinations <n> <r>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [n, r] = args.map(Number);
        if (isNaN(n) || isNaN(r) || r > n || r < 0) return ctx.reply(`🎲 *Combinations*\n\nUsage: \`${prefix}combinations 10 3\`\nFormula: C(n,r) = n! / (r!(n-r)!)`);
        const fact = (x) => { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; };
        const res = fact(n) / (fact(r) * fact(n - r));
        return ctx.reply(`🎲 *Combinations*\n\nC(${n}, ${r}) = ${n}! / (${r}! × ${n - r}!) = *${res}*`);
    }
};