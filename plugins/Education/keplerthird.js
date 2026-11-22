import { getPrefix } from '../../lib/config.js';
export default {
    command: 'keplerthird',
    aliases: ['kepler'],
    description: 'Use Kepler\'s Third Law T² ∝ a³ to find orbital period from semi-major axis',
    category: 'Education',
    usage: 'keplerthird <semiMajorAxisAU> | keplerthird period <periodYears> | keplerthird ratio <a1> <T1> <a2>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toLowerCase() === 'ratio') {
            const [a1, T1, a2] = args.slice(1).map(Number);
            if (isNaN(a1) || isNaN(T1) || isNaN(a2)) return ctx.reply(`❌ Usage: \`${prefix}keplerthird ratio 1 1 4\``);
            const T2 = T1 * Math.sqrt(Math.pow(a2 / a1, 3));
            return ctx.reply(`🪐 *Kepler's Third Law*\n\n(T2/T1)² = (a2/a1)³\nT2 = *${parseFloat(T2.toFixed(4))} years*`);
        }
        if (args[0]?.toLowerCase() === 'period') {
            const T = parseFloat(args[1]);
            if (isNaN(T)) return ctx.reply(`❌ Usage: \`${prefix}keplerthird period 8\``);
            const a = Math.cbrt(T * T);
            return ctx.reply(`🪐 *Kepler's Third Law*\n\nPeriod: ${T} years\nSemi-major axis = *${parseFloat(a.toFixed(4))} AU*`);
        }
        const a = parseFloat(args[0]);
        if (isNaN(a) || a <= 0) return ctx.reply(`🪐 *Kepler's Third Law*\n\nUsage: \`${prefix}keplerthird 1\` - Earth = 1 AU = 1 year\nUsage: \`${prefix}keplerthird 5.2\` - Jupiter distance`);
        const T = Math.sqrt(a * a * a);
        return ctx.reply(`🪐 *Kepler's Third Law*\n\nSemi-major axis: ${a} AU\nOrbital period = *${parseFloat(T.toFixed(4))} years*`);
    }
};