import { getPrefix } from '../../lib/config.js';
export default {
    command: 'matrix',
    aliases: ['matrixcalc'],
    description: 'Add, subtract and multiply 2x2 matrices step by step',
    category: 'Education',
    usage: 'matrix add <a b c d> <e f g h> | matrix multiply <...> <...>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const op = args[0]?.toLowerCase();
        const nums = args.slice(1).map(Number).filter(n => !isNaN(n));
        if (!op || nums.length !== 8) return ctx.reply(`🔢 *Matrix Calculator (2x2)*\n\n\`${prefix}matrix add 1 2 3 4 5 6 7 8\`\n\`${prefix}matrix subtract 1 2 3 4 5 6 7 8\`\n\`${prefix}matrix multiply 1 2 3 4 5 6 7 8\``);
        const [a, b, c, d, e, f, g, h] = nums;
        let res;
        if (op === 'add') res = [a + e, b + f, c + g, d + h];
        else if (op === 'subtract') res = [a - e, b - f, c - g, d - h];
        else if (op === 'multiply') res = [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h];
        else return ctx.reply(`❌ Use add, subtract or multiply`);
        return ctx.reply(`🔢 *Matrix ${op}*\n\nResult:\n| ${res[0]} ${res[1]} |\n| ${res[2]} ${res[3]} |`);
    }
};