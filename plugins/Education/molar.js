import { getPrefix } from '../../lib/config.js';
export default {
    command: 'molar',
    aliases: ['molarmass'],
    description: 'Calculate molar mass of a compound from its chemical formula like H2O or CaCO3',
    category: 'Education',
    usage: 'molar <formula>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const formula = args[0];
        if (!formula) return ctx.reply(`🧪 *Molar Mass*\n\nUsage: \`${prefix}molar H2O\`\nUsage: \`${prefix}molar CaCO3\`\nUsage: \`${prefix}molar C6H12O6\``);
        const atomic = { H: 1.008, He: 4.003, Li: 6.94, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38, Br: 79.904, Ag: 107.87, I: 126.9, Ba: 137.33, Au: 196.97, Hg: 200.59, Pb: 207.2 };
        let total = 0; let breakdown = [];
        const regex = /([A-Z][a-z]?)(\d*)/g;
        let match; let found = false;
        while ((match = regex.exec(formula)) !== null) {
            const el = match[1]; const count = parseInt(match[2]) || 1;
            if (!atomic[el]) return ctx.reply(`❌ Unknown element: ${el}`);
            found = true;
            total += atomic[el] * count;
            breakdown.push(`${el} × ${count} = ${(atomic[el] * count).toFixed(3)}`);
        }
        if (!found) return ctx.reply(`❌ Invalid formula. Example: \`${prefix}molar H2O\``);
        return ctx.reply(`🧪 *Molar Mass - ${formula}*\n\n${breakdown.join('\n')}\nTotal = *${parseFloat(total.toFixed(3))} g/mol*`);
    }
};