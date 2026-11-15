import axios from 'axios';

export default {
    command: 'tiny',
    description: 'Fetch NSFW tiny image',
    category: 'NSFW',
    ownerOnly: false,
    usage: 'tiny',

    async execute(sock, m, args, ctx) {
        try {
            const response = await axios.get('https://prexzyapis.com/nsfw/tiny', {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            const imageBuffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'image/jpeg';

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                mimetype: contentType,
                caption: `🔞 *NSFW*\n\n*Type:* TINY`
            }, { quoted: m });

        } catch (error) {
            console.error('Tiny error:', error.message);
            await ctx.reply('❌ *Error*\n\nFailed to fetch NSFW content. Try again later.');
        }
    }
};