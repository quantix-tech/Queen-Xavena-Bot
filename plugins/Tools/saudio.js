/**
 * Sound Sticker - @itsliaaa/baileys
 * Flow:
 *  1. Reply sticker + .saudio -> saves sticker
 *  2. Reply audio + .saudio -> combines + sends
 * Loader: command (string) + execute(sock, m, args, ctx)
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { exec } from 'child_process'
import {
  downloadContentFromMessage,
  downloadMediaMessage,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  extractImageThumb
} from '@itsliaaa/baileys'
import { writeExifImg, writeExifVid, addExif } from '../../src/lib/webp.js'

const pending = new Map()

function checkIsAnimatedWebp(buffer) {
  if (!buffer || buffer.length < 30) return false
  try {
    if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
      if (buffer.subarray(12, 16).toString() === 'VP8X' && (buffer[20] & 0x02)) return true
      if (buffer.indexOf('ANIM') !== -1) return true
    }
  } catch {}
  return false
}

async function compressAnimatedWebp(buffer, maxSize = 950 * 1024) {
  if (!buffer || buffer.length <= maxSize) return buffer
  const tmp = os.tmpdir()
  const t = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
  const inPath = path.join(tmp, `in_anim_${t}.webp`)
  const outPath = path.join(tmp, `out_anim_${t}.webp`)
  try {
    await fs.promises.writeFile(inPath, buffer)
    await new Promise((res, rej) => exec(`ffmpeg -y -i "${inPath}" -vf "scale=384:384:force_original_aspect_ratio=decrease,fps=10,pad=384:384:-1:-1:color=white@0.0" -vcodec libwebp -loop 0 -ss 00:00:00 -t 00:00:03 -preset default -quality 40 -an -vsync 0 "${outPath}"`, { timeout: 30000 }, e => e ? rej(e) : res()))
    if (fs.existsSync(outPath)) {
      const r = await fs.promises.readFile(outPath)
      if (r?.length) return r
    }
  } catch (e) { console.error('[SAUDIO COMPRESS]', e.message) }
  finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath) } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath) } catch {}
  }
  return buffer
}

const toOpus = async (buffer) => {
  const tmp = os.tmpdir()
  const t = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
  const inPath = path.join(tmp, `in_${t}.audio`)
  const outPath = path.join(tmp, `out_${t}.ogg`)
  try {
    await fs.promises.writeFile(inPath, buffer)
    await new Promise((res, rej) => exec(`ffmpeg -y -i "${inPath}" -vn -c:a libopus -b:a 64k -vbr on -compression_level 10 -ar 48000 -ac 1 "${outPath}"`, { timeout: 30000 }, e => e ? rej(e) : res()))
    if (fs.existsSync(outPath)) return await fs.promises.readFile(outPath)
  } catch (e) { console.error('[SAUDIO OPUS]', e.message) }
  finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath) } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath) } catch {}
  }
  return buffer
}

// Build a real Baileys message object from quoted contextInfo so downloadMediaMessage works
function getQuotedMsg(m) {
  const ctxInfo = m.message?.extendedTextMessage?.contextInfo || m.message?.imageMessage?.contextInfo || m.message?.videoMessage?.contextInfo || m.message?.audioMessage?.contextInfo || m.message?.stickerMessage?.contextInfo
  if (!ctxInfo?.quotedMessage) return null
  return {
    key: {
      remoteJid: m.key.remoteJid,
      id: ctxInfo.stanzaId,
      participant: ctxInfo.participant,
      fromMe: false
    },
    message: ctxInfo.quotedMessage
  }
}

function getMsgType(msgObj) {
  if (!msgObj?.message) return ''
  return Object.keys(msgObj.message)[0] || ''
}

async function getBuffer(sock, msgObj) {
  if (!msgObj) return null
  try {
    const buf = await downloadMediaMessage(msgObj, 'buffer', {}, { reuploadRequest: sock?.updateMediaMessage })
    if (buf?.length) return buf
  } catch {}
  try {
    const type = getMsgType(msgObj).replace('Message', '').toLowerCase()
    const inner = msgObj.message?.[getMsgType(msgObj)]
    if (inner?.mediaKey) {
      const stream = await downloadContentFromMessage(inner, type)
      const chunks = []
      for await (const chunk of stream) chunks.push(chunk)
      const buf = Buffer.concat(chunks)
      if (buf?.length) return buf
    }
  } catch {}
  return null
}

async function buildSoundSticker(sock, m, stickerBuffer, audioBuffer, mime, isAnimatedFlag) {
  let webp = null
  let isAnimated = Boolean(isAnimatedFlag)
  let tmpPath = null

  if (/video/.test(mime)) {
    isAnimated = true
    const res = await writeExifVid(stickerBuffer, { packname: global.packname || 'Sound Sticker', author: global.author || 'Kaizen' }).catch(() => null)
    if (Buffer.isBuffer(res)) webp = res
    else if (typeof res === 'string' && fs.existsSync(res)) { tmpPath = res; webp = fs.readFileSync(res) }
  } else if (/image/.test(mime) && !/webp/.test(mime)) {
    const res = await writeExifImg(stickerBuffer, { packname: global.packname || 'Sound Sticker', author: global.author || 'Kaizen' }).catch(() => null)
    if (Buffer.isBuffer(res)) webp = res
    else if (typeof res === 'string' && fs.existsSync(res)) { tmpPath = res; webp = fs.readFileSync(res) }
  } else {
    isAnimated = isAnimated || checkIsAnimatedWebp(stickerBuffer)
    webp = await addExif(stickerBuffer, global.packname || 'Sound Sticker', global.author || 'Kaizen').catch(() => stickerBuffer)
  }

  if (!webp) throw new Error('Failed to process sticker!')
  if (!isAnimated) isAnimated = checkIsAnimatedWebp(webp)
  if (isAnimated && webp.length > 900 * 1024) {
    webp = await compressAnimatedWebp(webp, 900 * 1024)
    webp = await addExif(webp, global.packname || 'Sound Sticker', global.author || 'Kaizen').catch(() => webp)
  }

  const opus = await toOpus(audioBuffer)
  const [sMedia, aMedia] = await Promise.all([
    prepareWAMessageMedia({ sticker: webp }, { upload: sock.waUploadToServer }),
    prepareWAMessageMedia({ audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { upload: sock.waUploadToServer })
  ])

  const sMsg = sMedia.stickerMessage
  const aMsg = aMedia.audioMessage
  if (!sMsg) throw new Error('Failed to upload sticker!')

  if (isAnimated) {
    sMsg.isAnimated = true
    try {
      const thumb = await extractImageThumb(webp, 64)
      if (thumb?.buffer) sMsg.pngThumbnail = thumb.buffer
    } catch {}
  }
  sMsg.stickerSentTs = Date.now()
  if (aMsg) {
    aMsg.mimetype = 'audio/ogg; codecs=opus'
    aMsg.ptt = true
    sMsg.audioMessage = aMsg
  }

  const msg = generateWAMessageFromContent(m.key.remoteJid, { stickerMessage: sMsg }, { quoted: m, userJid: sock.user.id })
  await sock.relayMessage(m.key.remoteJid, msg.message, { messageId: msg.key.id })
  if (tmpPath && fs.existsSync(tmpPath)) { try { fs.unlinkSync(tmpPath) } catch {} }
}

export default {
  command: 'saudio',
  aliases: ['soundsticker'],
  category: 'Convert',
  description: 'Combine sticker + audio into sound sticker',
  usage: '.saudio (reply sticker, then reply audio with .saudio)',

  // YOUR index.js calls: plugin.execute(sock, m, args, ctx)
  async execute(sock, m, args, ctx) {
    const reply = ctx?.reply || (async (text) => await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m }))
    const prefix = ctx?.prefix || '.'
    const sender = m.key.participant || m.key.remoteJid
    const key = `${m.key.remoteJid}:${sender}`

    const quotedMsg = getQuotedMsg(m)
    // Target = quoted if exists, else m itself
    const targetMsg = quotedMsg || m
    const targetType = getMsgType(targetMsg) // e.g. stickerMessage, audioMessage
    const targetInner = targetMsg.message?.[targetType] || {}
    const mime = (targetInner.mimetype || '').toLowerCase()

    const isStickerLike = /sticker|image|video/.test(targetType)
    const isAudioLike = /audio|ptt/.test(targetType)

    // STEP 2: Reply to AUDIO with .saudio, and we have saved sticker
    if (isAudioLike && pending.has(key)) {
      const saved = pending.get(key)
      pending.delete(key)
      await reply('⏳ *Combining sticker + audio...* Please wait! 💖')
      try {
        const audioBuf = await getBuffer(sock, targetMsg)
        if (!audioBuf?.length) return reply('❌ Failed to download audio! Try again.')
        await buildSoundSticker(sock, m, saved.buffer, audioBuf, saved.mime, saved.isAnimated)
      } catch (e) {
        console.error('[SAUDIO]', e)
        await reply(`⚠️ Error: ${e.message || 'Something went wrong'}`)
      }
      return
    }

    // STEP 1: Reply to STICKER with .saudio
    if (!isStickerLike) {
      return reply(
        `🔊 *SOUND STICKER MAKER*\n\n` +
        `*How to use:*\n` +
        `1. Reply to sticker / image / video\n` +
        `   Type \`${prefix}saudio\`\n` +
        `2. Then reply to audio / voice note\n` +
        `   Type \`${prefix}saudio\` again\n\n` +
        `Bot will combine both and send the sound sticker.`
      )
    }

    await reply('⏳ *Saving your sticker...* Now reply to the audio with `.saudio` again! 🎵')
    try {
      const buf = await getBuffer(sock, targetMsg)
      if (!buf?.length) return reply('❌ Failed to download sticker! Media may have expired.')
      pending.set(key, { buffer: buf, mime, isAnimated: Boolean(targetInner.isAnimated) })
      setTimeout(() => pending.delete(key), 2 * 60 * 1000)
      await reply('✅ *Sticker saved!*\nNow reply to the audio with `.saudio` to combine it.')
    } catch (e) {
      console.error('[SAUDIO SAVE]', e)
      await reply(`⚠️ Error: ${e.message || 'Something went wrong'}`)
    }
  }
}