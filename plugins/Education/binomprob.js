import { getPrefix } from '../../lib/config.js';
export default {
    command: 'binomprob',
    aliases: ['binomial'],
    description: 'Calculate binomial probability P(X=k) for n trials with success probability p',
    category: 'Education',
    usage: 'binomprob <n> <k> <p>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [n, k, p] = args.map(Number);
        if (isNaN(n) || isNaN(k) || isNaN(p) || k > n || p < 0 || p > 1) return ctx.reply(`🎲 *Binomial Probability*\n\nUsage: \`${prefix}binomprob 10 3 0.5\`\nFormula: C(n,k) × p^k × (1-p)^(n-k)`);
        const fact = (x) => { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; };
        const comb = fact(n) / (fact(k) * fact(n - k));
        const prob = comb * Math.pow(p, k) * Math.pow(1 - p, n - k);
        return ctx.reply(`🎲 *Binomial Probability*\n\nn=${n}, k=${k}, p=${p}\nP(X=${k}) = C(${n},${k}) × ${p}^${k} × ${(1 - p).toFixed(2)}^${n - k}\n= *${parseFloat(prob.toFixed(6))}* (${parseFloat((prob * 100).toFixed(4))}%)`);
    }
};