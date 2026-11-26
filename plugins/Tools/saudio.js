import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { getPrefix } from '../../lib/config.js';
import { ffmpegBin, toOpusVoice } from '../../lib/audioConvert.js';
import { selfTest, buildAudioSticker } from '../../lib/audioSticker.js';
import { setAwait } from '../../lib/awaits.js';
import { extractRawId } from '../../lib/utils.js';
import crypto from 'crypto';

const MAX_SEC = 6;
const MAX_BYTES = 900 * 1024;

const tmp = (ext) => path.join(os.tmpdir(), `saudio_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
const rm = (...f) => f.forEach(x => { try { fs.unlinkSync(x); } catch { } });

function ff(args) { /*... keep same ...*/ }
function findMedia(message) { /*... keep same ...*/ }
async function download(found) { /*... keep same ...*/ }
async function toWebp(buf, type) { /*... keep same ...*/ }
async function addExif(webpBuf, pack, author) { /*... keep same ...*/ }

async function processAndSend(sock, m, ctx, stickerBuffer, audioSource) {
    // ... keep same ...
}

export default {
    command: 'saudio',
    // ...

    async execute(sock, m, args, ctx) {
        // ... (Keep Step 1 logic, but change how we save the await state) ...
        
        const prefix = getPrefix();
        const jid = m.key.remoteJid;
        const url = args.find(a => /^https?:\/\//i.test(a));
        const found = findMedia(m.message);
        const senderId = extractRawId(m.key.participant || m.key.remoteJid);

        // If they provided a link directly, do it in one step
        if (url && found) {
             // ... keep one-step logic ...
             return;
        }

        if (found && (found.type === 'sticker' || found.type === 'image' || found.type === 'video')) {
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

                // ─── USE THE GLOBAL AWAIT SYSTEM ───
                setAwait(jid, senderId, 'saudio', { stickerBuffer: stickerBuf });

                await ctx.reply(`✅ *Sticker Saved!*\n\nNow, **reply to this message** with:\n1. An *audio file* / *voice note*\n2. Or an *audio link* (e.g., \`${prefix}saudio https://...\`)\n\n⏱️ *Note:* This sticker will expire in *5 minutes* if no audio is provided.`);
                await ctx.react('✅');
            } catch (e) {
                await ctx.react('❌');
                await ctx.reply(`❌ Failed to save sticker: ${e.message}`);
            }
        } else {
            return ctx.reply(`❌ Please reply to a sticker/image/video, or provide a link.`);
        }
    },

    // ─── THE NEW GLOBAL HANDLER ───
    async onReply(sock, m, ctx, data) {
        const jid = m.key.remoteJid;
        const url = ctx.text.match(/https?:\/\/[^\s]+/i)?.[0];
        const foundAudio = findMedia(m.message);

        // If they sent an audio file or voice note
        if (!url && foundAudio && foundAudio.type === 'audio') {
            await ctx.react('⏳');
            try {
                const audioSource = await download(foundAudio);
                await processAndSend(sock, m, ctx, data.stickerBuffer, audioSource);
                await ctx.react('✅');
            } catch (e) {
                await ctx.react('❌');
                await ctx.reply(`❌ Failed: ${e.message}`);
            }
            return;
        }

        // If they sent a link
        if (url) {
            await ctx.react('⏳');
            try {
                const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                await processAndSend(sock, m, ctx, data.stickerBuffer, Buffer.from(r.data));
                await ctx.react('✅');
            } catch (e) {
                await ctx.react('❌');
                await ctx.reply(`❌ Failed: ${e.message}`);
            }
            return;
        }

        await ctx.reply(`⏳ Please reply with an *audio file*, *voice note*, or an *audio link* to finish the sticker.`);
    }
};