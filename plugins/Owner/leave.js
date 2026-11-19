export default {
    command: 'leave',
    description: 'Make the bot leave the current group',
    category: 'Owner',
    ownerOnly: true,
    usage: 'leave',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        await ctx.reply('👋 *Goodbye!*\n\nI have been instructed to leave this group.');
        
        // Wait 1.5 seconds to ensure the message sends before leaving
        setTimeout(async () => {
            try {
                await sock.groupLeave(m.chat);
            } catch (err) {
                console.error('Failed to leave group:', err);
            }
        }, 1500);
    }
};