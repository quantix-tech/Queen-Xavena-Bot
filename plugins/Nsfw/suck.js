import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'suck',
    description: 'Fetch random NSFW content (18+)',
    category: 'Nsfw',
    ownerOnly: false,
    usage: 'suck',

    async execute(sock, m, args, ctx) {
        
        await ctx.reply('🔞 *Fetching NSFW content...*');

        try {
            // The Prexzy API endpoint for this command
            const apiUrl = `https://prexzyapis.com/nsfw/suck`;
            
            const res = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            const imageBuffer = Buffer.from(res.data);
            const contentType = res.headers['content-type'] || 'image/jpeg';

            // Check if it's an image or video based on the content type
            const isVideo = contentType.includes('video');

            if (isVideo) {
                await sock.sendMessage(m.key.remoteJid, {
                    video: imageBuffer,
                    mimetype: contentType,
                    caption: `🔞 *NSFW Content*\n\n> Powered by Queen Xavena`
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, {
                    image: imageBuffer,
                    mimetype: contentType,
                    caption: `🔞 *NSFW Content*\n\n> Powered by Queen Xavena`
                }, { quoted: m });
            }

        } catch (err) {
            console.error('Suck NSFW error:', err.message);
            await ctx.reply('❌ *Error*\nFailed to fetch NSFW content. The API might be down or the endpoint is invalid.');
        }
    }
};