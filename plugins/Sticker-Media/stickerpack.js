import Pinterest from 'pinterest-media-downloader';
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
            // The search method returns an array of pin objects
            const searchResults = await Pinterest.search(query, { limit: 30 });
            
            if (!searchResults || searchResults.length === 0) {
                return ctx.reply(`❌ *Not Found*\n\nNo Pinterest images found for: ${query}`);
            }

            const imagesToProcess = searchResults.slice(0, 30);
            const stickers = [];

            await ctx.reply(`⏳ *Processing ${imagesToProcess.length} images into stickers...*`);

            for (let i = 0; i < imagesToProcess.length; i++) {
                const pin = imagesToProcess[i];
                // The library usually returns images in a property like 'images' or 'image'
                let imgUrl = pin.images?.['736x']?.url || pin.image || pin.imageUrl;
                
                // If it's an object with different sizes, try to grab the largest one
                if (!imgUrl && pin.images) {
                    const sizes = Object.values(pin.images);
                    if (sizes.length > 0 && sizes[0].url) imgUrl = sizes[0].url;
                }

                if (!imgUrl) continue;

                try {
                    const imgBuffer = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 }).then(r => r.data);
                    
                    // Convert to WebP sticker (512x512)
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

            const coverBuffer = stickers[0].data;

            await sock.sendMessage(m.key.remoteJid, {
                cover: { url: Buffer.from(coverBuffer).toString('base64') }, 
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