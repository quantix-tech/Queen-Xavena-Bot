import axios from 'axios';
export default {
    command: 'technews', description: 'Get latest tech news', category: 'General', ownerOnly: false, usage: 'technews',
    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://newsapi.org/v2/top-headlines?category=technology&language=en&apiKey=YOUR_API_KEY', { timeout: 10000 });
            
            const articles = res.data.articles.slice(0, 3);
            let text = `📰 *Tech News*\n\n`;
            articles.forEach((a, i) => text += `${i+1}. ${a.title}\n${a.url}\n\n`);
            await ctx.reply(text);
        } catch (e) { await ctx.reply('❌ Failed to fetch news. Requires API key.'); }
    }
};