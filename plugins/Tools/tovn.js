import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export default {
    command: 'tovn',
    aliases: ['tovoicenote'],
    description: 'Convert a replied video/audio to a voice note',
    category: 'Tools',
    ownerOnly: false,
    usage: 'tovn (reply to media)',

    async execute(sock, m, args, ctx) {
        if (!ctx.quoted) {
            return ctx.reply('🎙️ *To Voice Note*\n\nReply to a video or audio file with `.tovn`.');
        }

        const media = await ctx.getMedia();
        if (!media) {
            return ctx.reply('❌ Failed to download the replied media.');
        }

        await ctx.reply('⏳ _Converting to voice note..._');

        const id = crypto.randomUUID();
        const inPath = path.join(os.tmpdir(), `tovn_in_${id}.mp4`);
        const outPath = path.join(os.tmpdir(), `tovn_out_${id}.ogg`);

        try {
            await fs.writeFile(inPath, media.buffer);

            // Convert to OGG (Opus) which WhatsApp uses for voice notes
            await execFileAsync('ffmpeg', [
                '-y',
                '-i', inPath,
                '-vn',                   // Disable video
                '-c:a', 'libopus',       // Use Opus codec
                '-b:a', '64k',           // Bitrate
                '-vbr', 'on',            // Variable bitrate
                '-compression_level', '10',
                outPath
            ]);

            const oggBuffer = await fs.readFile(outPath);

            await sock.sendMessage(m.key.remoteJid, {
                audio: oggBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true // 👈 This makes it a Voice Note
            }, { quoted: m });

        } catch (err) {
            console.error('ToVN error:', err);
            await ctx.reply(`❌ Failed to convert media.\n_Error: ${err.message}_`);
        } finally {
            await fs.unlink(inPath).catch(() => {});
            await fs.unlink(outPath).catch(() => {});
        }
    }
};