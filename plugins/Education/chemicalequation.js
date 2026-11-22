import { getPrefix } from '../../lib/config.js';
export default {
    command: 'chemicalequation',
    aliases: ['chemeq'],
    description: 'Get common balanced chemical equations for combustion, photosynthesis and acids',
    category: 'Education',
    usage: 'chemicalequation <type>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const type = args.join(' ').toLowerCase();
        const eqs = {
            combustion: 'CH₄ + 2O₂ → CO₂ + 2H₂O\n(Methane combustion)',
            photosynthesis: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\n(Photosynthesis)',
            respiration: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O\n(Cellular respiration)',
            water: '2H₂ + O₂ → 2H₂O\n(Water formation)',
            rust: '4Fe + 3O₂ → 2Fe₂O₃\n(Rusting of iron)',
            acid: 'HCl + NaOH → NaCl + H₂O\n(Acid-base neutralisation)',
            ammonia: 'N₂ + 3H₂ → 2NH₃\n(Haber process)'
        };
        if (!type) return ctx.reply(`🧪 *Common Equations*\n\n\`${prefix}chemicalequation combustion\`\n\`${prefix}chemicalequation photosynthesis\`\n\`${prefix}chemicalequation respiration\`\n\`${prefix}chemicalequation water\`\n\`${prefix}chemicalequation rust\`\n\`${prefix}chemicalequation acid\`\n\`${prefix}chemicalequation ammonia\``);
        const found = eqs[type] || Object.entries(eqs).find(([k]) => k.includes(type))?.[1];
        if (!found) return ctx.reply(`❌ Unknown. Try: combustion, photosynthesis, respiration, water, rust, acid, ammonia`);
        return ctx.reply(`🧪 *Chemical Equation*\n\n${found}`);
    }
};