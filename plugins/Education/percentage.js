import { getPrefix } from '../../lib/config.js';
export default {
    command: 'percentage',
    aliases: ['percent'],
    description: 'Calculate percentage of a number or what percent one number is of another',
    category: 'Education',
    usage: 'percentage <percent> of <number> | percentage <part> / <total>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`💯 *Percentage*\n\n\`${prefix}percentage 20 of 200\` = 40\n\`${prefix}percentage 40 / 200\` = 20%`);
        if (input.includes('of')) {
            const [p, n] = input.split('of').map(Number);
            if (isNaN(p) || isNaN(n)) return ctx.reply(`❌ Usage: \`${prefix}percentage 20 of 200\``);
            return ctx.reply(`💯 *${p}% of ${n}* = *${p / 100 * n}*`);
        }
        if (input.includes('/')) {
            const [a, b] = input.split('/').map(Number);
            if (isNaN(a) || isNaN(b) || b === 0) return ctx.reply(`❌ Invalid`);
            return ctx.reply(`💯 *${a} / ${b}* = *${parseFloat((a / b * 100).toFixed(4))}%*`);
        }
        return ctx.reply(`❌ Usage: \`${prefix}percentage 20 of 200\``);
    }
};