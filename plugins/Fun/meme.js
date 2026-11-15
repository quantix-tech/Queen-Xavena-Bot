import axios from 'axios';

export default {
    command: 'meme',
    description: 'Get a random meme',
    category: 'Fun',
    ownerOnly: false,
    usage: 'meme',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });
            const { url, title, subreddit, author } = res.data;

            if (!url) throw new Error('No meme found');

            await sock.sendMessage(m.key.remoteJid, {
                image: { url: url },
                caption: `😂 *${title}*\n\n👤 u/${author}\n📌 r/${subreddit}`
            }, { quoted: m });

        } catch (err) {
            console.error('Meme error:', err.message);
            await ctx.reply('❌ Failed to fetch a meme. Try again later.');
        }
    }
};