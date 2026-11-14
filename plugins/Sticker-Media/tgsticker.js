import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'tgsticker',
    aliases: ['tgstickerpack'],
    description: 'Download a Telegram sticker pack and send as WhatsApp packs',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'tgsticker <telegram_pack_link>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const link = args[0];

        if (!link || (!link.includes('t.me/addstickers/') && !link.includes('t.me/addemoji/'))) {
            return ctx.reply(`📦 *Telegram Sticker Pack*\n\nUsage: \`${prefix}tgsticker <link>\`\nExample: \`${prefix}tgsticker https://t.me/addstickers/AnimatedStickers\``);
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            return ctx.reply('❌ *Error:* TELEGRAM_BOT_TOKEN is missing in .env');
        }

        // Extract pack name from link
        const match = link.match(/(?:addstickers|addemoji)\/([a-zA-Z0-9_]+)/);
        if (!match) {
            return ctx.reply('❌ Invalid Telegram sticker pack link.');
        }
        const packName = match[1];

        await ctx.reply(`📦 *Fetching Telegram pack:* ${packName}...`);

        const tempDir = path.join(os.tmpdir(), `tg_pack_${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        try {
            // 1. Fetch sticker set metadata from Telegram
            const setRes = await axios.get(`https://api.telegram.org/bot${token}/getStickerSet?name=${packName}`);
            if (!setRes.data.ok) throw new Error(setRes.data.description || 'Failed to fetch sticker set.');

            const stickers = setRes.data.result.stickers || [];
            const total = stickers.length;

            if (total === 0) {
                throw new Error('No stickers found in this pack.');
            }

            await ctx.reply(`📦 *Found ${total} stickers.*\n⏳ Downloading and converting...`);

            // 2. Download and convert each sticker
            const stickerPaths = [];

            for (let i = 0; i < stickers.length; i++) {
                const sticker = stickers[i];
                
                try {
                    // Get file URL from Telegram
                    const fileRes = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${sticker.file_id}`);
                    if (!fileRes.data.ok) continue;

                    const filePath = fileRes.data.result.file_path;
                    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

                    const imgBuffer = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 30000 }).then(r => r.data);

                    // Convert to WebP (512x512)
                    // Note: sharp handles .webp and static .png. For animated .webm, ffmpeg would be needed.
                    // Telegram stickers are usually .webp (static/animated) or .tgs/.webm (animated).
                    // We use sharp for webp/png.
                    const webpBuffer = await sharp(Buffer.from(imgBuffer))
                        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .webp({ quality: 80 })
                        .toBuffer();

                    const outPath = path.join(tempDir, `sticker_${i}.webp`);
                    fs.writeFileSync(outPath, webpBuffer);
                    stickerPaths.push(outPath);

                } catch (err) {
                    console.error(`Failed to process sticker ${i}:`, err.message);
                }
            }

            if (stickerPaths.length === 0) {
                throw new Error('Could not convert any stickers.');
            }

            // 3. Split into packs of max 30
            const MAX_PER_PACK = 30;
            const packCount = Math.ceil(stickerPaths.length / MAX_PER_PACK);

            await ctx.reply(`📦 *Sending ${stickerPaths.length} stickers in ${packCount} pack(s)...*`);

            for (let p = 0; p < packCount; p++) {
                const start = p * MAX_PER_PACK;
                const end = start + MAX_PER_PACK;
                const chunk = stickerPaths.slice(start, end);

                const packStickers = chunk.map(filePath => ({
                    data: { url: filePath }
                }));

                const coverPath = chunk[0];

                await sock.sendMessage(m.key.remoteJid, {
                    cover: { url: coverPath },
                    stickers: packStickers,
                    name: `Queen Xavena (Part ${p + 1})`,
                    publisher: 'Lord Xaven',
                    description: `Telegram pack: ${packName} (${chunk.length} stickers)`
                }, { quoted: m });

                // Small delay between packs
                if (p < packCount - 1) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

        } catch (err) {
            console.error('TGSticker error:', err);
            await ctx.reply(`❌ *Failed to create sticker pack.*\n_Error: ${err.message}_`);
        } finally {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {}
        }
    }
};