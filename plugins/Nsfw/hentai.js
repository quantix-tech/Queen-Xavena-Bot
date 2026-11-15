import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'hentai',
    description: 'Fetch NSFW hentai image',
    category: 'NSFW',
    ownerOnly: false,
    usage: 'hentai',

    async execute(sock, m, args, ctx) {
        try {
            const response = await axios.get('https://prexzyapis.com/nsfw/hentai', {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            const imageBuffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'image/jpeg';

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                mimetype: contentType,
                caption: `🔞 *NSFW*\n\n*Type:* HENTAI`
            }, { quoted: m });

        } catch (error) {
            console.error('Hentai error:', error.message);
            await ctx.reply('❌ *Error*\n\nFailed to fetch NSFW content. Try again later.');
        }
    }
};