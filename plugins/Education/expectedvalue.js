import { getPrefix } from '../../lib/config.js';
export default {
    command: 'expectedvalue',
    aliases: ['ev'],
    description: 'Calculate expected value E(X) = sum of value × probability for a distribution',
    category: 'Education',
    usage: 'expectedvalue <v1,p1> <v2,p2> ...',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args.length < 1) return ctx.reply(`📊 *Expected Value*\n\nUsage: \`${prefix}expectedvalue 10,0.5 20,0.5\`\nFormat: value,probability`);
        let ev = 0; let totalP = 0; let parts = [];
        for (const a of args) {
            const [v, p] = a.split(',').map(Number);
            if (isNaN(v) || isNaN(p)) return ctx.reply(`❌ Invalid pair: ${a}. Use value,probability`);
            ev += v * p; totalP += p; parts.push(`${v} × ${p}`);
        }
        return ctx.reply(`📊 *Expected Value*\n\nE(X) = ${parts.join(' + ')}\nE(X) = *${parseFloat(ev.toFixed(4))}*\nTotal probability: ${parseFloat(totalP.toFixed(4))}${Math.abs(totalP - 1) > 0.001 ? ' ⚠️ (should be 1)' : ' ✅'}`);
    }
};