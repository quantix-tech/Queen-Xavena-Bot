import { getPrefix } from '../../lib/config.js';
export default {
    command: 'dectooct',
    aliases: ['dec2oct'],
    description: 'Convert a decimal number (base 10) to octal (base 8)',
    category: 'Education',
    usage: 'dectooct <decimal>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 0) return ctx.reply(`💻 *Decimal to Octal*\n\nUsage: \`${prefix}dectooct 64\``);
        return ctx.reply(`💻 *Decimal to Octal*\n\nDecimal: ${n}\nOctal = *${n.toString(8)}*`);
    }
};