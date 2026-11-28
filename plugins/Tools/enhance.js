import sharp from 'sharp';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getPrefix } from '../../lib/config.js';

const execFileAsync = promisify(execFile);

export default {
    command: 'hd',
    aliases: ['enhance', 'upscale'],
    description: 'Upscale and sharpen an image or video to HD',
    category: 'General',
    ownerOnly: false,
    usage: 'hd (reply to an image/video)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        const isQuotedMedia = ctx.quoted && ['imageMessage', 'videoMessage'].includes(ctx.quoted.type);
        const isDirectMedia = ['imageMessage', 'videoMessage'].includes(ctx.type);

        if (!isQuotedMedia && !isDirectMedia) {
            return ctx.reply(`❌ Please reply to an image/video or send one with the caption \`${prefix}hd\``);
        }

        try {
            await ctx.react('⏳');

            const media = await ctx.getMedia();
            if (!media?.buffer) {
                return ctx.reply('❌ Failed to download the media.');
            }

            // ─── IMAGE ───
            if (media.isImage || ctx.quoted?.type === 'imageMessage' || ctx.type === 'imageMessage') {
                const enhancedBuffer = await sharp(media.buffer)
                    .resize({ width: 1920, withoutEnlargement: false })
                    .sharpen({ sigma: 1.5 })
                    .jpeg({ quality: 95 })
                    .toBuffer();

                await sock.sendMessage(m.key.remoteJid, {
                    image: enhancedBuffer,
                    caption: `✨ *Image Enhanced to HD*`
                }, { quoted: m });

                await ctx.react('✅');
                return;
            }

            // ─── VIDEO ───
            if (media.isVideo || ctx.quoted?.type === 'videoMessage' || ctx.type === 'videoMessage') {
                const tmpDir = os.tmpdir();
                const input = path.join(tmpDir, `hd_in_${Date.now()}.mp4`);
                const output = path.join(tmpDir, `hd_out_${Date.now()}.mp4`);

                try {
                    fs.writeFileSync(input, media.buffer);

                    // upscale to 1280 width + sharpen + keep audio
                    await execFileAsync('ffmpeg', [
                        '-y', '-i', input,
                        '-vf', 'scale=1280:-2:flags=lanczos,unsharp=5:5:1.0:5:5:0.0',
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                        '-c:a', 'copy',
                        output
                    ]);

                    const outBuffer = fs.readFileSync(output);
                    await sock.sendMessage(m.key.remoteJid, {
                        video: outBuffer,
                        caption: `✨ *Video Enhanced to HD*`,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    await ctx.react('✅');
                } finally {
                    try { fs.unlinkSync(input); } catch {}
                    try { fs.unlinkSync(output); } catch {}
                }
                return;
            }

            return ctx.reply('❌ Only image/video supported.');
        } catch (err) {
            console.error('Enhance error:', err);
            await ctx.react('❌');
            if (err.message?.includes('ffmpeg') || err.code === 'ENOENT') {
                return ctx.reply('❌ ffmpeg not installed on host. Image HD works, video needs ffmpeg.');
            }
            await ctx.reply('❌ Failed to enhance the media.');
        }
    }
};