import { getPrefix } from '../../lib/config.js';
export default {
    command: 'fromroman',
    aliases: ['roman2dec'],
    description: 'Convert Roman numerals like MMXXIV back to a normal number',
    category: 'Education',
    usage: 'fromroman <roman>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const roman = args[0]?.toUpperCase();
        if (!roman || !/^[IVXLCDM]+$/.test(roman)) return ctx.reply(`🏛️ *From Roman*\n\nUsage: \`${prefix}fromroman MMXXIV\``);
        const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
        let total = 0;
        for (let i = 0; i < roman.length; i++) {
            const cur = map[roman[i]]; const next = map[roman[i + 1]] || 0;
            if (cur < next) total -= cur; else total += cur;
        }
        return ctx.reply(`🏛️ *From Roman*\n\n${roman} = *${total}*`);
    }
};