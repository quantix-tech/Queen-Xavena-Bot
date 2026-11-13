import { getSudos, getPrefix } from '../../lib/config.js';

export default {
    command: 'listsudo',
    description: 'Show all sudo users',
    category: 'Owner',
    ownerOnly: true,
    usage: '.listsudo',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const sudos = getSudos();

        if (sudos.length === 0) {
            return ctx.reply(`📭 *Sudo List*\n\nNo sudo users found.\n\nUse \`${prefix}addsudo @user\` to add one.`);
        }

        let text = `🛡️ *Sudo Users* (${sudos.length})\n\n`;
        sudos.forEach((num, i) => {
            text += `${i + 1}. +${num}\n`;
        });

        await ctx.reply(text);
    }
};