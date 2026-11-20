import { search } from 'pinterest-media-downloader';
import { getPrefix } from '../../lib/config.js';
import axios from 'axios';

export default {
    command: 'image',
    aliases: ['img', 'pic', 'pinterest'],
    description: 'Search Pinterest for images',
    category: 'Tools',
    ownerOnly: false,
    usage: 'image <query> | <count>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');

        if (!input) {
            return ctx.reply(`🖼️ *Pinterest Image Search*\n\nUsage: \`${prefix}image rema | 10\`\nOr just \`${prefix}image rema\` (defaults to 5 images).`);
        }

        // Parse query and count
        let query = input;
        let count = 5; // default

        const parts = input.split('|').map(s => s.trim());
        if (parts.length === 2) {
            query = parts[0];
            const parsedCount = parseInt(parts[1]);
            if (!isNaN(parsedCount) && parsedCount > 0) {
                count = Math.min(parsedCount, 20); // Cap at 20 to avoid spam
            }
        }

        await ctx.reply(`🔍 *Searching Pinterest for:* ${query} (${count} images)...`);

        try {
            // 1. Search Pinterest using the same library as stickerpack
            const searchResult = await search(query, { limit: count });
            const pins = searchResult.pins;

            if (!pins || pins.length === 0) {
                return ctx.reply(`❌ No images found for "${query}".`);
            }

            const imagesToSend = pins.slice(0, count);
            let sentCount = 0;

            // 2. Send images one by one
            for (let i = 0; i < imagesToSend.length; i++) {
                const pin = imagesToSend[i];
                
                // The library documentation specifies the image URL is in pin.images.original
                const imgUrl = pin.images?.original;

                if (!imgUrl) continue;

                try {
                    // Download image as buffer to send reliably
                    const imgRes = await axios.get(imgUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 15000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const buffer = Buffer.from(imgRes.data);

                    await sock.sendMessage(m.key.remoteJid, {
                        image: buffer,
                        caption: `🖼️ *${query}*\n📌 Image ${i + 1}/${imagesToSend.length}`
                    }, { quoted: m });

                    sentCount++;
                    // Small delay to avoid rate limits
                    await new Promise(r => setTimeout(r, 1000));
                } catch (imgErr) {
                    console.error(`Failed to send image ${i + 1}:`, imgErr.message);
                }
            }

            if (sentCount > 0) {
                await ctx.reply(`✅ *Done!* Sent ${sentCount} images.`);
            } else {
                await ctx.reply(`❌ Failed to download and send any images.`);
            }

        } catch (err) {
            console.error('Pinterest search error:', err);
            await ctx.reply(`❌ *Search Failed*\n_Error: ${err.message}_`);
        }
    }
};