import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName, getPrefix } from '../../lib/config.js';
import {
  downloadMediaMessage,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  extractImageThumb
} from '@itsliaaa/baileys';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

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

// Get quoted message the way Baileys actually stores it
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
  if (!q?.message) return '';
  return Object.keys(q.message)[0] || '';
}

const toOpus = async (buffer) => {
  const tmp = os.tmpdir();
  const t = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const inPath = path.join(tmp, `in_${t}.audio`);
  const outPath = path.join(tmp, `out_${t}.ogg`);
  try {
    await fs.promises.writeFile(inPath, buffer);
    await new Promise((res, rej) => exec(`ffmpeg -y -i "${inPath}" -vn -c:a libopus -b:a 64k -vbr on -compression_level 10 -ar 48000 -ac 1 "${outPath}"`, { timeout: 30000 }, e => e ? rej(e) : res()));
    if (fs.existsSync(outPath)) {
      const out = await fs.promises.readFile(outPath);
      if (out?.length) return out;
    }
  } catch (e) { console.error('[SAUDIO OPUS]', e.message); }
  finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
  }
  throw new Error('ffmpeg failed to convert audio to opus');
};

async function buildSoundSticker(sock, m, stickerWebp, audioBuffer) {
  console.log('[SAUDIO] sticker bytes:', stickerWebp?.length, 'audio bytes:', audioBuffer?.length);
  const opus = await toOpus(audioBuffer);
  console.log('[SAUDIO] opus bytes:', opus?.length);

  const [sMedia, aMedia] = await Promise.all([
    prepareWAMessageMedia({ sticker: stickerWebp }, { upload: sock.waUploadToServer }),
    prepareWAMessageMedia({ audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { upload: sock.waUploadToServer })
  ]);

  const sMsg = sMedia.stickerMessage;
  const aMsg = aMedia.audioMessage;
  if (!sMsg) throw new Error('Failed to upload sticker!');
  if (!aMsg) throw new Error('Failed to upload audio!');

  if (checkIsAnimatedWebp(stickerWebp)) {
    sMsg.isAnimated = true;
    try {
      const thumb = await extractImageThumb(stickerWebp, 64);
      if (thumb?.buffer) sMsg.pngThumbnail = thumb.buffer;
    } catch {}
  }
  sMsg.stickerSentTs = Date.now();
  // THIS is the actual sound-sticker field - whole audioMessage object
  sMsg.audioMessage = aMsg;

  const msg = generateWAMessageFromContent(m.key.remoteJid, { stickerMessage: sMsg }, { quoted: m, userJid: sock.user.id });
  await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
}

export default {
  command: 'saudio',
  aliases: ['soundsticker'],
  description: 'Combine sticker + audio into sound sticker',
  category: 'Sticker',
  ownerOnly: false,
  usage: 'saudio (reply sticker, then reply audio)',

  async execute(sock, m, args, ctx) {
    const prefix = getPrefix();
    const sender = m.key.participant || m.key.remoteJid;
    const key = `${m.key.remoteJid}:${sender}`;
    const quotedType = getQuotedType(m); // e.g. stickerMessage, audioMessage, voice?
    const quoted = getQuoted(m);

    // STEP 2: quoted is audio / voice note + we have a saved sticker
    const isAudioQuoted = /audio|ptt/.test(quotedType);
    if (isAudioQuoted && pending.has(key)) {
      const saved = pending.get(key);
      pending.delete(key);
      try {
        const audioBuf = await downloadMediaMessage(quoted, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        if (!audioBuf?.length) return ctx.reply('Failed to download audio. Try again.');
        await buildSoundSticker(sock, m, saved.webp, audioBuf);
      } catch (err) {
        console.error('Saudio error:', err);
        await ctx.reply(`Failed to combine.\nError: ${err.message}`);
      }
      return;
    }

    // STEP 1: quoted is sticker / image / video -> save it
    // Use ctx.getMedia() exactly like your sticker.js does - it handles quoted image/video/sticker
    const media = await ctx.getMedia();
    if (!media) {
      return ctx.reply(
        `*SOUND STICKER MAKER*\n\n` +
        `How to use:\n` +
        `1. Reply to sticker / image / video\n` +
        `   Type \`${prefix}saudio\`\n` +
        `2. Then reply to audio / voice note\n` +
        `   Type \`${prefix}saudio\` again\n\n` +
        `Bot will combine both and send the sound sticker.`
      );
    }

    if (!media.isSticker && !media.isImage && !media.isVideo) {
      return ctx.reply('Reply to a sticker, image, video, or audio.');
    }

    try {
      let webp;
      if (media.isSticker) {
        webp = media.buffer;
      } else {
        const sticker = new Sticker(media.buffer, {
          pack: getBotName(),
          author: 'Lord Xaven',
          type: StickerTypes.FULL,
          quality: 70,
          background: '#00000000'
        });
        webp = await sticker.toBuffer();
      }

      pending.set(key, { webp });
      setTimeout(() => pending.delete(key), 2 * 60 * 1000);

      await ctx.reply(`*Sticker saved!*\nNow reply to the audio with \`${prefix}saudio\` to combine it.`);
    } catch (err) {
      console.error('Saudio save error:', err);
      await ctx.reply(`Failed to save sticker.\nError: ${err.message}`);
    }
  }
};