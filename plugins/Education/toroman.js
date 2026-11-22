import { getPrefix } from '../../lib/config.js';
export default {
    command: 'toroman',
    aliases: ['roman'],
    description: 'Convert a normal number (1-3999) to Roman numerals like 2024 = MMXXIV',
    category: 'Education',
    usage: 'toroman <number>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 1 || n > 3999) return ctx.reply(`🏛️ *To Roman*\n\nUsage: \`${prefix}toroman 2024\` (1-3999)`);
        const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
        let num = n; let res = '';
        for (const [val, sym] of map) { while (num >= val) { res += sym; num -= val; } }
        return ctx.reply(`🏛️ *To Roman*\n\n${n} = *${res}*`);
    }
};