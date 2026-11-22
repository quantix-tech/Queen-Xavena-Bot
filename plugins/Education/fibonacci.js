import { getPrefix } from '../../lib/config.js';
export default {
    command: 'fibonacci',
    aliases: ['fib'],
    description: 'Generate the Fibonacci sequence where each number is the sum of the previous two',
    category: 'Education',
    usage: 'fibonacci <n>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 1 || n > 100) return ctx.reply(`❌ Usage: \`${prefix}fibonacci 10\` (1-100)`);
        let seq = [0, 1];
        for (let i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2]);
        seq = seq.slice(0, n);
        return ctx.reply(`🌀 *Fibonacci (first ${n})*\n\n${seq.join(', ')}`);
    }
};