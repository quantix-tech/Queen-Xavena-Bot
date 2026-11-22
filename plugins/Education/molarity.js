import { getPrefix } from '../../lib/config.js';
export default {
    command: 'molarity',
    aliases: ['molarconc'],
    description: 'Calculate molarity M = moles / volume in liters for solution concentration',
    category: 'Education',
    usage: 'molarity <moles> <volumeL> | molarity mass <mass> <molarMass> <volumeL>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toLowerCase() === 'mass') {
            const [mass, mm, vol] = args.slice(1).map(Number);
            if (isNaN(mass) || isNaN(mm) || isNaN(vol) || vol === 0) return ctx.reply(`❌ Usage: \`${prefix}molarity mass 58.44 58.44 1\``);
            const moles = mass / mm;
            const M = moles / vol;
            return ctx.reply(`🧪 *Molarity*\n\nMass: ${mass} g, Molar Mass: ${mm} g/mol\nMoles = ${parseFloat(moles.toFixed(4))} mol\nVolume: ${vol} L\nMolarity = *${parseFloat(M.toFixed(4))} M*`);
        }
        const [moles, vol] = args.map(Number);
        if (isNaN(moles) || isNaN(vol) || vol === 0) return ctx.reply(`🧪 *Molarity*\n\nUsage: \`${prefix}molarity 2 1\` - 2 moles in 1L\nUsage: \`${prefix}molarity mass 58.44 58.44 1\``);
        return ctx.reply(`🧪 *Molarity*\n\nM = moles / volume\nM = ${moles} / ${vol} = *${parseFloat((moles / vol).toFixed(4))} M*`);
    }
};