import { getPrefix } from '../../lib/config.js';
import { getGroupMetadata, isOwner } from '../../lib/utils.js';

export default {
    command: 'gcstatus',
    aliases: ['groupstatus', 'statusgc'],
    description: 'Send a status update to the current group',
    category: 'Group',
    ownerOnly: true,
    usage: 'gcstatus <text> OR reply to media',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        // Ensure it's a group chat
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ *Error*\n\nThis command only works in groups.');
        }

        // Check if text is provided OR user is replying to media
        if (!args[0] && !ctx.quoted) {
            return ctx.reply(`👥 *Group Status*\n\n*Usage:*\n1. \`${prefix}gcstatus <text>\`\n2. Reply to an image/video with \`${prefix}gcstatus\``);
        }

        try {
            // If there is a quoted message (media)
            if (ctx.quoted) {
                const media = await ctx.getMedia();
                if (!media) {
                    return ctx.reply('❌ Failed to download the replied media.');
                }

                const caption = args.join(' ') || ctx.quoted.text || '';

                if (media.isImage) {
                    await sock.sendMessage(m.key.remoteJid, {
                        image: media.buffer,
                        caption: caption,
                        groupStatus: true // 👈 Official Baileys flag
                    });
                } else if (media.isVideo) {
                    await sock.sendMessage(m.key.remoteJid, {
                        video: media.buffer,
                        caption: caption,
                        groupStatus: true // 👈 Official Baileys flag
                    });
                } else if (media.isAudio) {
                    await sock.sendMessage(m.key.remoteJid, {
                        audio: media.buffer,
                        mimetype: 'audio/mp4',
                        ptt: true,
                        groupStatus: true // 👈 Official Baileys flag
                    });
                } else {
                    return ctx.reply('❌ Unsupported media type. Please reply to an image, video, or audio.');
                }

            } else {
                // If it's just text
                const text = args.join(' ');
                await sock.sendMessage(m.key.remoteJid, {
                    text: text,
                    groupStatus: true // 👈 Official Baileys flag
                });
            }

        } catch (err) {
            console.error('GCStatus error:', err);
            await ctx.reply(`❌ *Error*\n\nFailed to send group status.\n_Error: ${err.message}_`);
        }
    }
};