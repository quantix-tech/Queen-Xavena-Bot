import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import axios from 'axios';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName, getPrefix } from '../../lib/config.js';
import {
  downloadMediaMessage,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  extractImageThumb
} from '@itsliaaa/baileys';

const pending = new Map();

function checkIsAnimatedWebp(buffer) {
  if (!buffer || buffer.length < 30) return false;
  try {
    if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
      if (buffer.subarray(12, 16).toString() === 'VP8X' && (buffer[20] & 0x02)) return true;
      if (buffer.indexOf('ANIM') !== -1) return true;
    }
  } catch {}
  return false;
}

async function compressAnimatedWebp(buffer, maxSize = 950 * 1024) {
  if (!buffer || buffer.length <= maxSize) return buffer;
  const tmp = os.tmpdir();
  const t = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const inPath = path.join(tmp, `in_anim_${t}.webp`);
  const outPath = path.join(tmp, `out_anim_${t}.webp`);
  try {
    await fs.promises.writeFile(inPath, buffer);
    await new Promise((res, rej) => exec(`ffmpeg -y -i "${inPath}" -vf "scale=384:384:force_original_aspect_ratio=decrease,fps=10,pad=384:384:-1:-1:color=white@0.0" -vcodec libwebp -loop 0 -ss 00:00:00 -t 00:00:03 -preset default -quality 40 -an -vsync 0 "${outPath}"`, { timeout: 30000 }, e => e ? rej(e) : res()));
    if (fs.existsSync(outPath)) {
      const r = await fs.promises.readFile(outPath);
      if (r?.length) return r;
    }
  } catch (e) { console.error('[SAUDIO COMPRESS]', e.message); }
  finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
  }
  return buffer;
}

const convertAudioToOpusVN = async (buffer) => {
  const tmp = os.tmpdir();
  const t = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const inPath = path.join(tmp, `in_${t}.audio`);
  const outPath = path.join(tmp, `out_${t}.ogg`);
  try {
    await fs.promises.writeFile(inPath, buffer);
    await new Promise((res, rej) => exec(`ffmpeg -y -i "${inPath}" -vn -c:a libopus -b:a 64k -vbr on -compression_level 10 -ar 48000 -ac 1 "${outPath}"`, { timeout: 30000 }, e => e ? rej(e) : res()));
    if (fs.existsSync(outPath)) return await fs.promises.readFile(outPath);
  } catch (e) { console.error('[SAUDIO OPUS]', e.message); }
  finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
  }
  return buffer;
};

function getQuoted(m) {
  const info = m.message?.extendedTextMessage?.contextInfo;
  if (!info?.quotedMessage) return null;
  return {
    key: { remoteJid: m.key.remoteJid, id: info.stanzaId, participant: info.participant, fromMe: false },
    message: info.quotedMessage
  };
}

function getQuotedType(m) {
  const q = getQuoted(m);
  return q?.message ? Object.keys(q.message)[0] || '' : '';
}

