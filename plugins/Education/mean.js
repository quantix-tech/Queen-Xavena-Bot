import { getPrefix } from '../../lib/config.js';
export default {
    command: 'mean',
    aliases: ['average'],
    description: 'Calculate the mean (average) of a list of numbers for statistics',
    category: 'Education',
    usage: 'mean <n1> <n2> <n3> ...',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const nums = args.join(' ').split(/[, ]+/).map(Number).filter(n => !isNaN(n));
        if (nums.length < 1) return ctx.reply(`📊 *Mean*\n\nUsage: \`${prefix}mean 10 20 30 40\``);
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = sum / nums.length;
        return ctx.reply(`📊 *Mean*\n\nNumbers: ${nums.join(', ')}\nCount: ${nums.length}\nSum: ${sum}\nMean = *${parseFloat(mean.toFixed(4))}*`);
    }
};