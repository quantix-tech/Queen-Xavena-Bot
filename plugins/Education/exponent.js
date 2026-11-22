import { getPrefix } from '../../lib/config.js';
export default {
    command: 'exponent',
    aliases: ['pow'],
    description: 'Calculate powers and exponents - raise a base number to any power',
    category: 'Education',
    usage: 'exponent <base> <power>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [b, p] = args.map(Number);
        if (isNaN(b) || isNaN(p)) return ctx.reply(`❌ Usage: \`${prefix}exponent 2 10\``);
        return ctx.reply(`🔢 *${b}^${p}* = *${Math.pow(b, p)}*`);
    }
};