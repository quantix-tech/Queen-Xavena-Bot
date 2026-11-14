import { search } from 'pinterest-media-downloader';
import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'stickerpack',
    description: 'Search Pinterest and create a sticker pack',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'stickerpack <search term>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const query = args.join(' ');

        if (!query) {
            return ctx.reply(`📦 *Sticker Pack*\n\nUsage: \`${prefix}stickerpack <name>\`\nExample: \`${prefix}stickerpack rema\``);
        }

        await ctx.reply(`🔍 *Searching Pinterest for:* ${query}...`);

        const tempDir = path.join(os.tmpdir(), `xavena_pack_${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        try {
            const searchResult = await search(query, { limit: 30 });
            const pins = searchResult.pins;

            if (!pins || pins.length === 0) {
                throw new Error('No Pinterest images found.');
            }

            const imagesToProcess = pins.slice(0, 30);
            const stickerPaths = [];

            await ctx.reply(`⏳ *Processing ${imagesToProcess.length} images...*`);

            for (let i = 0; i < imagesToProcess.length; i++) {
                const pin = imagesToProcess[i];
                const imgUrl = pin.images?.original;

                if (!imgUrl) continue;

                try {
                    const imgBuffer = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 }).then(r => r.data);
                    
                    const webpBuffer = await sharp(Buffer.from(imgBuffer))
                        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .webp({ quality: 80 })
                        .toBuffer();

                    // Save to temp file
                    const filePath = path.join(tempDir, `sticker_${i}.webp`);
                    fs.writeFileSync(filePath, webpBuffer);
                    stickerPaths.push(filePath);

                } catch (err) {
                    console.error(`Failed to process image ${i}:`, err.message);
                }
            }

            if (stickerPaths.length === 0) {
                throw new Error('Could not process any images into stickers.');
            }

            await ctx.reply(`📦 *Sending Sticker Pack with ${stickerPaths.length} stickers...*`);

            // Pass paths as expected by Baileys native file reader
            const coverPath = stickerPaths[0];
            const stickersArray = stickerPaths.map(p => ({ data: { url: p } }));

            await sock.sendMessage(m.key.remoteJid, {
                cover: { url: coverPath },
                stickers: stickersArray,
                name: 'Queen Xavena',
                publisher: 'Lord Xaven',
                description: `Pack of ${stickerPaths.length} stickers for "${query}"`
            }, { quoted: m });

        } catch (err) {
            console.error('Stickerpack error:', err);
            await ctx.reply(`❌ *Failed to create sticker pack.*\n_Error: ${err.message}_`);
        } finally {
            // Clean up temporary files
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {}
        }
    }
};