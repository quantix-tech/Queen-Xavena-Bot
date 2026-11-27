import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: '69',
    description: 'Fetch NSFW sixtynine image',
    category: 'NSFW',
    ownerOnly: false,
    usage: '69',

    async execute(sock, m, args, ctx) {
        try {
            const response = await axios.get('https://prexzyapis.com/nsfw/sixtynine', {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            const imageBuffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'image/jpeg';

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                mimetype: contentType,
                caption: `🔞 *NSFW*\n\n*Type:* 69`
            }, { quoted: m });

        } catch (error) {
            console.error('69 error:', error.message);
            await ctx.reply('❌ *Error*\n\nFailed to fetch NSFW content. Try again later.');
        }
    }
};