import { getPrefix } from '../../lib/config.js';
export default {
    command: 'confidence95',
    aliases: ['ci95', 'confidence'],
    description: 'Calculate 95% confidence interval for a mean from sample mean, SD and sample size',
    category: 'Education',
    usage: 'confidence95 <mean> <stddev> <n>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [mean, sd, n] = args.map(Number);
        if (isNaN(mean) || isNaN(sd) || isNaN(n) || n <= 0) return ctx.reply(`📊 *95% Confidence Interval*\n\nUsage: \`${prefix}confidence95 50 10 100\`\nFormula: mean ± 1.96 × (SD / √n)`);
        const se = sd / Math.sqrt(n);
        const margin = 1.96 * se;
        return ctx.reply(`📊 *95% Confidence Interval*\n\nMean: ${mean}\nMargin of error: ±*${parseFloat(margin.toFixed(4))}*\nInterval: *[${parseFloat((mean - margin).toFixed(4))}, ${parseFloat((mean + margin).toFixed(4))}]*\nWe are 95% confident the true mean lies in this range`);
    }
};