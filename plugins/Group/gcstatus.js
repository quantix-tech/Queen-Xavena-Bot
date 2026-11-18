import { getPrefix } from '../../lib/config.js';
import { buildLinkPreview } from '../../lib/linkPreview.js';
import { mergeStatusContextInfo, parseStatusColor, randomStatusColor } from '../../lib/status.js';

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

        // 1. Extract text
        let text = args.join(' ');
        if (!text && ctx.quoted && ctx.quoted.text) {
            text = ctx.quoted.text;
        }

        const media = ctx.quoted ? await ctx.getMedia() : null;

        if (!text && !media) {
            return ctx.reply(`👥 *Group Status*\n\n*Usage:*\n1. \`.gcstatus <text>\`\n2. Reply to a message/media with \`.gcstatus\`\n\n*Optional Ring Colors:*\nAdd \`red\`, \`blue\`, \`pink\`, \`yellow\`, \`purple\` at the end.`);
        }

        // 2. Parse status color if provided (e.g., "Hello world blue")
        let ringColorOverride = null;
        if (text) {
            const parsed = parseStatusColor(text);
            if (parsed.color) {
                text = parsed.text;
                ringColorOverride = parsed.color;
            }
        }

        try {
            // 3. Build Context Info with Ring & Channel
            const contextInfo = mergeStatusContextInfo(null, ringColorOverride);
            
            // 4. Check for link preview
            let linkPreview = null;
            if (text) {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const urls = text.match(urlRegex);
                if (urls && urls.length > 0) {
                    linkPreview = await buildLinkPreview(urls[0]);
                }
            }

            if (media) {
                if (media.isImage) {
                    await sock.sendMessage(m.key.remoteJid, { image: media.buffer, caption: text, groupStatus: true, contextInfo });
                } else if (media.isVideo) {
                    await sock.sendMessage(m.key.remoteJid, { video: media.buffer, caption: text, groupStatus: true, contextInfo });
                } else if (media.isAudio) {
                    await sock.sendMessage(m.key.remoteJid, { audio: media.buffer, mimetype: 'audio/mp4', ptt: true, groupStatus: true, contextInfo });
                } else {
                    return ctx.reply('❌ Unsupported media type.');
                }
                return ctx.reply('✅ *Status uploaded successfully!*');
            } else {
                const payload = { 
                    text: text, 
                    groupStatus: true, 
                    contextInfo,
                    backgroundColor: randomStatusColor()
                };
                if (linkPreview) payload.linkPreview = linkPreview;
                await sock.sendMessage(m.key.remoteJid, payload);
                return ctx.reply('✅ *Status uploaded successfully!*');
            }
        } catch (err) {
            console.error('GCStatus error:', err);
            await ctx.reply(`❌ *Error*\n\nFailed to send group status.\n_Error: ${err.message}_`);
        }
    }
};