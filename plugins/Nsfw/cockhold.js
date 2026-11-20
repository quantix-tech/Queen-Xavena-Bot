import axios from 'axios';

export default {
    command: 'cockhold',
    description: 'Fetch NSFW cockhold content',
    category: 'NSFW',
    ownerOnly: false,
    usage: 'cockhold',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://api-rebix.zone.id/api/nsfw/cuckold', {
                timeout: 30000,
                responseType: 'arraybuffer'
            });

            const contentType = res.headers['content-type'] || 'image/jpeg';

            if (!res.data || res.data.byteLength < 500) {
                return ctx.reply(`❌ *Error*\n\nFailed to fetch content.\n_Try again later._`);
            }

            await sock.sendMessage(m.key.remoteJid, {
                image: Buffer.from(res.data),
                mimetype: contentType,
                caption: `🔞 *Cockhold*`
            }, { quoted: m });

        } catch (error) {
            console.error('Cuckold error:', error.message);
            await ctx.reply(`❌ *Error*\n\nFailed to fetch content.\n_Note:_ ${error.message}`);
        }
    }
};