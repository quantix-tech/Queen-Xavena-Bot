import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { getPrefix } from '../../lib/config.js';

const execFileAsync = promisify(execFile);

// Store active sessions
const activeSessions = new Map();

export default {
    command: 'image2vid',
    aliases: ['img2vid', 'makevideo'],
    description: 'Convert an image and audio into a video',
    category: 'Tools',
    ownerOnly: false,
    usage: 'image2vid (Reply to image, then audio)',

    async execute(sock, m, args, ctx) {
        const chatId = m.key.remoteJid;
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();

        // Handle cancellation
        if (action === 'cancel') {
            activeSessions.delete(chatId);
            return ctx.reply('🛑 *Cancelled.* The image-to-video session has been cleared.');
        }

        const session = activeSessions.get(chatId);

        // ─── STEP 1: START SESSION ───
        if (!session) {
            // Set a 5-minute timeout to auto-clear
            const timeoutId = setTimeout(() => activeSessions.delete(chatId), 5 * 60 * 1000);
            
            activeSessions.set(chatId, { step: 'IMAGE', timeoutId });
            
            return ctx.reply(`🎬 *Image to Video Converter*\n\n*Step 1:* Reply to an *Image* with the caption \`${prefix}image2vid\`.\n\n_Type \`${prefix}image2vid cancel\` to stop._`);
        }

        // ─── STEP 2: RECEIVE IMAGE ───
        if (session.step === 'IMAGE') {
            const media = await ctx.getMedia();
            
            if (!media || !media.isImage) {
                return ctx.reply(`❌ Please reply to a valid Image file.`);
            }

            session.imageBuffer = media.buffer;
            session.step = 'AUDIO';

            return ctx.reply(`✅ *Image saved!*\n\n*Step 2:* Now reply to an *Audio file* or *Voice Note* with the caption \`${prefix}image2vid\`.`);
        }

        // ─── STEP 3: RECEIVE AUDIO & CREATE VIDEO ───
        if (session.step === 'AUDIO') {
            const media = await ctx.getMedia();
            
            if (!media || !media.isAudio) {
                return ctx.reply(`❌ Please reply to a valid Audio file or Voice Note.`);
            }

            session.audioBuffer = media.buffer;
            clearTimeout(session.timeoutId);
            activeSessions.delete(chatId); // Clear the session

            await ctx.reply(`⏳ *Processing...*\nGenerating your video, please wait.`);

            const id = crypto.randomUUID();
            const imgPath = path.join(os.tmpdir(), `i2v_img_${id}.jpg`);
            const audPath = path.join(os.tmpdir(), `i2v_aud_${id}.mp3`);
            const outPath = path.join(os.tmpdir(), `i2v_out_${id}.mp4`);

            try {
                // Write buffers to temp files
                await fs.writeFile(imgPath, session.imageBuffer);
                await fs.writeFile(audPath, session.audioBuffer);

                // Run FFmpeg to combine image and audio
                await execFileAsync('ffmpeg', [
                    '-y',
                    '-loop', '1',           // Loop the image
                    '-i', imgPath,          // Input Image
                    '-i', audPath,          // Input Audio
                    '-c:v', 'libx264',      // Video Codec
                    '-tune', 'stillimage',  // Optimize for static image
                    '-c:a', 'aac',          // Audio Codec
                    '-b:a', '192k',         // Audio Bitrate
                    '-pix_fmt', 'yuv420p',  // Ensure compatibility with WhatsApp
                    '-shortest',            // Stop video when audio ends
                    outPath
                ]);

                const videoBuffer = await fs.readFile(outPath);

                // Size check (WhatsApp limit ~100MB)
                const fileSizeMB = videoBuffer.length / (1024 * 1024);
                if (fileSizeMB > 100) {
                    return ctx.reply(`❌ *File Too Large*\nThe generated video is ${fileSizeMB.toFixed(1)}MB, exceeding WhatsApp's 100MB limit.`);
                }

                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: `🎬 *Image to Video*\n\n✨ _Generated successfully!_`
                }, { quoted: m });

            } catch (err) {
                console.error('Image2Vid error:', err);
                await ctx.reply(`❌ *Generation Failed*\n_Error: ${err.message}_`);
            } finally {
                // Cleanup temp files
                await fs.unlink(imgPath).catch(() => {});
                await fs.unlink(audPath).catch(() => {});
                await fs.unlink(outPath).catch(() => {});
            }
        }
    }
};