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
            return ctx.reply(`*Channel ID*\n\n*Usage:* ${prefix}idch <channel_link>\n*Example:* ${prefix}idch https://whatsapp.com/channel/xxxxx`);
        }

        if (!link.includes('https://whatsapp.com/channel/')) {
            return ctx.reply(`❌ *Error*\n\nInvalid WhatsApp channel link.`);
        }

        try {
            await sock.sendMessage(m.key.remoteJid, { react: { text: '📢', key: m.key } });

            const rawId = link.split('https://whatsapp.com/channel/')[1].split('?')[0].split('/')[0].trim();

            let channelData;
            try {
                // 1. Try as invite code - 0029Va...
                channelData = await sock.newsletterMetadata("invite", rawId);
            } catch (e) {
                // 2. Fallback - try as JID - 120207...@newsletter
                // This is what fixes the "91203634... is not valid JSON" crash
                const jid = rawId.includes('@newsletter') ? rawId : rawId + '@newsletter';
                channelData = await sock.newsletterMetadata("jid", jid);
            }

            await ctx.reply(`*Channel Info*\n\n*ID:* ${channelData.id}\n*Name:* ${channelData.name}\n*Followers:* ${channelData.subscribers}\n*Status:* ${channelData.state}\n*Verified:* ${channelData.verification == "VERIFIED" ? "✅ Yes" : "❌ No"}`);
        } catch (error) {
            console.error('Channel ID error:', error);
            await ctx.reply(`❌ *Error*\n\nFailed to fetch channel info. Make sure the link is a real public channel link, not just the numeric ID.`);
        }
    }
};