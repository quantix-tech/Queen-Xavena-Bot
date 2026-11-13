export default {
    command: 'vv',
    description: 'Reveal and send a view-once media',
    category: 'General',
    ownerOnly: false,
    usage: '.vv (reply to view-once)',

    async execute(sock, m, args, ctx) {
        if (!ctx.quoted) {
            return ctx.reply('❌ *View Once*\n\nReply to a view-once image, video, or voice note with `.vv`');
        }

        const media = await ctx.getMedia();
        if (!media) {
            return ctx.reply('❌ Failed to download view-once media.');
        }

        const caption = ctx.text.replace(/^\.vv\s*/i, '') || `🔓 *View-Once ${media.isImage ? 'Image' : media.isVideo ? 'Video' : 'Audio'}*`;

        try {
            if (media.isImage) {
                await sock.sendMessage(m.key.remoteJid, { image: media.buffer, caption }, { quoted: m });
            } else if (media.isVideo) {
                await sock.sendMessage(m.key.remoteJid, { video: media.buffer, caption }, { quoted: m });
            } else if (media.isAudio) {
                await sock.sendMessage(m.key.remoteJid, { audio: media.buffer, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
            } else {
                return ctx.reply('❌ Unsupported media type. Only image, video, or voice notes work.');
            }
            await ctx.react('✅');
        } catch (err) {
            console.error('VV error:', err);
            await ctx.react('❌');
            await ctx.reply('❌ Failed to send media.');
        }
    }
};