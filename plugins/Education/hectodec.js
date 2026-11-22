import { getPrefix } from '../../lib/config.js';
export default {
    command: 'hextodec',
    aliases: ['hex2dec'],
    description: 'Convert a hexadecimal number (base 16) to decimal (base 10)',
    category: 'Education',
    usage: 'hextodec <hex>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const hex = args[0];
        if (!hex || !/^[0-9a-fA-F]+$/.test(hex)) return ctx.reply(`💻 *Hex to Decimal*\n\nUsage: \`${prefix}hextodec FF\``);
        return ctx.reply(`💻 *Hex to Decimal*\n\nHex: ${hex.toUpperCase()}\nDecimal = *${parseInt(hex, 16)}*`);
    }
};