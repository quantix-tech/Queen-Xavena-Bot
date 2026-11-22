import { getPrefix } from '../../lib/config.js';
export default {
    command: 'dilution',
    aliases: ['dilute'],
    description: 'Solve dilution problems with C1V1 = C2V2 - find final concentration or volume',
    category: 'Education',
    usage: 'dilution C2 <C1> <V1> <V2> | dilution V2 <C1> <V1> <C2> | dilution V1 <C2> <V2> <C1>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const find = args[0]?.toUpperCase();
        const [a, b, c] = args.slice(1).map(Number);
        if (!find || isNaN(a) || isNaN(b) || isNaN(c)) return ctx.reply(`🧪 *Dilution (C1V1 = C2V2)*\n\n\`${prefix}dilution C2 2 100 500\` - find final conc\n\`${prefix}dilution V2 2 100 0.4\` - find final volume\n\`${prefix}dilution V1 0.4 500 2\` - find initial volume`);
        if (find === 'C2') return ctx.reply(`🧪 *Dilution*\n\nC2 = C1V1 / V2\nC2 = ${a} × ${b} / ${c} = *${parseFloat((a * b / c).toFixed(4))} M*`);
        if (find === 'V2') { if (c === 0) return ctx.reply(`❌ C2 cannot be 0`); return ctx.reply(`🧪 *Dilution*\n\nV2 = C1V1 / C2\nV2 = ${a} × ${b} / ${c} = *${parseFloat((a * b / c).toFixed(4))} mL*`); }
        if (find === 'V1') { if (c === 0) return ctx.reply(`❌ C1 cannot be 0`); return ctx.reply(`🧪 *Dilution*\n\nV1 = C2V2 / C1\nV1 = ${a} × ${b} / ${c} = *${parseFloat((a * b / c).toFixed(4))} mL*`); }
        return ctx.reply(`❌ Use C2, V2 or V1`);
    }
};