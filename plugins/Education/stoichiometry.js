import { getPrefix } from '../../lib/config.js';
export default {
    command: 'stoichiometry',
    aliases: ['stoich'],
    description: 'Calculate theoretical yield and mole ratio for a simple chemical reaction',
    category: 'Education',
    usage: 'stoichiometry <molesReactant> <ratioReactant> <ratioProduct> <molarMassProduct>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [moles, rR, rP, mm] = args.map(Number);
        if (isNaN(moles) || isNaN(rR) || isNaN(rP) || isNaN(mm)) return ctx.reply(`🧪 *Stoichiometry*\n\nUsage: \`${prefix}stoichiometry 2 1 1 18\`\n2 moles reactant, 1:1 ratio, product molar mass 18\nFormula: moles product = moles reactant × (ratio product / ratio reactant)`);
        const molesProd = moles * (rP / rR);
        const massProd = molesProd * mm;
        return ctx.reply(`🧪 *Stoichiometry*\n\nReactant moles: ${moles}\nRatio: ${rR} : ${rP}\nProduct moles = *${parseFloat(molesProd.toFixed(4))} mol*\nTheoretical mass = *${parseFloat(massProd.toFixed(4))} g*`);
    }
};