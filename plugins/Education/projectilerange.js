import { getPrefix } from '../../lib/config.js';
export default {
    command: 'projectilerange',
    aliases: ['projectile'],
    description: 'Calculate projectile range, max height and flight time from launch speed and angle',
    category: 'Education',
    usage: 'projectilerange <velocity> <angleDeg>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const v = parseFloat(args[0]);
        const angle = parseFloat(args[1]);
        if (isNaN(v) || isNaN(angle)) return ctx.reply(`🎯 *Projectile Motion*\n\nUsage: \`${prefix}projectilerange 20 45\`\nVelocity 20 m/s at 45°`);
        const g = 9.81;
        const rad = angle * Math.PI / 180;
        const range = v * v * Math.sin(2 * rad) / g;
        const maxH = v * v * Math.sin(rad) * Math.sin(rad) / (2 * g);
        const time = 2 * v * Math.sin(rad) / g;
        return ctx.reply(`🎯 *Projectile Motion*\n\nVelocity: ${v} m/s, Angle: ${angle}°\nRange = *${parseFloat(range.toFixed(2))} m*\nMax Height = *${parseFloat(maxH.toFixed(2))} m*\nFlight Time = *${parseFloat(time.toFixed(2))} s*`);
    }
};