import { getPrefix } from '../../lib/config.js';
import { extractRawId } from '../../lib/utils.js';

export default {
    command: 'del',
    description: 'Delete a message (reply to it)',
    category: 'Owner',
    ownerOnly: true,
    usage: 'del (reply to a message)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted) {
            return ctx.reply(`🗑️ *Delete Message*\n\nReply to a message you want me to delete with \`${prefix}del\`.`);
        }

        try {
            // 1. Determine if the quoted message was sent by the bot
            const botNumber = extractRawId(sock.user.id);
            const quotedSender = extractRawId(ctx.quoted.sender || ctx.quoted.key.participant);
            
            // If the sender is the bot, fromMe is true.
            const fromMe = (quotedSender === botNumber);

            // 2. Build the delete key
            const deleteKey = {
                remoteJid: m.key.remoteJid, // 👈 FIXED: Using the correct JID
                fromMe: fromMe,
                id: ctx.quoted.key.id,
                participant: ctx.quoted.key.participant // Needed for group messages
            };

            // 3. Attempt to delete
            await sock.sendMessage(m.key.remoteJid, { delete: deleteKey });

        } catch (err) {
            console.error('Delete error:', err);
            
            // Provide a clearer error message based on the actual error
            if (err.message.includes('not-authorized') || err.message.includes('forbidden')) {
                await ctx.reply('❌ *Failed to delete:* I need to be an admin to delete other people\'s messages.');
            } else {
                await ctx.reply(`❌ *Failed to delete:*\n_${err.message}_`);
            }
        }
    }
};