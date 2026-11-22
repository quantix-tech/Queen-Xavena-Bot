import { getPrefix } from '../../lib/config.js';
export default {
    command: 'permutations',
    aliases: ['perm', 'npr'],
    description: 'Calculate permutations P(n,r) - ways to arrange r items from n where order matters',
    category: 'Education',
    usage: 'permutations <n> <r>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [n, r] = args.map(Number);
        if (isNaN(n) || isNaN(r) || r > n || r < 0) return ctx.reply(`🎲 *Permutations*\n\nUsage: \`${prefix}permutations 10 3\`\nFormula: P(n,r) = n! / (n-r)!`);
        const fact = (x) => { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; };
        const res = fact(n) / fact(n - r);
        return ctx.reply(`🎲 *Permutations*\n\nP(${n}, ${r}) = ${n}! / ${n - r}! = *${res}*`);
    }
};