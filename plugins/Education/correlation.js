import { getPrefix } from '../../lib/config.js';
export default {
    command: 'correlation',
    aliases: ['corr'],
    description: 'Calculate Pearson correlation coefficient between two lists of numbers (-1 to +1)',
    category: 'Education',
    usage: 'correlation <x1,x2..> | <y1,y2..>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input.includes('|')) return ctx.reply(`📊 *Correlation*\n\nUsage: \`${prefix}correlation 1,2,3 | 2,4,6\`\nTwo lists separated by |`);
        const [xs, ys] = input.split('|').map(s => s.split(/[, ]+/).map(Number).filter(n => !isNaN(n)));
        if (xs.length !== ys.length || xs.length < 2) return ctx.reply(`❌ Both lists must have same length (min 2)`);
        const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
        const my = ys.reduce((a, b) => a + b, 0) / ys.length;
        let num = 0, dx = 0, dy = 0;
        for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
        const r = num / Math.sqrt(dx * dy);
        let strength = Math.abs(r) >= 0.8 ? 'Strong' : Math.abs(r) >= 0.5 ? 'Moderate' : Math.abs(r) >= 0.3 ? 'Weak' : 'Very Weak';
        return ctx.reply(`📊 *Correlation*\n\nr = *${parseFloat(r.toFixed(4))}*\nStrength: *${strength}* ${r > 0 ? 'Positive 📈' : r < 0 ? 'Negative 📉' : 'None'}`);
    }
};