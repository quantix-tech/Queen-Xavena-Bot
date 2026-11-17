import { getPrefix } from '../../lib/config.js';
import { getRealJid } from '../../lib/utils.js';

export default {
    command: 'save',
    aliases: ['savestatus', 'svt'],
    description: 'Save replied media/status to owner DM',
    category: 'Owner',
    ownerOnly: true,
    usage: 'save (reply to media/status)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted) {
            return ctx.reply(`💾 *Save Media*\n\nReply to an image, video, audio, sticker, document, or status with \`${prefix}save\`.`);
        }

        const media = await ctx.getMedia();
        if (!media) {
            return ctx.reply('❌ Failed to download the replied media.');
        }

        // Get the bot's own DM (the person who paired it)
        const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Identify where it came from
        const chatType = m.key.remoteJid === 'status@broadcast' 
            ? 'Status Update' 
            : (m.key.remoteJid.endsWith('@g.us') ? 'Group Chat' : 'Private DM');
            
        const senderName = m.pushName || 'Unknown User';
        const caption = `📥 *Saved Media*\n\n👤 *Sender:* ${senderName}\n💬 *Source:* ${chatType}`;

        try {
            // Send based on media type
            if (media.isImage) {
                await sock.sendMessage(ownerJid, { image: media.buffer, caption });
            } else if (media.isVideo) {
                await sock.sendMessage(ownerJid, { video: media.buffer, caption });
            } else if (media.isAudio) {
                await sock.sendMessage(ownerJid, { audio: media.buffer, mimetype: 'audio/mp4', ptt: false, caption });
            } else if (media.isSticker) {
                await sock.sendMessage(ownerJid, { sticker: media.buffer, caption });
            } else if (media.isDocument) {
                // Extract original filename if available
                const fileName = ctx.quoted.raw?.documentMessage?.fileName || 
                                 ctx.quoted.raw?.documentWithCaptionMessage?.message?.documentMessage?.fileName || 
                                 'document.bin';

                await sock.sendMessage(ownerJid, { 
                    document: media.buffer, 
                    mimetype: media.mimetype, 
                    fileName: fileName,
                    caption 
                });
            } else {
                return ctx.reply('❌ Unsupported media type.');
            }

            // Confirm to the user (in the current chat)
            await ctx.reply('✅ *Saved successfully!*\nThe media has been sent to the owner\'s DM.');

        } catch (err) {
            console.error('Save error:', err);
            await ctx.reply(`❌ *Error:* Failed to save the media.\n_Note: File might be too large._`);
        }
    }
};