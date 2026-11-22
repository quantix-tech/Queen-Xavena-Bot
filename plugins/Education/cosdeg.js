import { getPrefix } from '../../lib/config.js';
export default {
    command: 'cosdeg',
    aliases: ['cos'],
    description: 'Calculate cosine of an angle in degrees for trigonometry and triangles',
    category: 'Education',
    usage: 'cosdeg <angle>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const deg = parseFloat(args[0]);
        if (isNaN(deg)) return ctx.reply(`📐 *Cosine (Degrees)*\n\nUsage: \`${prefix}cosdeg 60\`\nExample: cos(60°) = 0.5`);
        const rad = deg * Math.PI / 180;
        const result = Math.cos(rad);
        return ctx.reply(`📐 *Cosine*\n\ncos(${deg}°) = *${parseFloat(result.toFixed(6))}*`);
    }
};