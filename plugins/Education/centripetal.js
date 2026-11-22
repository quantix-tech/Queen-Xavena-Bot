import { getPrefix } from '../../lib/config.js';
export default {
    command: 'centripetal',
    description: 'Calculate centripetal force and acceleration for circular motion (F = mv²/r)',
    category: 'Education',
    usage: 'centripetal <mass> <velocity> <radius>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [mass, vel, r] = args.map(Number);
        if (isNaN(mass) || isNaN(vel) || isNaN(r) || r === 0) return ctx.reply(`🔄 *Centripetal Force*\n\nUsage: \`${prefix}centripetal 10 5 2\`\nFormula: F = mv²/r, a = v²/r`);
        const a = vel * vel / r;
        const F = mass * a;
        return ctx.reply(`🔄 *Centripetal*\n\nMass: ${mass} kg, Velocity: ${vel} m/s, Radius: ${r} m\nAcceleration = *${parseFloat(a.toFixed(4))} m/s²*\nForce = *${parseFloat(F.toFixed(4))} N*`);
    }
};