import { getPrefix } from '../../lib/config.js';
export default {
    command: 'bintodec',
    aliases: ['bin2dec'],
    description: 'Convert a binary number (base 2) to decimal (base 10)',
    category: 'Education',
    usage: 'bintodec <binary>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const bin = args[0];
        if (!bin || !/^[01]+$/.test(bin)) return ctx.reply(`💻 *Binary to Decimal*\n\nUsage: \`${prefix}bintodec 1010\``);
        return ctx.reply(`💻 *Binary to Decimal*\n\nBinary: ${bin}\nDecimal = *${parseInt(bin, 2)}*`);
    }
};