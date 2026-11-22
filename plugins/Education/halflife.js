import { getPrefix } from '../../lib/config.js';
export default {
    command: 'halflife',
    aliases: ['half'],
    description: 'Calculate remaining amount after radioactive decay using half-life formula',
    category: 'Education',
    usage: 'halflife <initial> <halfLife> <time> | halflife time <initial> <final> <halfLife>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toLowerCase() === 'time') {
            const [initial, final, hl] = args.slice(1).map(Number);
            if (isNaN(initial) || isNaN(final) || isNaN(hl) || final <= 0 || initial <= 0) return ctx.reply(`❌ Usage: \`${prefix}halflife time 100 25 10\``);
            const t = hl * Math.log2(initial / final);
            return ctx.reply(`☢️ *Half-Life*\n\nTime to decay from ${initial} to ${final} = *${parseFloat(t.toFixed(4))} units*`);
        }
        const [initial, hl, t] = args.map(Number);
        if (isNaN(initial) || isNaN(hl) || isNaN(t) || hl === 0) return ctx.reply(`☢️ *Half-Life*\n\nUsage: \`${prefix}halflife 100 10 30\`\n100g, half-life 10, after 30 time units`);
        const remaining = initial * Math.pow(0.5, t / hl);
        return ctx.reply(`☢️ *Half-Life*\n\nInitial: ${initial}\nHalf-life: ${hl}\nAfter ${t} units\nRemaining = *${parseFloat(remaining.toFixed(4))}* (${parseFloat((remaining / initial * 100).toFixed(2))}%)`);
    }
};