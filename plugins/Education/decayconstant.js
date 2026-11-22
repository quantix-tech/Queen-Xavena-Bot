import { getPrefix } from '../../lib/config.js';
export default {
    command: 'decayconstant',
    aliases: ['decay'],
    description: 'Calculate radioactive decay constant λ = ln(2) / half-life and activity',
    category: 'Education',
    usage: 'decayconstant <halfLife>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const hl = parseFloat(args[0]);
        if (isNaN(hl) || hl <= 0) return ctx.reply(`☢️ *Decay Constant*\n\nUsage: \`${prefix}decayconstant 10\`\nFormula: λ = ln(2) / t½`);
        const lambda = Math.LN2 / hl;
        return ctx.reply(`☢️ *Decay Constant*\n\nHalf-life: ${hl}\nλ = ln(2) / ${hl} = *${parseFloat(lambda.toFixed(6))} per unit time*\nMean lifetime = *${parseFloat((1 / lambda).toFixed(4))}*`);
    }
};