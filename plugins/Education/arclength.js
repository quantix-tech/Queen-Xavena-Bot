import { getPrefix } from '../../lib/config.js';
export default {
    command: 'arclength',
    aliases: ['arc'],
    description: 'Calculate arc length of a circle from radius and central angle in degrees',
    category: 'Education',
    usage: 'arclength <radius> <angleDeg>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [r, deg] = args.map(Number);
        if (isNaN(r) || isNaN(deg)) return ctx.reply(`📐 *Arc Length*\n\nUsage: \`${prefix}arclength 10 90\`\nRadius 10, angle 90°`);
        const rad = deg * Math.PI / 180;
        const arc = r * rad;
        const sector = 0.5 * r * r * rad;
        return ctx.reply(`📐 *Arc Length*\n\nRadius: ${r}\nAngle: ${deg}°\nFormula: r × θ (radians)\nArc Length = *${parseFloat(arc.toFixed(4))}*\nSector Area = *${parseFloat(sector.toFixed(4))}*`);
    }
};