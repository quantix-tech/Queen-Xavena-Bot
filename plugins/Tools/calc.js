import { evaluate } from 'mathjs';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'calc',
    aliases: ['calculate', 'math'],
    description: 'Calculate a math expression',
    category: 'Tools',
    ownerOnly: false,
    usage: 'calc <expression>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const expression = args.join(' ');

        if (!expression) {
            return ctx.reply(`🧮 *Calculator*\n\nUsage: \`${prefix}calc <expression>\`\nExample: \`${prefix}calc 5 * 5 + 10\``);
        }

        try {
            // Evaluate the math expression
            const result = evaluate(expression);

            // Handle cases like "1/0" which return Infinity
            if (result === Infinity || result === -Infinity) {
                return ctx.reply('❌ *Math Error:* Cannot divide by zero.');
            }

            await ctx.reply(`🧮 *Calculator*\n\n*Input:* ${expression}\n*Result:* *${result}*`);
        } catch (err) {
            // Catch syntax errors (e.g. "5 ++ 5")
            await ctx.reply(`❌ *Syntax Error*\n\nCould not calculate: \`${expression}\`\n_Please check your math._`);
        }
    }
};