import axios from 'axios';

export default {
    command: 'technews',
    description: 'Get the latest tech news from Hacker News',
    category: 'General',
    ownerOnly: false,
    usage: 'technews',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5', { timeout: 10000 });
            const hits = res.data.hits;

            if (!hits || hits.length === 0) {
                return ctx.reply('❌ No tech news found right now.');
            }

            let text = `📰 *Tech News (Hacker News)*\n\n`;
            hits.forEach((h, i) => {
                const title = h.title || 'Untitled';
                const url = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
                text += `${i + 1}. *${title}*\n🔗 ${url}\n\n`;
            });

            await ctx.reply(text);
        } catch (e) {
            console.error('TechNews error:', e.message);
            await ctx.reply('❌ Failed to fetch tech news. Try again later.');
        }
    }
};