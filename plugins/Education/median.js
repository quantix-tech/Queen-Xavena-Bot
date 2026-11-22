import { getPrefix } from '../../lib/config.js';
export default {
    command: 'median',
    aliases: ['mid'],
    description: 'Find the median - the middle value of a sorted list of numbers',
    category: 'Education',
    usage: 'median <n1> <n2> <n3> ...',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const nums = args.join(' ').split(/[, ]+/).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
        if (nums.length < 1) return ctx.reply(`📊 *Median*\n\nUsage: \`${prefix}median 10 20 30\``);
        const mid = Math.floor(nums.length / 2);
        const median = nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
        return ctx.reply(`📊 *Median*\n\nSorted: ${nums.join(', ')}\nMedian = *${median}*`);
    }
};