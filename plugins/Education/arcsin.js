import { getPrefix } from '../../lib/config.js';
export default {
    command: 'arcsin',
    aliases: ['asin', 'sinverse'],
    description: 'Find the angle in degrees whose sine is the given value (inverse sine)',
    category: 'Education',
    usage: 'arcsin <value>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const val = parseFloat(args[0]);
        if (isNaN(val) || val < -1 || val > 1) return ctx.reply(`📐 *Arcsin*\n\nUsage: \`${prefix}arcsin 0.5\`\nValue must be between -1 and 1`);
        const deg = Math.asin(val) * 180 / Math.PI;
        return ctx.reply(`📐 *Inverse Sine*\n\narcsin(${val}) = *${parseFloat(deg.toFixed(6))}°*`);
    }
};