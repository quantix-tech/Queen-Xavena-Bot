import { getPrefix } from '../../lib/config.js';
export default {
    command: 'chemistrybalance',
    aliases: ['balance'],
    description: 'Check if a chemical equation is balanced by counting atoms on each side',
    category: 'Education',
    usage: 'chemistrybalance <equation>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const eq = args.join(' ');
        if (!eq || !eq.includes('->') && !eq.includes('=')) return ctx.reply(`🧪 *Balance Checker*\n\nUsage: \`${prefix}chemistrybalance H2 + O2 -> H2O\`\nIt counts atoms on both sides to show if balanced`);
        const [left, right] = eq.split(/->|=/);
        const count = (side) => {
            const map = {};
            const regex = /([A-Z][a-z]?)(\d*)/g;
            let m;
            while ((m = regex.exec(side)) !== null) {
                const el = m[1]; const n = parseInt(m[2]) || 1;
                if (['H', 'O', 'C', 'N', 'Na', 'Cl', 'Ca', 'Fe', 'S', 'K', 'Mg'].includes(el)) map[el] = (map[el] || 0) + n;
            }
            return map;
        };
        const l = count(left); const r = count(right);
        const fmt = (o) => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none';
        const balanced = JSON.stringify(l) === JSON.stringify(r);
        return ctx.reply(`🧪 *Balance Checker*\n\nEquation: ${eq}\nLeft: ${fmt(l)}\nRight: ${fmt(r)}\nResult: ${balanced ? '*BALANCED ✅*' : '*NOT BALANCED ❌ - coefficients needed*'}`);
    }
};