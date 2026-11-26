import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { getPrefix } from '../../lib/config.js';
import { ffmpegBin, toOpusVoice } from '../../lib/audioConvert.js';
import { selfTest, buildAudioSticker } from '../../lib/audioSticker.js';
import crypto from 'crypto';

const MAX_SEC = 6;
const MAX_BYTES = 900 * 1024;

const tmp = (ext) => path.join(os.tmpdir(), `saudio_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
const rm = (...f) => f.forEach(x => { try { fs.unlinkSync(x); } catch { } });

function ff(args) {
    return new Promise((resolve, reject) => {
        const p = spawn(ffmpegBin(), args);
        let err = '';
        p.stderr.on('data', d => { err = (err + d).slice(-400); });
        p.on('error', reject);
        p.on('close', c => c === 0 ? resolve() : reject(new Error(err || `ffmpeg exited ${c}`)));
    });
}

function findMedia(message) {
    const unwrap = (m) => m?.ephemeralMessage?.message || m?.viewOnceMessageV2?.message || m?.viewOnceMessage?.message || m;
    const pick = (m) => {
        m = unwrap(m);
        if (!m) return null;
        if (m.videoMessage) return { node: m.videoMessage, type: 'video' };
        if (m.imageMessage) return { node: m.imageMessage, type: 'image' };
        if (m.stickerMessage) return { node: m.stickerMessage, type: 'sticker' };
        return null;
    };
    const top = unwrap(message) || {};
    for (const k of Object.keys(top)) {
        const q = top[k]?.contextInfo?.quotedMessage;
        if (q) { const r = pick(q); if (r) return r; }
    }
    return pick(top);
}

async function download(found) {
    const { downloadContentFromMessage } = await import('@itsliaaa/baileys');
    const stream = await downloadContentFromMessage(found.node, found.type);
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    return Buffer.concat(chunks);
}

async function toWebp(buf, type) {
    const inp = tmp(type === 'image' ? '.img' : '.vid'), out = tmp('.webp');
    fs.writeFileSync(inp, buf);
    try {
        for (const [size, q] of [[512, 55], [448, 40], [384, 30], [320, 22]]) {
            const vf = `scale=${size}:${size}:force_original_aspect_ratio=decrease,fps=12,pad=${size}:${size}:-1:-1:color=0x00000000,format=rgba`;
            await ff(['-y', '-t', String(MAX_SEC), '-i', inp, '-vf', vf, '-an', '-vsync', '0', '-c:v', 'libwebp',
                '-q:v', String(q), '-compression_level', '6', '-loop', '0', '-preset', 'default', out]);
            const b = fs.readFileSync(out);
            if (b.length <= MAX_BYTES || type === 'image') return b;
        }
        throw new Error('the video is too big for a sticker even after shrinking - try a shorter clip');
    } finally { rm(inp, out); }
}

async function addExif(webpBuf, pack, author) {
    const webpmux = await import('node-webpmux');
    const Image = webpmux.default ? webpmux.default.Image : webpmux.Image;
    const img = new Image();
    await img.load(webpBuf);
    const json = { 'sticker-pack-id': 'qx-' + Date.now(), 'sticker-pack-name': pack, 'sticker-pack-publisher': author, emojis: ['🔊'] };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    img.exif = exif;
    return await img.save(null);
}

export default {
    command: 'saudio',
    aliases: ['soundsticker', 'stickeraudio', 'stikersuara', 'audiosticker'],
    description: 'Turn a video/GIF into a sticker that plays its sound',
    category: 'Tools',
    ownerOnly: false,
    usage: 'saudio (reply to a video) | saudio <audio link> (reply to media)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const found = findMedia(m.message);
        const url = args.find(a => /^https?:\/\//i.test(a));

        if (!found) {
            return ctx.reply(`*SOUND STICKER*\n\n• Reply to a *video / GIF* with \`${prefix}saudio\`\n   -> a sticker that plays the video's own sound\n\n• Reply to a sticker, photo or video with \`${prefix}saudio <audio link>\`\n   -> a sticker with that sound\n\nClips are cut to ${MAX_SEC} seconds.`);
        }
        if (found.type !== 'video' && !url) {
            return ctx.reply(`A ${found.type} has no sound of its own. Add an audio link:\n\`${prefix}saudio https://example.com/sound.mp3\``);
        }

        await ctx.react('⏳');

        try {
            const raw = await download(found);
            if (!raw.length) throw new Error('could not download the media (it may have expired)');

            let sticker = found.type === 'sticker' ? raw : await toWebp(raw, found.type);
            try { sticker = await addExif(sticker, 'Queen Xavena', 'Sound Sticker'); } catch (e) { }

            let source;
            if (url) {
                const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000, maxContentLength: 15 * 1024 * 1024, headers: { 'User-Agent': 'Mozilla/5.0' } });
                source = Buffer.from(r.data);
            } else source = raw;
            
            let voice;
            try { voice = await toOpusVoice(source, MAX_SEC); }
            catch (e) {
                if (!url) return ctx.reply(`That video has no sound to use. Reply to it with an audio link instead:\n\`${prefix}saudio https://example.com/sound.mp3\``);
                throw new Error('could not read that audio link');
            }

            const { prepareWAMessageMedia, proto } = await import('@itsliaaa/baileys');
            const canAudioSticker = selfTest(proto);
            console.log('[saudio] sound-sticker encoding ready:', canAudioSticker);

            let sent = false, why = canAudioSticker ? '' : 'the encoder patch could not be installed on this library';
            
            if (canAudioSticker) {
                try {
                    const [sm, am] = await Promise.all([
                        prepareWAMessageMedia({ sticker }, { upload: sock.waUploadToServer, mediaTypeOverride: 'sticker' }),
                        prepareWAMessageMedia({ audio: voice, mimetype: 'audio/ogg; codecs=opus' }, { upload: sock.waUploadToServer, mediaTypeOverride: 'audio' })
                    ]);
                    const st = sm.stickerMessage, au = am.audioMessage;
                    if (!st?.url || !au?.url) throw new Error('upload failed');
                    
                    const stickerObj = {
                        url: st.url, fileSha256: st.fileSha256, fileEncSha256: st.fileEncSha256, mediaKey: st.mediaKey,
                        mimetype: 'image/webp', directPath: st.directPath, mediaKeyTimestamp: st.mediaKeyTimestamp,
                        height: 512, width: 512, fileLength: st.fileLength,
                        isAnimated: found.type === 'video' || !!found.node.isAnimated,
                        stickerSentTs: Date.now(), isAvatar: false, isAiSticker: false, isLottie: false,
                        contextInfo: { mediaDomainInfo: { mediaKeyDomain: 1, e2EeMediaKey: st.mediaKey }, experienceIds: [13002] }
                    };
                    const audioObj = {
                        url: au.url, mimetype: 'audio/ogg; codecs=opus', fileSha256: au.fileSha256, fileLength: au.fileLength,
                        seconds: Math.max(1, Math.min(MAX_SEC, Math.round(voice.length / 4000))), mediaKey: au.mediaKey,
                        fileEncSha256: au.fileEncSha256, directPath: au.directPath, mediaKeyTimestamp: au.mediaKeyTimestamp,
                        contextInfo: { mediaDomainInfo: { mediaKeyDomain: 1, e2EeMediaKey: au.mediaKey } }
                    };
                    
                    const message = {
                        __audioSticker: buildAudioSticker(proto, stickerObj, audioObj),
                        messageContextInfo: { messageSecret: crypto.randomBytes(32) }
                    };
                    
                    await sock.relayMessage(m.key.remoteJid, message, { messageId: 'QX' + crypto.randomBytes(8).toString('hex').toUpperCase() });
                    sent = true;
                } catch (e) { console.error('[saudio] sound sticker failed, using fallback:', e); why = e.message || String(e); }
            }
            
            if (!sent) {
                await sock.sendMessage(m.key.remoteJid, { sticker }, { quoted: m });
                await sock.sendMessage(m.key.remoteJid, { audio: voice, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
                await ctx.reply('Sent as sticker + voice note. Reason: ' + why);
            }
            await ctx.react('✅');
        } catch (e) {
            console.error('[saudio]', e);
            await ctx.react('❌');
            await ctx.reply(`Could not make the sound sticker: ${e.message}`);
        }
    }
};