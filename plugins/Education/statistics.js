import { getPrefix } from '../../lib/config.js';
export default {
    command: 'statistics',
    aliases: ['stats'],
    description: 'Full statistics summary - mean, median, mode, range, variance and standard deviation',
    category: 'Education',
    usage: 'statistics <n1> <n2> ...',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const nums = args.join(' ').split(/[, ]+/).map(Number).filter(n => !isNaN(n));
        if (nums.length < 2) return ctx.reply(`📊 *Statistics*\n\nUsage: \`${prefix}statistics 10 20 30 40 20\``);
        const sorted = [...nums].sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = sum / nums.length;
        const mid = Math.floor(nums.length / 2);
        const median = nums.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        const freq = {}; nums.forEach(n => freq[n] = (freq[n] || 0) + 1);
        const maxF = Math.max(...Object.values(freq));
        const mode = Object.keys(freq).filter(k => freq[k] === maxF).join(', ');
        const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
        return ctx.reply(`📊 *Statistics Summary*\n\nCount: ${nums.length}\nSum: ${sum}\nMean: *${parseFloat(mean.toFixed(4))}*\nMedian: *${median}*\nMode: *${mode}*\nMin: ${sorted[0]}, Max: ${sorted[sorted.length - 1]}\nRange: *${sorted[sorted.length - 1] - sorted[0]}*\nVariance: *${parseFloat(variance.toFixed(4))}*\nStd Dev: *${parseFloat(Math.sqrt(variance).toFixed(4))}*`);
    }
};