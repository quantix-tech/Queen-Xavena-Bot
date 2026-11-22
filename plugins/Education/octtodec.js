import { getPrefix } from '../../lib/config.js';
export default {
    command: 'octtodec',
    aliases: ['oct2dec'],
    description: 'Convert an octal number (base 8) to decimal (base 10)',
    category: 'Education',
    usage: 'octtodec <octal>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const oct = args[0];
        if (!oct || !/^[0-7]+$/.test(oct)) return ctx.reply(`💻 *Octal to Decimal*\n\nUsage: \`${prefix}octtodec 100\``);
        return ctx.reply(`💻 *Octal to Decimal*\n\nOctal: ${oct}\nDecimal = *${parseInt(oct, 8)}*`);
    }
};