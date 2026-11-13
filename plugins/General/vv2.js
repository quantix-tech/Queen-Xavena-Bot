import { getRealJid } from '../../lib/utils.js';

export default {
    command: 'vv2',
    description: 'Send view-once media silently to the bot DM',
    category: 'General',
    ownerOnly: false,
    usage: 'vv2 (reply to view-once)',

    async execute(sock, m, args, ctx) {
        if (!ctx.quoted) {
            return ctx.reply('❌ *View Once*\n\nReply to a view-once media with `.vv2`\n_Note: The media will be sent to the bot\'s DM silently._');
        }

        const media = await ctx.getMedia();
        if (!media) {
            return ctx.reply('❌ Failed to download view-once media.');
        }

        // Resolve the bot's own JID
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // 👇 FIX: Get the real phone number or push name
        const senderJid = m.key.participant || m.key.remoteJid;
        const realNumber = await getRealJid(senderJid, sock);
        const senderName = m.pushName || realNumber || 'Unknown User';

        try {
            if (media.isImage) {
                await sock.sendMessage(botJid, { 
                    image: media.buffer, 
                    caption: `🔓 *View-Once Image*\nFrom: ${senderName}` 
                });
            } else if (media.isVideo) {
                await sock.sendMessage(botJid, { 
                    video: media.buffer, 
                    caption: `🔓 *View-Once Video*\nFrom: ${senderName}` 
                });
            } else if (media.isAudio) {
                await sock.sendMessage(botJid, { 
                    audio: media.buffer, 
                    mimetype: 'audio/mpeg', 
                    ptt: true 
                });
            } else {
                return ctx.reply('❌ Unsupported media type. Only image, video, or voice notes work.');
            }
            
            // Delete the user's command so it's completely silent
            await sock.sendMessage(m.key.remoteJid, { delete: m.key });
            
        } catch (err) {
            console.error('VV2 error:', err);
            await ctx.reply('❌ Failed to process media.');
        }
    }
};