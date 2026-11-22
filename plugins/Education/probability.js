import { getPrefix } from '../../lib/config.js';
export default {
    command: 'probability',
    aliases: ['prob'],
    description: 'Calculate basic probability P = favourable outcomes / total outcomes',
    category: 'Education',
    usage: 'probability <favourable> <total>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [fav, total] = args.map(Number);
        if (isNaN(fav) || isNaN(total) || total === 0) return ctx.reply(`🎲 *Probability*\n\nUsage: \`${prefix}probability 1 6\` - rolling a 6 on a die`);
        const p = fav / total;
        return ctx.reply(`🎲 *Probability*\n\nP = ${fav} / ${total} = *${parseFloat(p.toFixed(4))}*\nAs percent: *${parseFloat((p * 100).toFixed(2))}%*\nOdds against: ${(total - fav)} : ${fav}`);
    }
};