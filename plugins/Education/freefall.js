import { getPrefix } from '../../lib/config.js';
export default {
    command: 'freefall',
    aliases: ['fall'],
    description: 'Calculate free fall time, velocity and distance under gravity (g = 9.81 m/s²)',
    category: 'Education',
    usage: 'freefall <time> | freefall height <height> | freefall distance <height>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const g = 9.81;
        if (args[0]?.toLowerCase() === 'height' || args[0]?.toLowerCase() === 'distance') {
            const h = parseFloat(args[1]);
            if (isNaN(h) || h < 0) return ctx.reply(`❌ Usage: \`${prefix}freefall height 100\``);
            const t = Math.sqrt(2 * h / g);
            const v = g * t;
            return ctx.reply(`🪂 *Free Fall*\n\nHeight: ${h} m\nTime to fall = *${parseFloat(t.toFixed(4))} s*\nImpact velocity = *${parseFloat(v.toFixed(4))} m/s*`);
        }
        const t = parseFloat(args[0]);
        if (isNaN(t) || t < 0) return ctx.reply(`🪂 *Free Fall*\n\nUsage: \`${prefix}freefall 3\` - after 3 seconds\nUsage: \`${prefix}freefall height 100\` - from 100m`);
        const v = g * t;
        const d = 0.5 * g * t * t;
        return ctx.reply(`🪂 *Free Fall*\n\nTime: ${t} s\nVelocity = *${parseFloat(v.toFixed(4))} m/s*\nDistance fallen = *${parseFloat(d.toFixed(4))} m*`);
    }
};