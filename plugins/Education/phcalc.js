import { getPrefix } from '../../lib/config.js';
export default {
    command: 'phcalc',
    aliases: ['ph'],
    description: 'Calculate pH, pOH and hydrogen ion concentration for acids and bases',
    category: 'Education',
    usage: 'phcalc <H+> | phcalc ph <pH> | phcalc poh <pOH>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toLowerCase() === 'ph') {
            const ph = parseFloat(args[1]);
            if (isNaN(ph) || ph < 0 || ph > 14) return ctx.reply(`❌ pH must be 0-14`);
            const h = Math.pow(10, -ph);
            const poh = 14 - ph;
            const oh = Math.pow(10, -poh);
            const type = ph < 7 ? 'Acidic 🍋' : ph > 7 ? 'Basic 🧼' : 'Neutral 💧';
            return ctx.reply(`🧪 *pH Calculator*\n\npH = *${ph}* (${type})\npOH = *${parseFloat(poh.toFixed(2))}*\n[H⁺] = *${h.toExponential(3)} M*\n[OH⁻] = *${oh.toExponential(3)} M*`);
        }
        if (args[0]?.toLowerCase() === 'poh') {
            const poh = parseFloat(args[1]);
            if (isNaN(poh) || poh < 0 || poh > 14) return ctx.reply(`❌ pOH must be 0-14`);
            const ph = 14 - poh;
            return ctx.reply(`🧪 *pH Calculator*\n\npOH = ${poh}\npH = *${parseFloat(ph.toFixed(2))}*\n[H⁺] = *${Math.pow(10, -ph).toExponential(3)} M*`);
        }
        const h = parseFloat(args[0]);
        if (isNaN(h) || h <= 0) return ctx.reply(`🧪 *pH Calculator*\n\nUsage: \`${prefix}phcalc 0.001\` - from [H⁺]\nUsage: \`${prefix}phcalc ph 3\` - from pH\nUsage: \`${prefix}phcalc poh 11\` - from pOH`);
        const ph = -Math.log10(h);
        const poh = 14 - ph;
        const type = ph < 7 ? 'Acidic 🍋' : ph > 7 ? 'Basic 🧼' : 'Neutral 💧';
        return ctx.reply(`🧪 *pH Calculator*\n\n[H⁺] = ${h} M\npH = *${parseFloat(ph.toFixed(2))}* (${type})\npOH = *${parseFloat(poh.toFixed(2))}*`);
    }
};