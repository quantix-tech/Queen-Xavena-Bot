import { getPrefix } from '../../lib/config.js';
export default {
    command: 'cuberoot',
    aliases: ['cbrt'],
    description: 'Find the cube root of a number - the value that cubed gives the original number',
    category: 'Education',
    usage: 'cuberoot <n>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseFloat(args[0]);
        if (isNaN(n)) return ctx.reply(`❌ Usage: \`${prefix}cuberoot 27\``);
        return ctx.reply(`🔢 *∛${n}* = *${parseFloat(Math.cbrt(n).toFixed(6))}*`);
    }
};