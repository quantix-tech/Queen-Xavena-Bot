import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'cumsluts',
    description: 'Fetch NSFW cumsluts image',
    category: 'NSFW',
    ownerOnly: false,
    usage: 'cumsluts',

    async execute(sock, m, args, ctx) {
        try {
            const response = await axios.get('https://prexzyapis.com/nsfw/cumsluts', {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            const imageBuffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'image/jpeg';

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                mimetype: contentType,
                caption: `🔞 *NSFW*\n\n*Type:* CUMSLUTS`
            }, { quoted: m });

        } catch (error) {
            console.error('Cumsluts error:', error.message);
            await ctx.reply('❌ *Error*\n\nFailed to fetch NSFW content. Try again later.');
        }
    }
};