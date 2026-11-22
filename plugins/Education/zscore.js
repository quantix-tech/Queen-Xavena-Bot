import { getPrefix } from '../../lib/config.js';
export default {
    command: 'zscore',
    aliases: ['z'],
    description: 'Calculate z-score - how many standard deviations a value is from the mean',
    category: 'Education',
    usage: 'zscore <value> <mean> <stddev>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [x, mean, sd] = args.map(Number);
        if (isNaN(x) || isNaN(mean) || isNaN(sd) || sd === 0) return ctx.reply(`📊 *Z-Score*\n\nUsage: \`${prefix}zscore 85 70 10\`\nFormula: z = (x - mean) / SD`);
        const z = (x - mean) / sd;
        const pos = z > 0 ? 'above' : z < 0 ? 'below' : 'at';
        return ctx.reply(`📊 *Z-Score*\n\nz = (${x} - ${mean}) / ${sd} = *${parseFloat(z.toFixed(4))}*\nValue is ${Math.abs(parseFloat(z.toFixed(2)))} SD ${pos} the mean`);
    }
};