import { getPrefix } from '../../lib/config.js';

export default {
    command: 'idch',
    aliases: ['channelinfo', 'chid'],
    description: 'Get WhatsApp Channel info from a link',
    category: 'Tools',
    ownerOnly: false,
    usage: 'idch <channel_link>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const link = args[0];

        if (!link) {
            return ctx.reply(`📢 *Channel ID*\n\nUsage: \`${prefix}idch <channel_link>\`\nExample: \`${prefix}idch https://whatsapp.com/channel/xxxxx\``);
        }

        if (!link.includes('https://whatsapp.com/channel/')) {
            return ctx.reply('❌ *Error*\n\nInvalid WhatsApp channel link.');
        }

        try {
            // Extract the channel ID from the URL
            const channelId = link.split('https://whatsapp.com/channel/')[1].split('?')[0];
            
            // Fetch metadata using the invite code
            const channelData = await sock.newsletterMetadata("invite", channelId);

            const text = `📢 *Channel Info*\n\n` +
                         `*ID:* ${channelData.id}\n` +
                         `*Name:* ${channelData.name}\n` +
                         `*Followers:* ${channelData.subscribers || '0'}\n` +
                         `*Status:* ${channelData.state || 'Active'}\n` +
                         `*Verified:* ${channelData.verification === "VERIFIED" ? "✅ Yes" : "❌ No"}`;

            await ctx.reply(text);
            
        } catch (error) {
            console.error('Channel ID error:', error.message);
            await ctx.reply(`❌ *Error*\n\nFailed to fetch channel info. Make sure the link is valid and public.`);
        }
    }
};