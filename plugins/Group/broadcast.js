import { getPrefix } from '../../lib/config.js';
import { buildLinkPreview, getChannelContext, getRandomStatusColor } from '../../lib/linkPreview.js';

export default {
    command: 'broadcast',
    aliases: ['bc'],
    description: 'Send a group status to all groups',
    category: 'Owner',
    ownerOnly: true,
    usage: 'broadcast <message> OR reply to a message/media',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        
        // 1. Extract Text (from args or quoted message)
        let text = args.join(' ');
        if (!text && ctx.quoted && ctx.quoted.text) {
            text = ctx.quoted.text; // 👈 Grabs the text from the replied message
        }

        // 2. Extract Media (if any)
        const media = ctx.quoted ? await ctx.getMedia() : null;

        // 3. Validate
        if (!text && !media) {
            return ctx.reply(`📢 *Broadcast Status*\n\n*Usage:*\n1. \`${prefix}broadcast <message>\`\n2. Reply to a message/media with \`${prefix}broadcast\``);
        }

        await ctx.reply(`📢 *Broadcast Initiated*\nFetching groups...`);

        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);
            
            if (groupIds.length === 0) {
                return ctx.reply('❌ The bot is not in any groups.');
            }

            // Check for URL in the text to build a preview silently
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
                    const contextInfo = getChannelContext();
                    const randomColor = getRandomStatusColor();

                    if (media && media.isImage) {
                        await sock.sendMessage(groupId, { 
                            image: media.buffer, 
                            caption: text || '', 
                            groupStatus: true,
                            contextInfo 
                        });
                    } else if (media && media.isVideo) {
                        await sock.sendMessage(groupId, { 
                            video: media.buffer, 
                            caption: text || '', 
                            groupStatus: true,
                            contextInfo
                        });
                    } else if (media && media.isAudio) {
                        await sock.sendMessage(groupId, { 
                            audio: media.buffer, 
                            mimetype: 'audio/mp4', 
                            ptt: true, 
                            groupStatus: true,
                            contextInfo
                        });
                    } else {
                        // Send Text Status (with link preview if available)
                        const payload = { 
                            text: text, 
                            groupStatus: true, 
                            contextInfo,
                            backgroundColor: randomColor
                        };
                        if (linkPreview) {
                            payload.linkPreview = linkPreview;
                        }
                        await sock.sendMessage(groupId, payload);
                    }
                    success++;
                } catch (err) {
                    failed++;
                    console.error(`Failed to broadcast status to ${groupId}:`, err.message);
                }
                
                // Delay to prevent WhatsApp ban (3 seconds per group)
                await new Promise(r => setTimeout(r, 3000));
            }

            await ctx.reply(`✅ *Broadcast Status Complete!*\n\n*Success:* ${success}\n*Failed:* ${failed}`);

        } catch (err) {
            console.error('Broadcast error:', err);
            await ctx.reply(`❌ *Broadcast Failed*\n_Error: ${err.message}_`);
        }
    }
};