import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'hentai-sfm',
    aliases: ['sfm'],
    description: 'Get random Hentai SFM content (NSFW)',
    category: 'NSFW',
    ownerOnly: false, // We will handle the group admin check manually inside
    usage: 'hentai-sfm',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        

        await ctx.reply('⏳ _Fetching SFM content..._');

        try {
            // Using the Prexzy API endpoint from your original code
            const apiUrl = 'https://prexzyapis.com/nsfw/hentai-sfm';
            
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 20000
            });

            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'image/jpeg';

            // Check if the API returned an image or a video
            if (contentType.includes('video')) {
                await sock.sendMessage(m.key.remoteJid, {
                    video: buffer,
                    mimetype: 'video/mp4',
                    caption: '🔞 *Hentai SFM*'
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, {
                    image: buffer,
                    mimetype: contentType,
                    caption: '🔞 *Hentai SFM*'
                }, { quoted: m });
            }

        } catch (err) {
            console.error('Hentai-SFM error:', err.message);
            await ctx.reply(`❌ *Error*\nFailed to fetch content. The API might be down or the endpoint changed.`);
        }
    }
};