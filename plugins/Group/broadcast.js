import { buildLinkPreview, getChannelContext, getRandomStatusColor } from '../../lib/linkPreview.js';

export default {
    command: 'broadcast',
    aliases: ['bc'],
    description: 'Send a group status to all groups',
    category: 'Group',
    ownerOnly: true,
    usage: 'broadcast <message> OR reply to media',

    async execute(sock, m, args, ctx) {
        if (!args[0] && !ctx.quoted) {
            return ctx.reply(`📢 *Broadcast Status*\n\n*Usage:*\n1. \`.broadcast <message>\`\n2. Reply to an image/video with \`.broadcast <caption>\``);
        }

        await ctx.reply(`📢 *Broadcast Initiated*\nFetching groups...`);

        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);
            
            if (groupIds.length === 0) return ctx.reply('❌ The bot is not in any groups.');

            const text = args.join(' ');
            const media = ctx.quoted ? await ctx.getMedia() : null;
            const contextInfo = getChannelContext();
            
            let linkPreview = null;
            const urls = text.match(/(https?:\/\/[^\s]+)/g);
            if (urls && urls.length > 0) {
                console.log(`[broadcast] Link detected, building preview silently...`);
                linkPreview = await buildLinkPreview(urls[0]);
            }

            await ctx.reply(`⏳ Uploading status to ${groupIds.length} groups...`);

            let success = 0;
            let failed = 0;

            for (const groupId of groupIds) {
                try {
                    const randomColor = getRandomStatusColor();

                    if (media && media.isImage) {
                        await sock.sendMessage(groupId, { image: media.buffer, caption: text, groupStatus: true, contextInfo });
                    } else if (media && media.isVideo) {
                        await sock.sendMessage(groupId, { video: media.buffer, caption: text, groupStatus: true, contextInfo });
                    } else {
                        const payload = { 
                            text: text, 
                            groupStatus: true, 
                            contextInfo,
                            backgroundColor: randomColor
                        };
                        if (linkPreview) payload.linkPreview = linkPreview;
                        await sock.sendMessage(groupId, payload);
                    }
                    success++;
                } catch (err) {
                    failed++;
                    console.error(`Failed to broadcast status to ${groupId}:`, err.message);
                }
                // Delay to prevent ban
                await new Promise(r => setTimeout(r, 3000));
            }

            await ctx.reply(`✅ *Broadcast Status Complete!*\n\n*Success:* ${success}\n*Failed:* ${failed}`);

        } catch (err) {
            console.error('Broadcast error:', err);
            await ctx.reply(`❌ *Broadcast Failed*\n_Error: ${err.message}_`);
        }
    }
};