import { getPrefix } from '../../lib/config.js';
import { buildLinkPreview } from '../../lib/linkPreview.js';
import { mergeStatusContextInfo, parseStatusColor, randomStatusColor } from '../../lib/status.js';

export default {
    command: 'broadcast',
    aliases: ['bc'],
    description: 'Send a group status to all groups',
    category: 'Owner',
    ownerOnly: true,
    usage: 'broadcast <message> OR reply to media',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        
        let text = args.join(' ');
        if (!text && ctx.quoted && ctx.quoted.text) {
            text = ctx.quoted.text;
        }

        const media = ctx.quoted ? await ctx.getMedia() : null;

        if (!text && !media) {
            return ctx.reply(`📢 *Broadcast Status*\n\n*Usage:*\n1. \`${prefix}broadcast <message>\`\n2. Reply to a message/media with \`${prefix}broadcast\``);
        }

        // Parse status color if provided
        let ringColorOverride = null;
        if (text) {
            const parsed = parseStatusColor(text);
            if (parsed.color) {
                text = parsed.text;
                ringColorOverride = parsed.color;
            }
        }

        await ctx.reply(`📢 *Broadcast Initiated*\nFetching groups...`);

        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);
            
            if (groupIds.length === 0) {
                return ctx.reply('❌ The bot is not in any groups.');
            }

            let linkPreview = null;
            if (text) {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const urls = text.match(urlRegex);
                if (urls && urls.length > 0) {
                    console.log(`[broadcast] Link detected, building preview silently...`);
                    linkPreview = await buildLinkPreview(urls[0]);
                }
            }

            await ctx.reply(`⏳ Uploading status to ${groupIds.length} groups...`);

            let success = 0;
            let failed = 0;

            for (const groupId of groupIds) {
                try {
                    // Build fresh context per group to cycle emojis/colors naturally
                    const contextInfo = mergeStatusContextInfo(null, ringColorOverride);
                    const randomColor = randomStatusColor();

                    if (media && media.isImage) {
                        await sock.sendMessage(groupId, { image: media.buffer, caption: text || '', groupStatus: true, contextInfo });
                    } else if (media && media.isVideo) {
                        await sock.sendMessage(groupId, { video: media.buffer, caption: text || '', groupStatus: true, contextInfo });
                    } else if (media && media.isAudio) {
                        await sock.sendMessage(groupId, { audio: media.buffer, mimetype: 'audio/mp4', ptt: true, groupStatus: true, contextInfo });
                    } else {
                        const payload = { text: text, groupStatus: true, contextInfo, backgroundColor: randomColor };
                        if (linkPreview) payload.linkPreview = linkPreview;
                        await sock.sendMessage(groupId, payload);
                    }
                    success++;
                } catch (err) {
                    failed++;
                    console.error(`Failed to broadcast status to ${groupId}:`, err.message);
                }
                await new Promise(r => setTimeout(r, 3000));
            }

            await ctx.reply(`✅ *Broadcast Status Complete!*\n\n*Success:* ${success}\n*Failed:* ${failed}`);

        } catch (err) {
            console.error('Broadcast error:', err);
            await ctx.reply(`❌ *Broadcast Failed*\n_Error: ${err.message}_`);
        }
    }
};