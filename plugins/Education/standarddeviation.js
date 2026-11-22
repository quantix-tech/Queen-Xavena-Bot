import { getPrefix } from '../../lib/config.js';
export default {
    command: 'standarddeviation',
    aliases: ['stddev', 'sd'],
    description: 'Calculate standard deviation - how spread out numbers are from the mean',
    category: 'Education',
    usage: 'standarddeviation <n1> <n2> ...',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const nums = args.join(' ').split(/[, ]+/).map(Number).filter(n => !isNaN(n));
        if (nums.length < 2) return ctx.reply(`📊 *Standard Deviation*\n\nUsage: \`${prefix}standarddeviation 10 20 30 40\``);
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
        const sd = Math.sqrt(variance);
        const sampleVar = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (nums.length - 1);
        return ctx.reply(`📊 *Standard Deviation*\n\nMean: *${parseFloat(mean.toFixed(4))}*\nPopulation SD = *${parseFloat(sd.toFixed(4))}*\nSample SD = *${parseFloat(Math.sqrt(sampleVar).toFixed(4))}*\nVariance = *${parseFloat(variance.toFixed(4))}*`);
    }
};