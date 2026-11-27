import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { downloadContentFromMessage } from '@itsliaaa/baileys';
import { addExif } from '../../library/exif.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    command: 'sprem',
    description: 'Convert image/video to premium sticker with metadata',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'sprem (reply to image/video/sticker)',

    async execute(sock, m, args, ctx) {
        try {
            const contextInfo =
                m.message?.extendedTextMessage?.contextInfo ||
                m.message?.imageMessage?.contextInfo ||
                m.message?.videoMessage?.contextInfo ||
                m.message?.stickerMessage?.contextInfo ||
                m.message?.documentMessage?.contextInfo ||
                m.message?.audioMessage?.contextInfo || null;

            const quotedMessage = contextInfo?.quotedMessage;

            if (!quotedMessage) {
                return ctx.reply('❌ Reply to an image, video, or sticker.');
            }

            const hasImage = quotedMessage.imageMessage;
            const hasVideo = quotedMessage.videoMessage;
            const hasSticker = quotedMessage.stickerMessage;

            if (!hasImage && !hasVideo && !hasSticker) {
                return ctx.reply('❌ Reply to an image, video, or sticker.');
            }

            await ctx.reply('Converting to premium sticker...');

            let media = null;
            try {
                let stream;
                if (hasImage) stream = await downloadContentFromMessage(quotedMessage.imageMessage, 'image');
                else if (hasVideo) stream = await downloadContentFromMessage(quotedMessage.videoMessage, 'video');
                else if (hasSticker) stream = await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker');

                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                media = Buffer.concat(chunks);

                if (!media || media.length === 0) {
                    return ctx.reply('❌ Could not download media.');
                }
            } catch (err) {
                console.error('Media download error:', err);
                return ctx.reply('❌ Failed to download media.');
            }

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            const input = path.join(tempDir, `sprem_${timestamp}`);
            const output = `${input}.webp`;

            try {
                fs.writeFileSync(input, media);
            } catch (err) {
                console.error('Write temp error:', err);
                return ctx.reply('❌ Failed to save temporary file.');
            }

            try {
                if (hasSticker) {
                    fs.copyFileSync(input, output);
                } else if (hasVideo) {
                    const videoCmd = `ffmpeg -y -i "${input}" -vf "fps=15,scale=512:512:force_original_aspect_ratio=increase,crop=512:512:(iw-ow)/2:(ih-oh)/2,format=yuva420p" -c:v libwebp -lossless 0 -q:v 70 -loop 0 -an -preset default -compression_level 6 "${output}"`;
                    await new Promise((resolve, reject) => {
                        exec(videoCmd, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                } else if (hasImage) {
                    const imgCmd = `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512:(iw-ow)/2:(ih-oh)/2,format=yuva420p" -c:v libwebp -lossless 0 -q:v 80 -an "${output}"`;
                    await new Promise((resolve, reject) => {
                        exec(imgCmd, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            } catch (err) {
                console.error('Conversion error:', err);
                try {
                    if (fs.existsSync(input)) fs.unlinkSync(input);
                    if (fs.existsSync(output)) fs.unlinkSync(output);
                } catch {}
                return ctx.reply('❌ Conversion failed.');
            }

            let stickerBuffer = null;
            try {
                stickerBuffer = fs.readFileSync(output);
            } catch (err) {
                console.error('Read output error:', err);
                return ctx.reply('❌ Failed to read converted sticker.');
            }

            try {
                stickerBuffer = await addExif(stickerBuffer, 'SUKUNA MD', 'sukuna', ['🔥']);
            } catch (err) {
                console.error('Exif error:', err);
            }

            try {
                await sock.sendMessage(m.key.remoteJid, {
                    sticker: stickerBuffer,
                    premium: 1
                }, { quoted: m });

                await ctx.reply('✅ Premium sticker sent!');
            } catch (err) {
                console.error('Send sticker error:', err);
                return ctx.reply('❌ Failed to send sticker.');
            }

            try {
                if (fs.existsSync(input)) fs.unlinkSync(input);
                if (fs.existsSync(output)) fs.unlinkSync(output);
            } catch (err) {
                console.error('Cleanup error:', err);
            }

        } catch (err) {
            console.error('Sprem error:', err);
            await ctx.reply('❌ Sticker conversion failed.');
        }
    }
};