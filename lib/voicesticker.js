import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

const exec = promisify(execFile);

const MAX_SECONDS = 7;
const STEP_TIMEOUT = 120_000;
const FFMPEG = ffmpegStatic;
const FFPROBE = ffprobeStatic.path;

const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out (${Math.round(ms / 1000)}s)`)), ms)
        ),
    ]);

export async function createVoiceSticker(sock, videoBuffer) {
    const tmpDir = path.join(os.tmpdir(), `vs_${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const inputVideo = path.join(tmpDir, 'input.mp4');
    const outputAudio = path.join(tmpDir, 'output.m4a');
    const outputSticker = path.join(tmpDir, 'output.webp');

    try {
        fs.writeFileSync(inputVideo, videoBuffer);

        // 1. Extract Audio (M4A, max 7s)
        await withTimeout(
            exec(FFMPEG, [
                '-y', '-i', inputVideo,
                '-vn', '-c:a', 'aac', '-b:a', '128k',
                '-t', String(MAX_SECONDS),
                outputAudio
            ]),
            STEP_TIMEOUT, 'Audio extraction'
        );

        // 2. Convert Video to Animated WebP (max 7s, 10fps, 512x512)
        await withTimeout(
            exec(FFMPEG, [
                '-y', '-i', inputVideo,
                '-vcodec', 'libwebp', '-vf', `scale=512:512:force_original_aspect_ratio=decrease,fps=10,pad=512:512:-1:-1:color=white@0.0`,
                '-loop', '0', '-ss', '00:00:00', '-t', String(MAX_SECONDS),
                '-preset', 'default', '-an', '-vsync', '0',
                outputSticker
            ]),
            STEP_TIMEOUT, 'Video to WebP'
        );

        const audioBuffer = fs.readFileSync(outputAudio);
        const stickerBuffer = fs.readFileSync(outputSticker);

        // 3. Upload to WhatsApp servers
        const baileys = sock.baileys || (await import('@itsliaaa/baileys'));
        
        const [mediaSticker, mediaAudio] = await Promise.all([
            baileys.prepareWAMessageMedia({ sticker: stickerBuffer }, { upload: sock.waUploadToServer }),
            baileys.prepareWAMessageMedia(
                { audio: audioBuffer, mimetype: 'audio/mp4', ptt: false }, 
                { upload: sock.waUploadToServer }
            )
        ]);

        return {
            stickerMessage: mediaSticker.stickerMessage,
            audioMessage: mediaAudio.audioMessage
        };

    } finally {
        // Cleanup temp files
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
}