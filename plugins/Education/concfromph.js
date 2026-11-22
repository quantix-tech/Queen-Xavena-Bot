import { getPrefix } from '../../lib/config.js';
export default {
    command: 'concfromph',
    aliases: ['phconc'],
    description: 'Convert pH to hydrogen ion concentration [H⁺] and hydroxide [OH⁻] in mol/L',
    category: 'Education',
    usage: 'concfromph <pH>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const ph = parseFloat(args[0]);
        if (isNaN(ph) || ph < 0 || ph > 14) return ctx.reply(`🧪 *Concentration from pH*\n\nUsage: \`${prefix}concfromph 3\``);
        const h = Math.pow(10, -ph);
        const poh = 14 - ph;
        const oh = Math.pow(10, -poh);
        return ctx.reply(`🧪 *Concentration from pH*\n\npH = ${ph}\n[H⁺] = *${h.toExponential(4)} mol/L*\npOH = ${parseFloat(poh.toFixed(2))}\n[OH⁻] = *${oh.toExponential(4)} mol/L*`);
    }
};