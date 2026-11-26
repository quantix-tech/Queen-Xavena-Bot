import { getPrefix } from '../../lib/config.js';
import { prepareWAMessageMedia, generateWAMessageFromContent } from '@itsliaaa/baileys';
import { writeExifMedia, convertToOpus, addExif } from '../../lib/webp.js';
import axios from 'axios';

export default {
    command: 'saudio',
    aliases: ['soundsticker', 'stikersuara'],
    description: 'Create a sticker with embedded audio',
    category: 'Tools',
    ownerOnly: false,
    usage: 'saudio [audio_url] (reply to sticker/video)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const audioUrl = args[0];

        if (!ctx.quoted) {
            return ctx.reply(`🎵 *Sound Sticker*\n\nReply to a sticker, image, or video with:\n\`${prefix}saudio <audio_url>\`\n\n*OR* reply to a media with a voice note and type:\n\`${prefix}saudio\``);
        }

        await ctx.react('⏳');

        try {
            // 1. Get the media to convert (Sticker, Image, or Video)
            const targetMedia = await ctx.getMedia();
            if (!targetMedia || !targetMedia.buffer) {
                throw new Error('Could not download the replied media.');
            }

            // 2. Figure out the audio source
            let rawAudioBuffer = null;

            if (audioUrl) {
                // Audio from URL
                const res = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                rawAudioBuffer = Buffer.from(res.data);
            } else {
                // Check if the quoted message is an audio message
                if (['audioMessage', 'pttMessage'].includes(ctx.quoted.type)) {
                    const audioMedia = await ctx.quoted.getMedia ? await ctx.quoted.getMedia() : null;
                    // Note: ctx.quoted.getMedia() isn't defined in your message.js, so we fallback to a direct download
                    const { downloadMediaMessage } = await import('@itsliaaa/baileys');
                    rawAudioBuffer = await downloadMediaMessage(
                        { message: ctx.quoted.message, key: ctx.quoted.key },
                        'buffer',
                        {},
                        { reuploadRequest: sock.updateMediaMessage }
                    );
                } else {
                    return ctx.reply('❌ Please provide an audio URL, or reply to an audio/voice note with this command.');
                }
            }

            if (!rawAudioBuffer) throw new Error('Failed to download or process audio.');

            // 3. Convert Audio to Opus (PTT)
            await ctx.reply('🎵 _Processing audio..._');
            const opusAudio = await convertToOpus(rawAudioBuffer);

            // 4. Convert target media to WebP Sticker
            await ctx.reply('🎨 _Creating sticker..._');
            let stickerBuffer;
            
            if (targetMedia.isVideo) {
                stickerBuffer = await writeExifMedia(targetMedia.buffer, 'video', 'Queen Xavena', 'Audio Sticker');
            } else if (targetMedia.isImage) {
                stickerBuffer = await writeExifMedia(targetMedia.buffer, 'image', 'Queen Xavena', 'Audio Sticker');
            } else if (targetMedia.isSticker) {
                // It's already a WebP, just ensure it has EXIF
                stickerBuffer = await addExif(targetMedia.buffer, 'Queen Xavena', 'Audio Sticker');
            } else {
                throw new Error('Unsupported media type. Reply to a sticker, image, or video.');
            }

            // 5. Upload Media to WhatsApp
            await ctx.reply('☁️ _Uploading to WhatsApp..._');
            const [stickerMedia, audioMedia] = await Promise.all([
                prepareWAMessageMedia({ sticker: stickerBuffer }, { upload: sock.waUploadToServer }),
                prepareWAMessageMedia({ audio: opusAudio, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { upload: sock.waUploadToServer })
            ]);

            const stickerMsg = stickerMedia.stickerMessage;
            const audioMsg = audioMedia.audioMessage;

            if (!stickerMsg) throw new Error('Failed to upload sticker to WhatsApp.');

            // 6. The Magic Hack: Inject Audio into Sticker
            if (audioMsg) {
                audioMsg.mimetype = 'audio/ogg; codecs=opus';
                audioMsg.ptt = true;
                stickerMsg.audioMessage = audioMsg;
            }

            stickerMsg.stickerSentTs = Date.now();
            if (targetMedia.isVideo) stickerMsg.isAnimated = true;

            // 7. Send the final message
            const msg = generateWAMessageFromContent(
                m.key.remoteJid,
                { stickerMessage: stickerMsg },
                { quoted: m, userJid: sock.user.id }
            );

            await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
            await ctx.react('✅');

        } catch (err) {
            console.error('[SAUDIO ERROR]', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed: ${err.message}`);
        }
    }
};