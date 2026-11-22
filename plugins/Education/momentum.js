import { getPrefix } from '../../lib/config.js';
export default {
    command: 'momentum',
    aliases: ['p'],
    description: 'Calculate momentum p = mv and impulse from mass, velocity, force and time',
    category: 'Education',
    usage: 'momentum <mass> <velocity> | momentum impulse <force> <time>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toLowerCase() === 'impulse') {
            const [F, t] = args.slice(1).map(Number);
            if (isNaN(F) || isNaN(t)) return ctx.reply(`❌ Usage: \`${prefix}momentum impulse 10 5\``);
            return ctx.reply(`💥 *Impulse*\n\nJ = F × t\nJ = ${F} × ${t} = *${F * t} N·s*`);
        }
        const [mass, vel] = args.map(Number);
        if (isNaN(mass) || isNaN(vel)) return ctx.reply(`💥 *Momentum*\n\nUsage: \`${prefix}momentum 10 5\`\nFormula: p = m × v`);
        return ctx.reply(`💥 *Momentum*\n\np = m × v\np = ${mass} × ${vel} = *${mass * vel} kg·m/s*`);
    }
};