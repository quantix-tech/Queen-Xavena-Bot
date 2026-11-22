import { getPrefix } from '../../lib/config.js';
export default {
    command: 'tandeg',
    aliases: ['tan'],
    description: 'Calculate tangent of an angle in degrees for trigonometry and slopes',
    category: 'Education',
    usage: 'tandeg <angle>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const deg = parseFloat(args[0]);
        if (isNaN(deg)) return ctx.reply(`📐 *Tangent (Degrees)*\n\nUsage: \`${prefix}tandeg 45\`\nExample: tan(45°) = 1`);
        if (Math.abs(deg % 180) === 90) return ctx.reply(`❌ tan(${deg}°) is undefined`);
        const rad = deg * Math.PI / 180;
        const result = Math.tan(rad);
        return ctx.reply(`📐 *Tangent*\n\ntan(${deg}°) = *${parseFloat(result.toFixed(6))}*`);
    }
};