import { buildLinkPreview, getChannelContext, getRandomStatusColor } from '../../lib/linkPreview.js';

export default {
    command: 'gcstatus',
    aliases: ['groupstatus', 'statusgc'],
    description: 'Send a status update to the current group',
    category: 'Group',
    ownerOnly: true,
    usage: 'gcstatus <text> OR reply to a message',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ *Error*\n\nThis command only works in groups.');
        }

        if (!args[0] && !ctx.quoted) {
            return ctx.reply(`👥 *Group Status*\n\n*Usage:*\n1. \`.gcstatus <text>\`\n2. Reply to a message/media with \`.gcstatus\``);
        }

        try {
            const contextInfo = getChannelContext();

            if (ctx.quoted) {
                const media = await ctx.getMedia();
                
                if (media) {
                    const caption = args.join(' ') || ctx.quoted.text || '';
                    if (media.isImage) {
                        await sock.sendMessage(m.key.remoteJid, { image: media.buffer, caption, groupStatus: true, contextInfo });
                    } else if (media.isVideo) {
                        await sock.sendMessage(m.key.remoteJid, { video: media.buffer, caption, groupStatus: true, contextInfo });
                    } else if (media.isAudio) {
                        await sock.sendMessage(m.key.remoteJid, { audio: media.buffer, mimetype: 'audio/mp4', ptt: true, groupStatus: true, contextInfo });
                    } else {
                        return ctx.reply('❌ Unsupported media type.');
                    }
                    return ctx.reply('✅ *Status uploaded successfully!*');
                }

                const quotedText = args.join(' ') || ctx.quoted.text || '';
                if (!quotedText) return ctx.reply('❌ The replied message has no text to upload.');

                const urls = quotedText.match(/(https?:\/\/[^\s]+)/g);
                const linkPreview = urls ? await buildLinkPreview(urls[0]) : null;

                const payload = { 
                    text: quotedText, 
                    groupStatus: true, 
                    contextInfo,
                    backgroundColor: getRandomStatusColor() 
                };
                if (linkPreview) payload.linkPreview = linkPreview;

                await sock.sendMessage(m.key.remoteJid, payload);
                return ctx.reply('✅ *Status uploaded successfully!*');
            }

            const text = args.join(' ');
            const urls = text.match(/(https?:\/\/[^\s]+)/g);
            const linkPreview = urls ? await buildLinkPreview(urls[0]) : null;

            const payload = { 
                text: text, 
                groupStatus: true, 
                contextInfo,
                backgroundColor: getRandomStatusColor()
            };
            if (linkPreview) payload.linkPreview = linkPreview;

            await sock.sendMessage(m.key.remoteJid, payload);
            await ctx.reply('✅ *Status uploaded successfully!*');

        } catch (err) {
            console.error('GCStatus error:', err);
            await ctx.reply(`❌ *Error*\n\nFailed to send group status.\n_Error: ${err.message}_`);
        }
    }
};