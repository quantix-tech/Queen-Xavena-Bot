import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'instagram',
    aliases: ['ig', 'igdl', 'reels'],
    description: 'Download Instagram media (Reels, Posts, IGTV)',
    category: 'Download',
    ownerOnly: false,
    usage: 'instagram <url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let url = args[0];

        if (!url) {
            return ctx.reply(`📸 *Instagram Downloader*\n\nUsage: \`${prefix}instagram <url>\`\nExample: \`${prefix}instagram https://www.instagram.com/p/xxxxx\``);
        }

        if (!url.includes('instagram.com') && !url.includes('instagr.am')) {
            return ctx.reply('❌ *Invalid Link*\n\nPlease provide a valid Instagram URL.');
        }

        await ctx.reply(`📸 *Instagram*\n\n⏳ _Fetching media..._`);

 
        const apiUrl = `https://prexzyapis.com/download/instagram?url=${encodeURIComponent(url)}`;

        try {
            const response = await axios.get(apiUrl, { timeout: 20000 });
            const data = response.data;

            // ─── ROBUST PARSER ───
            // The API might return the media in different places. We check them all.
            let mediaList = 
                data.result || 
                data.data || 
                data.media || 
                data.urls || 
                data.result?.media || 
                data.data?.media || 
                data;

            // If it's a single string URL, wrap it in an array
            if (typeof mediaList === 'string' && mediaList.startsWith('http')) {
                mediaList = [mediaList];
            }

            // If it's an object with a single URL, wrap it
            if (!Array.isArray(mediaList) && typeof mediaList === 'object') {
                if (mediaList.url) mediaList = [mediaList.url];
                else if (mediaList.src) mediaList = [mediaList.src];
            }

            // Final check: ensure it's an array with at least one item
            if (!Array.isArray(mediaList) || mediaList.length === 0) {
                throw new Error('Could not find any media in the API response.');
            }

            await ctx.reply(`✅ *Found ${mediaList.length} media file(s).* Sending...`);

            for (let i = 0; i < mediaList.length; i++) {
                const item = mediaList[i];
                const mediaUrl = typeof item === 'string' ? item : (item.url || item.src);
                
                // Check if it's a video
                const isVideo = mediaUrl.includes('.mp4') || (typeof item === 'object' && item.type && item.type.includes('video'));

                if (!mediaUrl) continue;

                if (isVideo) {
                    await sock.sendMessage(m.key.remoteJid, {
                        video: { url: mediaUrl },
                        caption: `📸 *Instagram Video* (${i + 1}/${mediaList.length})`
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(m.key.remoteJid, {
                        image: { url: mediaUrl },
                        caption: `📸 *Instagram Image* (${i + 1}/${mediaList.length})`
                    }, { quoted: m });
                }

                // Slight delay to prevent WhatsApp rate-limiting
                if (mediaList.length > 1) {
                    await new Promise(r => setTimeout(r, 1500));
                }
            }

        } catch (err) {
            console.error('Instagram error:', err);
            await ctx.reply(`❌ *Download Failed*\n\nCould not fetch Instagram media. The account might be private, or the API is down.\n_Note: Try a different link._`);
        }
    }
};