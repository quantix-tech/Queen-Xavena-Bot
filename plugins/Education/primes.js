import { getPrefix } from '../../lib/config.js';
export default {
    command: 'primes',
    description: 'List all prime numbers up to a given number for number theory practice',
    category: 'Education',
    usage: 'primes <n>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 2 || n > 1000) return ctx.reply(`❌ Usage: \`${prefix}primes 50\` (2-1000)`);
        let out = [];
        for (let i = 2; i <= n; i++) {
            let p = true;
            for (let j = 2; j <= Math.sqrt(i); j++) if (i % j === 0) { p = false; break; }
            if (p) out.push(i);
        }
        return ctx.reply(`🔢 *Primes up to ${n} (${out.length})*\n\n${out.join(', ')}`);
    }
};