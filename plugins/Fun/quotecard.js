import axios from 'axios';

export default {
    command: 'quotecard',
    description: 'Generate a quote card image',
    category: 'Fun',
    ownerOnly: false,
    usage: 'quotecard <text>',
    async execute(sock, m, args, ctx) {
        let text = args.join(' ');
        if (!text) {
            const quotes = [
                "The only way to do great work is to love what you do.",
                "Life is what happens when you're busy making other plans.",
                "In the middle of difficulty lies opportunity.",
                "The journey of a thousand miles begins with one step."
            ];
            text = quotes[Math.floor(Math.random() * quotes.length)];
        }

        await ctx.reply(`⏳ _Generating quote card..._`);

        try {
            const apiUrl = `https://prexzyapis.com/quote?text=${encodeURIComponent(text)}&author=Queen%20Xavena`;
            const res = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 30000 });
            await sock.sendMessage(m.key.remoteJid, {
                image: Buffer.from(res.data),
                caption: `✨ *Quote Card*\n\n"${text}"\n\n> Queen Xavena`
            }, { quoted: m });
        } catch (err) {
            console.error('QuoteCard error:', err.message);
            await ctx.reply(`❌ Failed to generate quote card. The API might be down.`);
        }
    }
};