async function buildSoundSticker(sock, m, stickerWebpBuffer, rawAudioBuffer, isAnimated) {
  if (!isAnimated) isAnimated = checkIsAnimatedWebp(stickerWebpBuffer);
  if (isAnimated && stickerWebpBuffer.length > 900 * 1024) {
    stickerWebpBuffer = await compressAnimatedWebp(stickerWebpBuffer, 900 * 1024);
  }

  const opusAudioBuffer = await convertAudioToOpusVN(rawAudioBuffer);

  const [stickerMedia, audioMedia] = await Promise.all([
    prepareWAMessageMedia({ sticker: stickerWebpBuffer }, { upload: sock.waUploadToServer }),
    prepareWAMessageMedia({ audio: opusAudioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { upload: sock.waUploadToServer })
  ]);

  const stickerMsg = stickerMedia.stickerMessage;
  const audioMsg = audioMedia.audioMessage;
  if (!stickerMsg) throw new Error('Failed to upload sticker.');

  if (isAnimated) {
    stickerMsg.isAnimated = true;
    try {
      const thumb = await extractImageThumb(stickerWebpBuffer, 64);
      if (thumb?.buffer) stickerMsg.pngThumbnail = thumb.buffer;
    } catch {}
  }
  stickerMsg.stickerSentTs = Date.now();
  if (audioMsg) {
    audioMsg.mimetype = 'audio/ogg; codecs=opus';
    audioMsg.ptt = true;
    stickerMsg.audioMessage = audioMsg;
  }

  const msg = generateWAMessageFromContent(m.key.remoteJid, { stickerMessage: stickerMsg }, { quoted: m, userJid: sock.user.id });
  await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
}

export default {
  command: 'saudio',
  aliases: ['soundsticker', 'stikersuara'],
  description: 'Combine sticker + audio into sound sticker',
  category: 'Sticker',
  ownerOnly: false,
  usage: 'saudio <audio url> (reply sticker) OR saudio (reply audio after saving sticker)',

  async execute(sock, m, args, ctx) {
    const prefix = getPrefix();
    const sender = m.key.participant || m.key.remoteJid;
    const key = `${m.key.remoteJid}:${sender}`;
    const audioUrl = args.join(' ').trim().match(/https?:\/\/[^\s]+/i)?.[0] || null;
    const quotedType = getQuotedType(m);
    const quoted = getQuoted(m);

    // ── MODE 1: Reply sticker + URL (original logic) ──
    if (audioUrl) {
      const media = await ctx.getMedia();
      if (!media || (!media.isSticker && !media.isImage && !media.isVideo)) {
        return ctx.reply('Reply to a sticker, image, or video that you want to add sound to.');
      }
      try {
        let webp, isAnimated = false;
        if (media.isSticker) { webp = media.buffer; isAnimated = checkIsAnimatedWebp(webp); }
        else {
          const s = new Sticker(media.buffer, { pack: getBotName(), author: 'Lord Xaven', type: StickerTypes.FULL, quality: 70, background: '#00000000' });
          webp = await s.toBuffer();
          isAnimated = media.isVideo;
        }
        const res = await axios.get(audioUrl, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 25000 });
        const rawAudio = Buffer.from(res.data);
        if (!rawAudio?.length) return ctx.reply('Failed to download audio from URL.');
        await buildSoundSticker(sock, m, webp, rawAudio, isAnimated);
      } catch (err) {
        console.error('[SAUDIO]', err);
        await ctx.reply(`Error: ${err.message}`);
      }
      return;
    }

    // ── MODE 2: Reply AUDIO + no URL -> use QUOTED AUDIO as the URL buffer ──
    // This is what you meant: quoted audio -> same convert function
    if (/audio|ptt/.test(quotedType) && pending.has(key)) {
      const saved = pending.get(key);
      pending.delete(key);
      try {
        const rawAudio = await downloadMediaMessage(quoted, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        if (!rawAudio?.length) return ctx.reply('Failed to download quoted audio.');
        await buildSoundSticker(sock, m, saved.webp, rawAudio, saved.isAnimated);
      } catch (err) {
        console.error('[SAUDIO]', err);
        await ctx.reply(`Error: ${err.message}`);
      }
      return;
    }

    // ── MODE 3: Reply sticker + no URL -> save sticker, wait for audio ──
    const media = await ctx.getMedia();
    if (media && (media.isSticker || media.isImage || media.isVideo)) {
      try {
        let webp, isAnimated = false;
        if (media.isSticker) { webp = media.buffer; isAnimated = checkIsAnimatedWebp(webp); }
        else {
          const s = new Sticker(media.buffer, { pack: getBotName(), author: 'Lord Xaven', type: StickerTypes.FULL, quality: 70, background: '#00000000' });
          webp = await s.toBuffer();
          isAnimated = media.isVideo;
        }
        pending.set(key, { webp, isAnimated });
        setTimeout(() => pending.delete(key), 2 * 60 * 1000);
        return ctx.reply(`*Sticker saved!*\nNow reply to the audio with \`${prefix}saudio\` to combine it.\nOr reply to a sticker with \`${prefix}saudio <audio url>\``);
      } catch (err) {
        return ctx.reply(`Error: ${err.message}`);
      }
    }

    // No sticker, no audio, no URL = help
    return ctx.reply(
      `*SOUND STICKER MAKER*\n\n` +
      `1. Reply to sticker / image / video:\n` +
      `   \`${prefix}saudio <audio url>\`\n\n` +
      `2. OR reply to sticker with \`${prefix}saudio\`, then reply to audio with \`${prefix}saudio\`\n\n` +
      `Example:\n` +
      `\`${prefix}saudio https://cdn.example.com/sound.mp3\``
    );
  }
};