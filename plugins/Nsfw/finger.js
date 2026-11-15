import axios from 'axios';

export default {
    command: 'finger',
    description: 'Fetch NSFW finger image',
    category: 'NSFW',
    ownerOnly: false,
    usage: 'finger',

    async execute(sock, m, args, ctx) {
        try {
            const response = await axios.get('https://prexzyapis.com/nsfw/finger', {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            const imageBuffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'image/jpeg';

            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                mimetype: contentType,
                caption: `🔞 *NSFW*\n\n*Type:* FINGER`
            }, { quoted: m });

        } catch (error) {
            console.error('Finger error:', error.message);
            await ctx.reply('❌ *Error*\n\nFailed to fetch NSFW content. Try again later.');
        }
    }
};