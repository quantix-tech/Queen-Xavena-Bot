import { getPrefix } from '../../lib/config.js';
export default {
    command: 'circumference',
    aliases: ['circum'],
    description: 'Calculate the circumference (perimeter) of a circle from its radius or diameter',
    category: 'Education',
    usage: 'circumference <radius> | circumference d <diameter>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args.length < 1) return ctx.reply(`⭕ *Circumference*\n\nUsage: \`${prefix}circumference 7\` (radius)\nUsage: \`${prefix}circumference d 14\` (diameter)`);
        let r;
        if (args[0].toLowerCase() === 'd') r = parseFloat(args[1]) / 2;
        else r = parseFloat(args[0]);
        if (isNaN(r) || r < 0) return ctx.reply(`❌ Invalid radius`);
        const c = 2 * Math.PI * r;
        return ctx.reply(`⭕ *Circumference*\n\nRadius: ${r}\nFormula: 2πr\nCircumference = *${parseFloat(c.toFixed(4))}*`);
    }
};