import { getPrefix } from '../../lib/config.js';
import { buildLinkPreview } from '../../lib/linkPreview.js';

export default {
    command: 'broadcast',
    aliases: ['bc'],
    description: 'Send a group status to all groups',
    category: 'Group',
    ownerOnly: true,
    usage: 'broadcast <message> OR reply to media',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        
        if (!args[0] && !ctx.quoted) {
            return ctx.reply(`📢 *Broadcast Status*\n\n*Usage:*\n1. \`${prefix}broadcast <message>\`\n2. Reply to an image/video with \`${prefix}broadcast <caption>\``);
        }

        await ctx.reply(`📢 *Broadcast Initiated*\nFetching groups...`);

        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);
            
            if (groupIds.length === 0) {
                return ctx.reply('❌ The bot is not in any groups.');
            }

            const text = args.join(' ');
            const media = ctx.quoted ? await ctx.getMedia() : null;
            
            // Check for URL to build a preview silently
            let linkPreview = null;
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = text.match(urlRegex);

            if (urls && urls.length > 0) {
                // Log silently to console instead of replying to chat
                console.log(`[broadcast] Link detected, building preview silently...`);
                linkPreview = await buildLinkPreview(urls[0]);
            }

            await ctx.reply(`⏳ Uploading status to ${groupIds.length} groups...`);

            let success = 0;
            let failed = 0;

            for (const groupId of groupIds) {
                try {
                    if (media && media.isImage) {
                        await sock.sendMessage(groupId, { 
                            image: media.buffer, 
                            caption: text, 
                            groupStatus: true 
                        });
                    } else if (media && media.isVideo) {
                        await sock.sendMessage(groupId, { 
                            video: media.buffer, 
                            caption: text, 
                            groupStatus: true 
                        });
                    } else {
                        const payload = { 
                            text: text,
                            groupStatus: true
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