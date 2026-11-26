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

// Memory to hold the sticker waiting for its audio
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

function findMedia(message) {
    const unwrap = (m) => m?.ephemeralMessage?.message || m?.viewOnceMessageV2?.message || m?.viewOnceMessage?.message || m;
    const pick = (m) => {
        m = unwrap(m);
        if (!m) return null;
        if (m.videoMessage) return { node: m.videoMessage, type: 'video' };
        if (m.imageMessage) return { node: m.imageMessage, type: 'image' };
        if (m.stickerMessage) return { node: m.stickerMessage, type: 'sticker' };
        if (m.audioMessage) return { node: m.audioMessage, type: 'audio' };
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

async function processAndSend(sock, m, ctx, stickerBuffer, audioSource) {
    let voice;
    try { voice = await toOpusVoice(audioSource, MAX_SEC); }
    catch (e) { throw new Error('Could not read the provided audio source.'); }

    const { prepareWAMessageMedia, proto } = await import('@itsliaaa/baileys');
    const canAudioSticker = selfTest(proto);

    let sent = false, why = canAudioSticker ? '' : 'the encoder patch could not be installed';
    
    if (canAudioSticker) {
        try {
            const [sm, am] = await Promise.all([
                prepareWAMessageMedia({ sticker: stickerBuffer }, { upload: sock.waUploadToServer, mediaTypeOverride: 'sticker' }),
                prepareWAMessageMedia({ audio: voice, mimetype: 'audio/ogg; codecs=opus' }, { upload: sock.waUploadToServer, mediaTypeOverride: 'audio' })
            ]);
            const st = sm.stickerMessage, au = am.audioMessage;
            if (!st?.url || !au?.url) throw new Error('upload failed');
            
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
        const url = args.find(a => /^https?:\/\//i.test(a));
        
        // ─── STEP 2: USER REPLIED WITH AUDIO OR LINK ───
        // Check if there's a pending sticker for this user in this chat
        const pending = pendingStickers.get(jid);
        if (pending && pending.userId === m.key.participant) {
            const foundAudio = findMedia(m.message);
            
            if (!url && (!foundAudio || foundAudio.type !== 'audio')) {
                return ctx.reply(`⏳ Please reply with an *audio file*, *voice note*, or an *audio link* to finish the sticker.`);
            }

            await ctx.react('⏳');
            try {
                let audioSource;
                if (url) {
                    const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000, maxContentLength: 15 * 1024 * 1024, headers: { 'User-Agent': 'Mozilla/5.0' } });
                    audioSource = Buffer.from(r.data);
                } else {
                    audioSource = await download(foundAudio);
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
        const found = findMedia(m.message);

        if (!found) {
            return ctx.reply(`*SOUND STICKER*\n\n• Reply to a *video/GIF/Sticker/Photo* with \`${prefix}saudio\`\n   -> Bot will save it, then ask for audio.\n\n• Or reply with \`${prefix}saudio <audio link>\`\n   -> Bot will merge immediately.`);
        }

        // If they provided a link directly, do it in one step
        if (url) {
            await ctx.react('⏳');
            try {
                let stickerBuf;
                if (found.type === 'sticker') {
                    stickerBuf = await download(found);
                } else {
                    const raw = await download(found);
                    stickerBuf = await toWebp(raw, found.type);
                }
                try { stickerBuf = await addExif(stickerBuf, 'Queen Xavena', 'Sound Sticker'); } catch (e) {}

                const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000, maxContentLength: 15 * 1024 * 1024, headers: { 'User-Agent': 'Mozilla/5.0' } });
                await processAndSend(sock, m, ctx, stickerBuf, Buffer.from(r.data));
                await ctx.react('✅');
            } catch (e) {
                console.error('[saudio single step]', e);
                await ctx.react('❌');
                await ctx.reply(`❌ Failed: ${e.message}`);
            }
            return;
        }

        // If it's a sticker (and no URL provided), start the two-step process
        if (found.type === 'sticker' || found.type === 'image' || found.type === 'video') {
            await ctx.react('⏳');
            try {
                let stickerBuf;
                if (found.type === 'sticker') {
                    stickerBuf = await download(found);
                } else {
                    const raw = await download(found);
                    stickerBuf = await toWebp(raw, found.type);
                }
                try { stickerBuf = await addExif(stickerBuf, 'Queen Xavena', 'Sound Sticker'); } catch (e) {}

                // Save to memory
                pendingStickers.set(jid, {
                    userId: m.key.participant || m.key.remoteJid,
                    stickerBuffer: stickerBuf
                });

                // Auto-expire after 5 minutes
                setTimeout(() => { if (pendingStickers.has(jid)) pendingStickers.delete(jid); }, 5 * 60 * 1000);

                await ctx.reply(`✅ *Sticker Saved!*\n\nNow, **reply to this message** with:\n1. An *audio file* / *voice note*\n2. Or an *audio link* (e.g., \`${prefix}saudio https://...\`)\n\n_I will merge them and send the sound sticker._`);
                await ctx.react('✅');
            } catch (e) {
                console.error('[saudio step 1]', e);
                await ctx.react('❌');
                await ctx.reply(`❌ Failed to save sticker: ${e.message}`);
            }
        } else {
            return ctx.reply(`❌ A ${found.type} has no sound of its own. Please reply to a sticker/image/video and provide an audio link.`);
        }
    }
};