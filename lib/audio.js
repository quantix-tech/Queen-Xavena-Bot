import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

export async function applyAudioEffect(sock, m, ctx, filter) {
    if (!ctx.quoted) {
        return ctx.reply('🎙️ Please reply to an audio message or voice note with this command.');
    }

    const media = await ctx.getMedia();
    if (!media || !media.isAudio) {
        return ctx.reply('❌ Please reply to a valid audio file or voice note.');
    }

    await ctx.reply(`⏳ _Processing audio..._`);

    const id = crypto.randomUUID();
    const inPath = path.join(os.tmpdir(), `audio_in_${id}.mp3`);
    const outPath = path.join(os.tmpdir(), `audio_out_${id}.mp3`);

    try {
        await fs.writeFile(inPath, media.buffer);

        // Run ffmpeg with the specific filter
        await execFileAsync(ffmpegPath, [
            '-y',
            '-i', inPath,
            '-af', filter,
            '-b:a', '128k',
            outPath
        ]);

        const audioBuffer = await fs.readFile(outPath);

        // Send back as audio
        await sock.sendMessage(m.key.remoteJid, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            ptt: false
        }, { quoted: m });

    } catch (err) {
        console.error('Audio effect error:', err);
        await ctx.reply(`❌ Failed to apply effect.\n_Error: ${err.message}_`);
    } finally {
        await fs.unlink(inPath).catch(() => {});
        await fs.unlink(outPath).catch(() => {});
    }
}