import { getPrefix } from '../../lib/config.js';
export default {
    command: 'arctan',
    aliases: ['atan', 'taninverse'],
    description: 'Find the angle in degrees whose tangent is the given value (inverse tangent)',
    category: 'Education',
    usage: 'arctan <value>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const val = parseFloat(args[0]);
        if (isNaN(val)) return ctx.reply(`📐 *Arctan*\n\nUsage: \`${prefix}arctan 1\`\nExample: arctan(1) = 45°`);
        const deg = Math.atan(val) * 180 / Math.PI;
        return ctx.reply(`📐 *Inverse Tangent*\n\narctan(${val}) = *${parseFloat(deg.toFixed(6))}°*`);
    }
};