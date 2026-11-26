import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { Image } from 'node-webpmux';

// Helper to run ffmpeg commands
function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
    return new Promise(async (resolve, reject) => {
        try {
            const tmp = path.join(os.tmpdir(), `${Date.now()}.${ext}`);
            const out = `${tmp}.${ext2}`;
            await fs.promises.writeFile(tmp, buffer);

            exec(`"${ffmpegPath}" -y -i "${tmp}" ${args.join(' ')} "${out}"`, (err) => {
                try { fs.unlinkSync(tmp); } catch {}
                if (err) return reject(err);
                try {
                    const res = fs.readFileSync(out);
                    fs.unlinkSync(out);
                    resolve(res);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

// Convert Video/Image to Animated/Static WebP
export async function writeExifMedia(mediaBuffer, type, packname, author) {
    let webpBuffer;
    
    if (type === 'video' || type === 'gif') {
        // Convert video to animated WebP (max 3 seconds, 10 fps)
        webpBuffer = await ffmpeg(mediaBuffer, [
            '-vcodec', 'libwebp', '-vf', "scale=512:512:force_original_aspect_ratio=decrease,fps=10,pad=512:512:-1:-1:color=white@0.0", 
            '-loop', '0', '-ss', '00:00:00', '-t', '00:00:03', '-preset', 'default', '-an', '-vsync', '0'
        ], 'mp4', 'webp');
    } else {
        // Convert static image to WebP
        webpBuffer = await ffmpeg(mediaBuffer, [
            '-vcodec', 'libwebp', '-vf', "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0"
        ], 'png', 'webp');
    }

    return await addExif(webpBuffer, packname, author);
}

// Add Pack Metadata (and preserve existing audio if present)
export async function addExif(webpBuffer, packname, author) {
    const img = new Image();
    await img.load(webpBuffer);
    
    const json = {
        "sticker-pack-id": crypto.randomBytes(32).toString('hex'),
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        "emojis": ["🎵"]
    };
    
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    
    img.exif = exif;
    return await img.save(null);
}

// Convert Audio to Opus Voice Note
export async function convertToOpus(audioBuffer) {
    return await ffmpeg(audioBuffer, [
        '-vn', '-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on', '-compression_level', '10', '-ar', '48000', '-ac', '1'
    ], 'mp3', 'ogg');
}