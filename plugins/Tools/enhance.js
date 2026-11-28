import sharp from 'sharp';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { getPrefix } from '../../lib/config.js';

function runFFmpeg(args) {
    return new Promise((resolve, reject) => {
        execFile('ffmpeg', args, (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(stdout);
        });
    });
}

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

                    await runFFmpeg([
                        '-y', '-i', input,
                        '-vf', 'scale=1280:-2:flags=lanczos,unsharp=5:5:1.0:5:5:0.0,format=yuv420p',
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                        '-profile:v', 'baseline', '-level', '3.0',
                        '-pix_fmt', 'yuv420p',
                        '-c:a', 'aac', '-b:a', '128k',
                        '-movflags', '+faststart',
                        output
                    ]);

                    const outBuffer = fs.readFileSync(output);
                    await sock.sendMessage(m.key.remoteJid, {
                        video: outBuffer,
                        caption: `✨ *Video Enhanced to HD*`,
                        mimetype: 'video/mp4',
                        fileName: 'hd.mp4'
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