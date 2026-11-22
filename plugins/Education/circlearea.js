import { getPrefix } from '../../lib/config.js';
export default {
    command: 'circlearea',
    aliases: ['circle'],
    description: 'Calculate the area of a circle from its radius using A = πr²',
    category: 'Education',
    usage: 'circlearea <radius>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const r = parseFloat(args[0]);
        if (isNaN(r) || r < 0) return ctx.reply(`⭕ *Circle Area*\n\nUsage: \`${prefix}circlearea 7\``);
        const area = Math.PI * r * r;
        return ctx.reply(`⭕ *Circle Area*\n\nRadius: ${r}\nFormula: πr²\nArea = *${parseFloat(area.toFixed(4))}*`);
    }
};