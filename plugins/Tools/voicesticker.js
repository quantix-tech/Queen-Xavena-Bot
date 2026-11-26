import { getPrefix } from '../../lib/config.js';
import { createVoiceSticker } from '../../lib/voicesticker.js';
import { generateWAMessageFromContent } from '@itsliaaa/baileys';

export default {
    command: 'vs',
    aliases: ['voicesticker', 'audiosticker'],
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

            // ─── THE PROTO HACK ───
            // Since @itsliaaa/baileys doesn't have AudioStickerMessage,
            // we inject the audio directly into the sticker proto.
            stickerMessage.isAnimated = true;
            audioMessage.ptt = false; 
            stickerMessage.audioMessage = audioMessage; 
            stickerMessage.stickerSentTs = Date.now();

            // Send via relay as a standard stickerMessage
            const msg = generateWAMessageFromContent(
                m.key.remoteJid,
                { stickerMessage: stickerMessage },
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