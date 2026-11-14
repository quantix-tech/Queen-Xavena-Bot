import { search } from 'pinterest-media-downloader';
import sharp from 'sharp';
import axios from 'axios';
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

        try {
            const searchResult = await search(query, { limit: 30 });
            const pins = searchResult.pins;

            if (!pins || pins.length === 0) {
                return ctx.reply(`❌ *Not Found*\n\nNo Pinterest images found for: ${query}`);
            }

            const imagesToProcess = pins.slice(0, 30);
            const stickers = [];

            await ctx.reply(`⏳ *Processing ${imagesToProcess.length} images into stickers...*`);

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

                    // 👇 FIX: Pass the buffer directly instead of { data: buffer }
                    stickers.push(webpBuffer); 
                } catch (err) {
                    console.error(`Failed to process image ${i}:`, err.message);
                }
            }

            if (stickers.length === 0) {
                throw new Error('Could not process any images into stickers.');
            }

            await ctx.reply(`📦 *Sending Sticker Pack with ${stickers.length} stickers...*`);

            // 👇 The cover also needs to be a buffer directly
            const coverBuffer = stickers[0];

            await sock.sendMessage(m.key.remoteJid, {
                cover: coverBuffer, // 👈 Direct buffer
                stickers: stickers, // 👈 Array of direct buffers
                name: 'Queen Xavena',
                publisher: 'Lord Xaven',
                description: `Pack of ${stickers.length} stickers for "${query}"`
            }, { quoted: m });

        } catch (err) {
            console.error('Stickerpack error:', err);
            await ctx.reply(`❌ *Failed to create sticker pack.*\n_Error: ${err.message}_`);
        }
    }
};