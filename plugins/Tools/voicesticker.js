import { getPrefix } from '../../lib/config.js';
import { createVoiceSticker } from '../../lib/voicesticker.js';
import { generateWAMessageFromContent, proto } from '@itsliaaa/baileys';

export default {
    command: 'vs',
    aliases: ['voicesticker', 'audioSticker'],
    description: 'Convert a video into an audio sticker (max 7s)',
    category: 'Tools',
    ownerOnly: false,
    usage: 'vs (reply to a video)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted || ctx.quoted.type !== 'videoMessage') {
            return ctx.reply(`🎵 *Voice Sticker*\n\nReply to a video with \`${prefix}vs\` to convert it into an audio sticker (max 7s).`);
        }

        await ctx.react('⏳');

        try {
            const media = await ctx.getMedia();
            if (!media || !media.isVideo) throw new Error('Could not download the video.');

            await ctx.reply('⚙️ _Processing video into audio sticker..._');

            const { stickerMessage, audioMessage } = await createVoiceSticker(sock, media.buffer);

            if (!stickerMessage || !audioMessage) {
                throw new Error('Failed to upload media to WhatsApp.');
            }

            // Set required flags
            stickerMessage.isAnimated = true;
            audioMessage.ptt = false; 

            // ─── THE OFFICIAL AUDIO STICKER PROTO ───
            const audioStickerMessage = proto.Message.AudioStickerMessage.fromObject({
                stickerMessage: stickerMessage,
                audioMessage: audioMessage
            });

            // Send via relay
            const msg = generateWAMessageFromContent(
                m.key.remoteJid,
                { audioStickerMessage: audioStickerMessage },
                { quoted: m, userJid: sock.user.id }
            );

            await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
            await ctx.react('✅');

        } catch (err) {
            console.error('[VOICESTICKER ERROR]', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed: ${err.message}`);
        }
    }
};