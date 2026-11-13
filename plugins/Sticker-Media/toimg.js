import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export default {
    command: 'toimg',
    aliases: ['toimage', 'tovid', 'togif'],
    description: 'Convert a sticker back to an image or GIF',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'toimg (reply to sticker)',

    async execute(sock, m, args, ctx) {
        await ctx.react('⏳');

        const media = await ctx.getMedia();
        if (!media || !media.isSticker) {
            await ctx.react('❌');
            return ctx.reply('❌ *To Image*\n\nReply to a sticker to convert it.');
        }

        try {
            // Check if it's an animated sticker (webp with animation)
            // We can check the buffer header or just try to convert it
            const isAnimated = media.buffer.includes(Buffer.from('ANIM'));

            if (isAnimated) {
                // ─── ANIMATED STICKER -> GIF/MP4 ───
                const id = crypto.randomUUID();
                const inPath = path.join(os.tmpdir(), `qx-sticker-${id}.webp`);
                const outPath = path.join(os.tmpdir(), `qx-output-${id}.mp4`);

                await fs.writeFile(inPath, media.buffer);

                // Use ffmpeg to convert animated webp to mp4
                await execFileAsync('ffmpeg', [
                    '-y',
                    '-i', inPath,
                    '-movflags', 'faststart',
                    '-pix_fmt', 'yuv420p',
                    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                    outPath
                ]);

                const outputBuffer = await fs.readFile(outPath);

                await sock.sendMessage(m.key.remoteJid, { 
                    video: outputBuffer, 
                    gifPlayback: true, 
                    caption: '✅ *Converted to GIF/Video*' 
                }, { quoted: m });

                // Cleanup
                await fs.unlink(inPath).catch(() => {});
                await fs.unlink(outPath).catch(() => {});

            } else {
                // ─── STATIC STICKER -> PNG ───
                const pngBuffer = await sharp(media.buffer)
                    .png()
                    .toBuffer();

                await sock.sendMessage(m.key.remoteJid, { 
                    image: pngBuffer, 
                    caption: '✅ *Converted to Image*' 
                }, { quoted: m });
            }

            await ctx.react('✅');
        } catch (err) {
            console.error('ToImg error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to convert sticker.\n_Error: ${err.message}_`);
        }
    }
};