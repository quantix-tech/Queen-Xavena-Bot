import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export default {
    command: 'toaudio',
    aliases: ['tomp3', 'tovn'],
    description: 'Extract audio from a video',
    category: 'Tools',
    ownerOnly: false,
    usage: 'toaudio (reply to video)',

    async execute(sock, m, args, ctx) {
        await ctx.react('⏳');

        const media = await ctx.getMedia();
        if (!media || !media.isVideo) {
            await ctx.react('❌');
            return ctx.reply('❌ *To Audio*\n\nReply to a video to extract its audio.');
        }

        try {
            const id = crypto.randomUUID();
            const inPath = path.join(os.tmpdir(), `qx-video-${id}.mp4`);
            const outPath = path.join(os.tmpdir(), `qx-audio-${id}.mp3`);

            // Write video buffer to temp file
            await fs.writeFile(inPath, media.buffer);

            // Use ffmpeg to extract audio
            await execFileAsync('ffmpeg', [
                '-y',
                '-i', inPath,
                '-vn', // Disable video
                '-ab', '128k', // Audio bitrate
                '-ar', '44100', // Audio sample rate
                '-f', 'mp3', // Force MP3 format
                outPath
            ]);

            // Read the output file
            const audioBuffer = await fs.readFile(outPath);

            // Send as an audio file
            await sock.sendMessage(m.key.remoteJid, { 
                audio: audioBuffer, 
                mimetype: 'audio/mpeg', 
                ptt: false, // Set to true if you want it as a voice note
                fileName: `audio_${id}.mp3`
            }, { quoted: m });

            // Cleanup
            await fs.unlink(inPath).catch(() => {});
            await fs.unlink(outPath).catch(() => {});

            await ctx.react('✅');
        } catch (err) {
            console.error('ToAudio error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to extract audio.\n_Error: ${err.message}_`);
        }
    }
};
