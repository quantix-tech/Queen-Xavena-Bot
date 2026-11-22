import { getPrefix } from '../../lib/config.js';
import { buildLinkPreview } from '../../lib/linkPreview.js';
import { mergeStatusContextInfo, parseStatusColor, randomStatusColor } from '../../lib/status.js';

export default {
    command: 'gcstatus',
    aliases: ['groupstatus', 'statusgc'],
    description: 'Send a status update to a specific group (or current group)',
    category: 'Group',
    ownerOnly: true,
    usage: 'gcstatus <text> OR gcstatus <link/id> <text>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const isGroupChat = m.key.remoteJid.endsWith('@g.us');
        
        let targetJid = null;
        let text = args.join(' ');
        let media = null;

        // ─── 1. DETERMINE TARGET GROUP ───
        // Check if the first argument is a group invite link
        if (args[0] && (args[0].includes('chat.whatsapp.com') || args[0].includes('@g.us'))) {
            const input = args[0];
            text = args.slice(1).join(' '); // Remove the link from the text
            
            try {
                if (input.includes('chat.whatsapp.com')) {
                    // Extract invite code and get group JID
                    const code = input.split('chat.whatsapp.com/')[1].split('?')[0];
                    const groupInfo = await sock.groupGetInviteInfo(code);
                    targetJid = groupInfo.id;
                } else {
                    // It's a direct group ID
                    targetJid = input;
                }
                await ctx.reply(`🎯 *Target Group Found:* ${targetJid.split('@')[0]}`);
            } catch (err) {
                return ctx.reply(`❌ *Error:* Invalid group link or the bot is not in that group.`);
            }
        } else {
            // No link provided. If in a group, use current group. If in DM, require a link.
            if (isGroupChat) {
                targetJid = m.key.remoteJid;
            } else {
                return ctx.reply(`❌ *Group Status*\n\nFrom a DM, you must provide the group link.\nExample: \`${prefix}gcstatus https://chat.whatsapp.com/xxxxx Hello everyone!\``);
            }
        }

        // ─── 2. EXTRACT MEDIA/TEXT ───
        if (ctx.quoted) {
            media = await ctx.getMedia();
            if (!text && ctx.quoted.text) {
                text = ctx.quoted.text;
            }
        }

        if (!text && !media) {
            return ctx.reply(`👥 *Group Status*\n\n*Usage:*\n1. In a group: \`${prefix}gcstatus <text>\`\n2. From DM: \`${prefix}gcstatus <group_link> <text>\`\n\n*Optional Ring Colors:* Add \`red\`, \`blue\`, \`pink\`, \`yellow\`, \`purple\` at the end.`);
        }

        // ─── 3. PARSE COLOR ───
        let ringColorOverride = null;
        if (text) {
            const parsed = parseStatusColor(text);
            if (parsed.color) {
                text = parsed.text;
                ringColorOverride = parsed.color;
            }
        }

        try {
            // ─── 4. BUILD CONTEXT & PREVIEW ───
            const contextInfo = mergeStatusContextInfo(null, ringColorOverride);
            
            let linkPreview = null;
            if (text) {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const urls = text.match(urlRegex);
                if (urls && urls.length > 0) {
                    linkPreview = await buildLinkPreview(urls[0]);
                }
            }

            // ─── 5. SEND TO TARGET GROUP ───
            if (media) {
                if (media.isImage) {
                    await sock.sendMessage(targetJid, { image: media.buffer, caption: text, groupStatus: true, contextInfo });
                } else if (media.isVideo) {
                    await sock.sendMessage(targetJid, { video: media.buffer, caption: text, groupStatus: true, contextInfo });
                } else if (media.isAudio) {
                    await sock.sendMessage(targetJid, { audio: media.buffer, mimetype: 'audio/mp4', ptt: true, groupStatus: true, contextInfo });
                } else {
                    return ctx.reply('❌ Unsupported media type.');
                }
            } else {
                const payload = { 
                    text: text, 
                    groupStatus: true, 
                    contextInfo,
                    backgroundColor: randomStatusColor()
                };
                if (linkPreview) payload.linkPreview = linkPreview;
                await sock.sendMessage(targetJid, payload);
            }

            await ctx.reply('✅ *Status uploaded successfully!*');

        } catch (err) {
            console.error('GCStatus error:', err);
            await ctx.reply(`❌ *Error*\n\nFailed to send group status.\n_Error: ${err.message}_`);
        }
    }
};