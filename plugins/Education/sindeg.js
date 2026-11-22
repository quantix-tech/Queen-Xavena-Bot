import { getPrefix } from '../../lib/config.js';
export default {
    command: 'sindeg',
    aliases: ['sin'],
    description: 'Calculate sine of an angle in degrees for trigonometry and triangles',
    category: 'Education',
    usage: 'sindeg <angle>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const deg = parseFloat(args[0]);
        if (isNaN(deg)) return ctx.reply(`📐 *Sine (Degrees)*\n\nUsage: \`${prefix}sindeg 30\`\nExample: sin(30°) = 0.5`);
        const rad = deg * Math.PI / 180;
        const result = Math.sin(rad);
        return ctx.reply(`📐 *Sine*\n\nsin(${deg}°) = *${parseFloat(result.toFixed(6))}*`);
    }
};