import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName, getPrefix } from '../../lib/config.js';
import {
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

// Convert audio buffer -> opus ogg via ffmpeg (wa-sticker-formatter can't do audio)
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const toOpus = async (buffer) => {
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

async function buildSoundSticker(sock, m, stickerWebp, audioBuffer) {
  const opus = await toOpus(audioBuffer);

  const [sMedia, aMedia] = await Promise.all([
    prepareWAMessageMedia({ sticker: stickerWebp }, { upload: sock.waUploadToServer }),
    prepareWAMessageMedia({ audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { upload: sock.waUploadToServer })
  ]);

  const sMsg = sMedia.stickerMessage;
  const aMsg = aMedia.audioMessage;
  if (!sMsg) throw new Error('Failed to upload sticker!');

  const isAnimated = checkIsAnimatedWebp(stickerWebp);
  if (isAnimated) {
    sMsg.isAnimated = true;
    try {
      const thumb = await extractImageThumb(stickerWebp, 64);
      if (thumb?.buffer) sMsg.pngThumbnail = thumb.buffer;
    } catch {}
  }
  sMsg.stickerSentTs = Date.now();
  if (aMsg) {
    aMsg.mimetype = 'audio/ogg; codecs=opus';
    aMsg.ptt = true;
    sMsg.audioMessage = aMsg;
  }

  const msg = generateWAMessageFromContent(m.key.remoteJid, { stickerMessage: sMsg }, { quoted: m, userJid: sock.user.id });
  await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id });
}

export default {
  command: 'saudio',
  aliases: ['soundsticker'],
  description: 'Combine sticker + audio into sound sticker',
  category: 'Sticker',
  ownerOnly: false,
  usage: 'saudio (reply sticker, then reply audio with .saudio)',

  async execute(sock, m, args, ctx) {
    await ctx.react('⏳');
    const prefix = getPrefix();
    const sender = m.key.participant || m.key.remoteJid;
    const key = `${m.key.remoteJid}:${sender}`;

    // ctx.getMedia() in your bot handles quoted media
    const media = await ctx.getMedia();

    // No media at all -> show help
    if (!media) {
      await ctx.react('❌');
      return ctx.reply(
        `🔊 *SOUND STICKER MAKER*\n\n` +
        `*How to use:*\n` +
        `1. Reply to sticker / image / video\n` +
        `   Type \`${prefix}saudio\`\n` +
        `2. Then reply to audio / voice note\n` +
        `   Type \`${prefix}saudio\` again\n\n` +
        `Bot will combine both and send the sound sticker.`
      );
    }

    // STEP 2: It's audio + we have saved sticker
    const isAudio = media.isAudio || media.isVoice || /audio|voice|ptt|ogg|opus/.test(media.mimetype || '') || media.type === 'audio';
    if (isAudio && pending.has(key)) {
      const saved = pending.get(key);
      pending.delete(key);
      try {
        await buildSoundSticker(sock, m, saved.webp, media.buffer);
        await ctx.react('✅');
      } catch (err) {
        console.error('Saudio error:', err);
        await ctx.react('❌');
        await ctx.reply(`❌ Failed to combine.\n_Error: ${err.message}_`);
      }
      return;
    }

    // STEP 1: It's sticker / image / video -> save it
    const isStickerLike = media.isSticker || media.isImage || media.isVideo;
    if (!isStickerLike) {
      await ctx.react('❌');
      return ctx.reply('❌ Reply to a sticker, image, video, or audio.');
    }

    try {
      let webp;
      // Already a sticker -> use as-is, keep animation + exif
      if (media.isSticker) {
        webp = media.buffer;
      } else {
        // Image / Video -> same as your sticker plugin
        const sticker = new Sticker(media.buffer, {
          pack: getBotName(),
          author: 'Lord Xaven',
          type: media.isVideo ? StickerTypes.FULL : StickerTypes.FULL,
          quality: 70,
          background: '#00000000'
        });
        webp = await sticker.toBuffer();
      }

      pending.set(key, { webp, at: Date.now() });
      setTimeout(() => pending.delete(key), 2 * 60 * 1000);

      await ctx.react('✅');
      await ctx.reply('✅ *Sticker saved!*\nNow reply to the audio with `.saudio` to combine it.');
    } catch (err) {
      console.error('Saudio save error:', err);
      await ctx.react('❌');
      await ctx.reply(`❌ Failed to save sticker.\n_Error: ${err.message}_`);
    }
  }
};