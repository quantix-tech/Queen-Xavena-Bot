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
        const link = args[0]?.trim();

        if (!link) {
            return ctx.reply(`*Channel ID*\n\n*Usage:* ${prefix}idch <channel_link>\n*Example:* ${prefix}idch https://whatsapp.com/channel/0029Va...`);
        }

        if (!link.includes('https://whatsapp.com/channel/')) {
            return ctx.reply(`❌ *Error*\n\nInvalid WhatsApp channel link.`);
        }

        try {
            await sock.sendMessage(m.key.remoteJid, { react: { text: '📢', key: m.key } });

            const rawId = link.split('https://whatsapp.com/channel/')[1].split('?')[0].split('/')[0].trim();

            // Invite codes are like 0029Va... - if it's all numbers, it's NOT an invite
            if (!rawId || rawId.length < 10 || /[^A-Za-z0-9_-]/.test(rawId)) {
                return ctx.reply(`❌ *Error*\n\nInvalid invite code: \`${rawId}\`\n\nCopy the FULL link from WhatsApp, don't type the ID manually.`);
            }

            let channelData;
            try {
                channelData = await sock.newsletterMetadata("invite", rawId);
            } catch (e) {
                // If WhatsApp says Bad Request, the invite is bad/expired/private
                console.log('Invite failed, trying JID:', e.message);
                channelData = await sock.newsletterMetadata("jid", rawId + '@newsletter');
            }

            await ctx.reply(`*Channel Info*\n\n*ID:* ${channelData.id}\n*Name:* ${channelData.name}\n*Followers:* ${channelData.subscribers}\n*Status:* ${channelData.state}\n*Verified:* ${channelData.verification == "VERIFIED" ? "✅ Yes" : "❌ No"}`);
        } catch (error) {
            console.error('Channel ID error:', error);
            await ctx.reply(`❌ *Error*\n\nFailed to fetch channel info.\nThat link is invalid, expired, or the channel is private.`);
        }
    }
};