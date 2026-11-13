import { getPrefix } from '../../lib/config.js';
import { buildLinkPreview } from '../../lib/linkPreview.js';

export default {
    command: 'gcstatus',
    aliases: ['groupstatus', 'statusgc'],
    description: 'Send a status update to the current group',
    category: 'Group',
    ownerOnly: true,
    usage: 'gcstatus <text> OR reply to media',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ *Error*\n\nThis command only works in groups.');
        }

        if (!args[0] && !ctx.quoted) {
            return ctx.reply(`👥 *Group Status*\n\n*Usage:*\n1. \`.gcstatus <text>\`\n2. Reply to media with \`.gcstatus\``);
        }

        const text = args.join(' ');
        const media = ctx.quoted ? await ctx.getMedia() : null;

        try {
            // Check for URL to build a preview
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = text.match(urlRegex);
            let linkPreview = null;

            if (urls && urls.length > 0) {
                linkPreview = await buildLinkPreview(urls[0]);
            }

            if (media) {
                if (media.isImage) {
                    await sock.sendMessage(m.key.remoteJid, { image: media.buffer, caption: text, groupStatus: true });
                } else if (media.isVideo) {
                    await sock.sendMessage(m.key.remoteJid, { video: media.buffer, caption: text, groupStatus: true });
                } else if (media.isAudio) {
                    await sock.sendMessage(m.key.remoteJid, { audio: media.buffer, mimetype: 'audio/mp4', ptt: true, groupStatus: true });
                } else {
                    return ctx.reply('❌ Unsupported media type.');
                }
                await ctx.reply('✅ *Status uploaded successfully!*');

            } else {
                // Send text with link preview if available
                const payload = { 
                    text: text,
                    groupStatus: true 
                };
                
                if (linkPreview) {
                    payload.linkPreview = linkPreview;
                }

                await sock.sendMessage(m.key.remoteJid, payload);
                await ctx.reply('✅ *Status uploaded successfully!*');
            }
        } catch (err) {
            console.error('GCStatus error:', err);
            await ctx.reply(`❌ *Error*\n\nFailed to send group status.\n_Error: ${err.message}_`);
        }
    }
};