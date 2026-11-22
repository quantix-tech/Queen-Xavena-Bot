import { getPrefix } from '../../lib/config.js';
export default {
    command: 'powercalc',
    aliases: ['powercalc'],
    description: 'Calculate power P = W/t or P = F × v from work, time, force and velocity',
    category: 'Education',
    usage: 'powercalc <work> <time> | powercalc F <force> <velocity>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toUpperCase() === 'F') {
            const [F, v] = args.slice(1).map(Number);
            if (isNaN(F) || isNaN(v)) return ctx.reply(`❌ Usage: \`${prefix}powercalc F 100 5\``);
            return ctx.reply(`🔌 *Power*\n\nP = F × v\nP = ${F} × ${v} = *${F * v} W*`);
        }
        const [W, t] = args.map(Number);
        if (isNaN(W) || isNaN(t) || t === 0) return ctx.reply(`🔌 *Power*\n\nUsage: \`${prefix}powercalc 1000 10\`\nFormula: P = Work / Time`);
        return ctx.reply(`🔌 *Power*\n\nP = W / t\nP = ${W} / ${t} = *${parseFloat((W / t).toFixed(4))} W*`);
    }
};