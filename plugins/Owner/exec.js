import { exec } from 'child_process';

export default {
    command: 'exec',
    description: 'Execute terminal commands (Owner Only)',
    category: 'Owner',
    ownerOnly: true,
    usage: '.exec <command>',

    async execute(sock, m, args, ctx) {
        if (!args[0]) return ctx.reply('❌ Provide a terminal command.');

        const cmd = args.join(' ');

        exec(cmd, { timeout: 10000 }, async (error, stdout, stderr) => {
            let output = '';

            if (stdout) output += stdout;
            if (stderr) output += stderr;
            if (error) output += `\nExit Code: ${error.code}`;

            if (!output.trim()) {
                output = '✅ Command executed with no output.';
            }

            // Limit output length
            if (output.length > 3000) {
                output = output.substring(0, 3000) + '\n... (truncated)';
            }

            await ctx.reply(`💻 *Exec Result:*\n\n\`\`\`\n${output}\n\`\`\``);
        });
    }
};