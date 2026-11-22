import { getPrefix } from '../../lib/config.js';
export default {
    command: 'newton',
    aliases: ['force'],
    description: 'Solve Newton\'s Second Law F = ma - find force, mass or acceleration',
    category: 'Education',
    usage: 'newton F <m> <a> | newton m <F> <a> | newton a <F> <m>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const find = args[0]?.toLowerCase();
        const [a, b] = args.slice(1).map(Number);
        if (!find || isNaN(a) || isNaN(b)) return ctx.reply(`🍎 *Newton's Second Law*\n\n\`${prefix}newton F 10 5\` - find Force\n\`${prefix}newton m 50 5\` - find Mass\n\`${prefix}newton a 50 10\` - find Acceleration`);
        if (find === 'f') return ctx.reply(`🍎 *Newton's Law*\n\nF = m × a\nF = ${a} × ${b} = *${a * b} N*`);
        if (find === 'm') { if (b === 0) return ctx.reply(`❌ Acceleration cannot be 0`); return ctx.reply(`🍎 *Newton's Law*\n\nm = F / a\nm = ${a} / ${b} = *${parseFloat((a / b).toFixed(4))} kg*`); }
        if (find === 'a') { if (b === 0) return ctx.reply(`❌ Mass cannot be 0`); return ctx.reply(`🍎 *Newton's Law*\n\na = F / m\na = ${a} / ${b} = *${parseFloat((a / b).toFixed(4))} m/s²*`); }
        return ctx.reply(`❌ Use F, m or a. Example: \`${prefix}newton F 10 5\``);
    }
};