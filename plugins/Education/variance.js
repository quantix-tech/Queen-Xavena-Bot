import { getPrefix } from '../../lib/config.js';
export default {
    command: 'variance',
    aliases: ['var'],
    description: 'Calculate variance - the average squared distance of numbers from the mean',
    category: 'Education',
    usage: 'variance <n1> <n2> ...',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const nums = args.join(' ').split(/[, ]+/).map(Number).filter(n => !isNaN(n));
        if (nums.length < 2) return ctx.reply(`📊 *Variance*\n\nUsage: \`${prefix}variance 10 20 30\``);
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const pop = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
        const sample = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (nums.length - 1);
        return ctx.reply(`📊 *Variance*\n\nMean: *${parseFloat(mean.toFixed(4))}*\nPopulation Variance = *${parseFloat(pop.toFixed(4))}*\nSample Variance = *${parseFloat(sample.toFixed(4))}*`);
    }
};