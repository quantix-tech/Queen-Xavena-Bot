import { getPrefix } from '../../lib/config.js';
export default {
    command: 'arccos',
    aliases: ['acos', 'cosinverse'],
    description: 'Find the angle in degrees whose cosine is the given value (inverse cosine)',
    category: 'Education',
    usage: 'arccos <value>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const val = parseFloat(args[0]);
        if (isNaN(val) || val < -1 || val > 1) return ctx.reply(`📐 *Arccos*\n\nUsage: \`${prefix}arccos 0.5\`\nValue must be between -1 and 1`);
        const deg = Math.acos(val) * 180 / Math.PI;
        return ctx.reply(`📐 *Inverse Cosine*\n\narccos(${val}) = *${parseFloat(deg.toFixed(6))}°*`);
    }
};