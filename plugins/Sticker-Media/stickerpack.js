import { lmna } from '@lmna22/aio-downloader';
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
            // 1. Search Pinterest using the library
            const searchResult = await lmna.pinterest(query, 30); 
            
            // The library usually returns an array of results
            let mediaList = searchResult?.result || searchResult?.data || searchResult;
            
            if (!Array.isArray(mediaList) || mediaList.length === 0) {
                return ctx.reply(`❌ *Not Found*\n\nNo Pinterest images found for: ${query}`);
            }

            // Limit to max 30 images (WhatsApp pack limit is 60, but 30 is safer for size)
            const imagesToProcess = mediaList.slice(0, 30);
            const stickers = [];

            await ctx.reply(`⏳ *Processing ${imagesToProcess.length} images into stickers...*`);

            for (let i = 0; i < imagesToProcess.length; i++) {
                const item = imagesToProcess[i];
                const imgUrl = typeof item === 'string' ? item : (item.url || item.image || item.src);
                
                if (!imgUrl) continue;

                try {
                    // Download image
                    const imgBuffer = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 }).then(r => r.data);
                    
                    // Convert to WebP sticker format (512x512) using sharp
                    const webpBuffer = await sharp(Buffer.from(imgBuffer))
                        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .webp({ quality: 80 })
                        .toBuffer();

                    stickers.push({ data: webpBuffer });
                } catch (err) {
                    console.error(`Failed to process image ${i}:`, err.message);
                }
            }

            if (stickers.length === 0) {
                throw new Error('Could not process any images into stickers.');
            }

            await ctx.reply(`📦 *Sending Sticker Pack with ${stickers.length} stickers...*`);

            // 2. Send the sticker pack
            // The cover is the first sticker converted to a buffer
            const coverBuffer = stickers[0].data;

            await sock.sendMessage(m.key.remoteJid, {
                cover: { url: Buffer.from(coverBuffer).toString('base64') }, // Some forks expect base64 for cover
                stickers: stickers,
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