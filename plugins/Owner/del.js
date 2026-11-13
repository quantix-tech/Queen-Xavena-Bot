export default {
    command: 'del',
    description: 'Delete a message (reply to it)',
    category: 'Owner',
    ownerOnly: true,
    usage: '.del (reply to a message)',

    async execute(sock, m, args, ctx) {
        if (!ctx.quoted) {
            return ctx.reply('❌ *Delete*\n\nReply to a message you want me to delete.');
        }

        try {
            await sock.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: ctx.quoted.key.id,
                    participant: ctx.quoted.key.participant
                }
            });
        } catch (err) {
            console.error('Delete error:', err);
            await ctx.reply('❌ Failed to delete. Make sure I have admin rights (if in a group).');
        }
    }
};