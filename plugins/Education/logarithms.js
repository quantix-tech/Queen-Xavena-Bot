import { getPrefix } from '../../lib/config.js';
export default {
    command: 'logarithm',
    aliases: ['log'],
    description: 'Calculate logarithms in any base plus natural log (ln) for exponential problems',
    category: 'Education',
    usage: 'logarithm <value> [base]',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const val = parseFloat(args[0]);
        const base = parseFloat(args[1]) || 10;
        if (isNaN(val) || val <= 0) return ctx.reply(`❌ Usage: \`${prefix}logarithm 100 10\``);
        const res = Math.log(val) / Math.log(base);
        const ln = Math.log(val);
        return ctx.reply(`🔢 *Logarithm*\n\nlog_${base}(${val}) = *${parseFloat(res.toFixed(6))}*\nln(${val}) = *${parseFloat(ln.toFixed(6))}*`);
    }
};