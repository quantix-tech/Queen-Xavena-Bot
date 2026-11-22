import { getPrefix } from '../../lib/config.js';
export default {
    command: 'percentchange',
    description: 'Calculate percent increase or decrease between an old value and a new value',
    category: 'Education',
    usage: 'percentchange <old> <new>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [oldV, newV] = args.map(Number);
        if (isNaN(oldV) || isNaN(newV) || oldV === 0) return ctx.reply(`❌ Usage: \`${prefix}percentchange 100 150\``);
        const change = (newV - oldV) / Math.abs(oldV) * 100;
        const type = change >= 0 ? 'Increase 📈' : 'Decrease 📉';
        return ctx.reply(`📊 *Percent Change*\n\nFrom ${oldV} to ${newV}\nChange: *${parseFloat(change.toFixed(2))}%* (${type})`);
    }
};