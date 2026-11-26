import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { getPrefix } from '../../lib/config.js';
import { ffmpegBin, toOpusVoice } from '../../lib/audioConvert.js';
import { selfTest, buildAudioSticker } from '../../lib/audioSticker.js';
import { extractRawId } from '../../lib/utils.js';
import crypto from 'crypto';

const MAX_SEC = 6;
const MAX_BYTES = 900 * 1024;

const pendingStickers = new Map();
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

async function toWebp(buf, type) {
    if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
        throw new Error('Input media buffer is empty or invalid.');
    }

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
        throw new Error('The video is too big for a sticker even after shrinking - try a shorter clip.');
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

async function processAndSend(sock, m, ctx, stickerBuffer, audioSource) {
    let voice;
    try { voice = await toOpusVoice(audioSource, MAX_SEC); }
    catch (e) { throw new Error('Could not convert the audio source. The media might be corrupt.'); }

    const { prepareWAMessageMedia, proto } = await import('@itsliaaa/baileys');
    const canAudioSticker = selfTest(proto);

    let sent = false, why = canAudioSticker ? '' : 'The encoder patch could not be installed.';
    
    if (canAudioSticker) {
        try {
            const [sm, am] = await Promise.all([
                prepareWAMessageMedia({ sticker: stickerBuffer }, { upload: sock.waUploadToServer, mediaTypeOverride: 'sticker' }),
                prepareWAMessageMedia({ audio: voice, mimetype: 'audio/ogg; codecs=opus' }, { upload: sock.waUploadToServer, mediaTypeOverride: 'audio' })
            ]);
            const st = sm.stickerMessage, au = am.audioMessage;
            if (!st?.url || !au?.url) throw new Error('Upload to WhatsApp failed.');
            
            const stickerObj = {
                url: st.url, fileSha256: st.fileSha256, fileEncSha256: st.fileEncSha256, mediaKey: st.mediaKey,
                mimetype: 'image/webp', directPath: st.directPath, mediaKeyTimestamp: st.mediaKeyTimestamp,
                height: 512, width: 512, fileLength: st.fileLength, isAnimated: true,
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
        } catch (e) { console.error('[saudio] proto failed:', e); why = e.message; }
    }
    
    if (!sent) {
        await sock.sendMessage(m.key.remoteJid, { sticker: stickerBuffer }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { audio: voice, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
        await ctx.reply('⚠️ Sound sticker proto failed. Sent as separate sticker + audio. Reason: ' + why);
    }
}

export default {
    command: 'saudio',
    aliases: ['soundsticker', 'stickeraudio', 'stikersuara', 'audiosticker'],
    description: 'Turn media into a sticker that plays sound',
    category: 'Tools',
    ownerOnly: false,
    usage: 'saudio (reply to media/audio)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const jid = m.key.remoteJid;
        const senderId = extractRawId(m.key.participant || m.key.remoteJid);
        const url = args.find(a => /^https?:\/\//i.test(a));
        
        // Check if this user is in the "waiting for audio" step
        const pending = pendingStickers.get(jid);
        if (pending && pending.userId === senderId) {
            const isAudio = m.message?.audioMessage || ctx.quoted?.type === 'audioMessage' || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;
            
            if (!url && !isAudio) {
                return ctx.reply(`⏳ Please reply to an *audio file*, *voice note*, or provide an *audio link* along with \`${prefix}saudio\`.`);
            }

            await ctx.react('⏳');
            try {
                let audioSource;
                if (url) {
                    const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000, maxContentLength: 15 * 1024 * 1024, headers: { 'User-Agent': 'Mozilla/5.0' } });
                    audioSource = Buffer.from(r.data);
                } else {
                    const media = await ctx.getMedia();
                    if (!media || !media.buffer) throw new Error('Could not download the audio.');
                    audioSource = media.buffer;
                }

                await processAndSend(sock, m, ctx, pending.stickerBuffer, audioSource);
                pendingStickers.delete(jid);
                await ctx.react('✅');
            } catch (e) {
                console.error('[saudio step 2]', e);
                await ctx.react('❌');
                await ctx.reply(`❌ Failed: ${e.message}`);
            }
            return;
        }

        // ─── STEP 1: INITIAL COMMAND ───
        let stickerBuffer = null;
        let videoBuffer = null;
        let typeFound = null;

        if (ctx.quoted) {
            const mime = ctx.quoted.message?.videoMessage?.mimetype || ctx.quoted.message?.stickerMessage?.mimetype || ctx.quoted.type;
            
            if (ctx.quoted.type === 'videoMessage' || mime?.includes('video')) typeFound = 'video';
            else if (ctx.quoted.type === 'imageMessage' || mime?.includes('image')) typeFound = 'image';
            else if (ctx.quoted.type === 'stickerMessage' || mime?.includes('webp')) typeFound = 'sticker';
            
            if (typeFound) {
                const media = await ctx.getMedia();
                
                // 🛑 FIX: SAFEGUARD AGAINST EMPTY BUFFERS 🛑
                if (!media || !media.buffer || media.buffer.length === 0) {
                    return ctx.reply('❌ Failed to download the media. WhatsApp may have expired the file. Try sending it again and replying instantly.');
                }

                if (typeFound === 'video') {
                    videoBuffer = media.buffer;
                    try { stickerBuffer = await toWebp(media.buffer, 'video'); } catch(e) { return ctx.reply(`❌ Video Conversion failed: ${e.message}`); }
                } else if (typeFound === 'sticker') {
                    stickerBuffer = media.buffer;
                } else {
                    try { stickerBuffer = await toWebp(media.buffer, 'image'); } catch(e) { return ctx.reply(`❌ Image Conversion failed: ${e.message}`); }
                }
                try { stickerBuffer = await addExif(stickerBuffer, 'Queen Xavena', 'Sound Sticker'); } catch (e) {}
            }
        }

        if (!stickerBuffer) {
            return ctx.reply(`*SOUND STICKER*\n\n• Reply to a *video/GIF/Sticker/Photo* with \`${prefix}saudio\`\n   -> Bot will save it.\n\n• Or reply with \`${prefix}saudio <audio link>\`\n   -> Bot will merge immediately.`);
        }

        // If it's a video, we just use the video's own audio!
        if (typeFound === 'video') {
            await ctx.react('⏳');
            try {
                await processAndSend(sock, m, ctx, stickerBuffer, videoBuffer);
                await ctx.react('✅');
            } catch (e) {
                console.error('[saudio video]', e);
                await ctx.react('❌');
                await ctx.reply(`❌ Failed: ${e.message}`);
            }
            return;
        }

        // If they provided an audio link directly, do it in one step
        if (url) {
            await ctx.react('⏳');
            try {
                const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000, maxContentLength: 15 * 1024 * 1024, headers: { 'User-Agent': 'Mozilla/5.0' } });
                await processAndSend(sock, m, ctx, stickerBuffer, Buffer.from(r.data));
                await ctx.react('✅');
            } catch (e) {
                console.error('[saudio single step]', e);
                await ctx.react('❌');
                await ctx.reply(`❌ Failed: ${e.message}`);
            }
            return;
        }

        // Save for 2-step process (Only for Stickers and Images)
        await ctx.react('⏳');
        try {
            pendingStickers.set(jid, { userId: senderId, stickerBuffer });
            setTimeout(() => { if (pendingStickers.has(jid)) pendingStickers.delete(jid); }, 5 * 60 * 1000);

            await ctx.reply(`✅ *Sticker/Image Saved!*\n\nNow, **reply to an audio/voice note** with \`${prefix}saudio\`, or send \`${prefix}saudio <audio link>\`.\n\n⏱️ *Note:* This will expire in *5 minutes* if no audio is provided.`);
            await ctx.react('✅');
        } catch (e) {
            console.error('[saudio step 1]', e);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to save sticker: ${e.message}`);
        }
    }
};