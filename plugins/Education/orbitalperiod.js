import { getPrefix } from '../../lib/config.js';
export default {
    command: 'orbitalperiod',
    aliases: ['orbit'],
    description: 'Calculate orbital period of a satellite using Kepler\'s Third Law T = 2π√(r³/GM)',
    category: 'Education',
    usage: 'orbitalperiod <radius> <centralMass>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const r = parseFloat(args[0]);
        const M = parseFloat(args[1]);
        if (isNaN(r) || isNaN(M)) return ctx.reply(`🛰️ *Orbital Period*\n\nUsage: \`${prefix}orbitalperiod 6771000 5.972e24\`\nFor ISS around Earth (radius + altitude)`);
        const G = 6.674e-11;
        const T = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / (G * M));
        const v = 2 * Math.PI * r / T;
        return ctx.reply(`🛰️ *Orbital Period*\n\nOrbit radius: ${r} m\nPeriod = *${parseFloat((T / 60).toFixed(2))} min* (${parseFloat(T.toFixed(0))} s)\nOrbital speed = *${parseFloat(v.toFixed(0))} m/s*`);
    }
};