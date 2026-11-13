import util from 'util';

export default {
    command: 'eval',
    description: 'Execute raw JavaScript code (Owner Only)',
    category: 'Owner',
    ownerOnly: true,
    usage: '.eval <code>',

    async execute(sock, m, args, ctx) {
        if (!args[0]) return ctx.reply('❌ Provide JavaScript code to evaluate.');
        
        const code = args.join(' ');
        let result;

        try {
            // Evaluate the code
            let evaled = await eval(`(async () => { ${code} })()`);
            
            // Format the output nicely
            if (typeof evaled !== 'string') {
                evaled = util.inspect(evaled, { depth: 1 });
            }

            // Handle if the code returns undefined
            if (evaled === 'undefined') evaled = '✅ Executed successfully (no output)';

            // Limit output length so WhatsApp doesn't crash
            if (evaled.length > 3000) {
                evaled = evaled.substring(0, 3000) + '\n... (truncated)';
            }

            await ctx.reply(`💻 *Eval Result:*\n\n\`\`\`\n${evaled}\n\`\`\``);
        } catch (err) {
            // Catch errors and send them back to WhatsApp
            await ctx.reply(`❌ *Error:*\n\`\`\`\n${err.message}\n\`\`\``);
        }
    }
};