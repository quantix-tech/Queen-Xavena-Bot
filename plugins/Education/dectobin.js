import { getPrefix } from '../../lib/config.js';
export default {
    command: 'dectobin',
    aliases: ['dec2bin'],
    description: 'Convert a decimal number (base 10) to binary (base 2)',
    category: 'Education',
    usage: 'dectobin <decimal>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 0) return ctx.reply(`💻 *Decimal to Binary*\n\nUsage: \`${prefix}dectobin 10\``);
        return ctx.reply(`💻 *Decimal to Binary*\n\nDecimal: ${n}\nBinary = *${n.toString(2)}*`);
    }
};