import { getPrefix } from '../../lib/config.js';
export default {
    command: 'molestograms',
    aliases: ['mol2g', 'moles'],
    description: 'Convert between moles and grams using molar mass (mass = moles × molar mass)',
    category: 'Education',
    usage: 'molestograms <moles> <molarMass> | molestograms g <grams> <molarMass>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toLowerCase() === 'g') {
            const [grams, mm] = args.slice(1).map(Number);
            if (isNaN(grams) || isNaN(mm) || mm === 0) return ctx.reply(`❌ Usage: \`${prefix}molestograms g 36 18\``);
            return ctx.reply(`🧪 *Moles from Grams*\n\nMoles = mass / molar mass\nMoles = ${grams} / ${mm} = *${parseFloat((grams / mm).toFixed(4))} mol*`);
        }
        const [moles, mm] = args.map(Number);
        if (isNaN(moles) || isNaN(mm)) return ctx.reply(`🧪 *Moles to Grams*\n\nUsage: \`${prefix}molestograms 2 18\` - 2 moles, molar mass 18\nUsage: \`${prefix}molestograms g 36 18\` - grams to moles`);
        return ctx.reply(`🧪 *Grams from Moles*\n\nMass = moles × molar mass\nMass = ${moles} × ${mm} = *${parseFloat((moles * mm).toFixed(4))} g*`);
    }
};