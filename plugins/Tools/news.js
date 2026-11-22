import { getPrefix } from '../../lib/config.js';

export default {
    command: 'news',
    aliases: ['headlines', 'newz'],
    description: 'Get latest real world news for any topic like medical, sports or Nigeria without API key',
    category: 'Tools',
    usage: 'news [topic]',
    async execute(sock, m, args, ctx) {
        const topic = args.join(' ').trim() || 'world news';

        // GDELT - Free, no key, real news from BBC, CNN, Al Jazeera etc
        const query = topic.toLowerCase() === 'world news' || topic === 'world' ? '*' : topic;
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=6&format=json&sort=HybridRel`;

        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const data = await res.json();

            if (!data.articles || data.articles.length === 0) {
                return ctx.reply(`❌ No news found for *${topic}*\n\nTry: \`.news medical\` or \`.news nigeria\``);
            }

            let msg = `📰 *LATEST NEWS - ${topic.toUpperCase()}*\n`;
            msg += `━━━━━━━━━━━━━━━━━━\n\n`;

            data.articles.forEach((a, i) => {
                // Clean date: 20261122T150000Z -> 22 Nov 2026
                let date = a.seendate || '';
                if (date.length >= 8) {
                    const y = date.slice(0, 4);
                    const mo = date.slice(4, 6);
                    const d = date.slice(6, 8);
                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    date = `${d} ${months[parseInt(mo) - 1]} ${y}`;
                }

                msg += `*${i + 1}. ${a.title}*\n`;
                msg += `🗞️ ${a.sourceCommonName || 'News'} • ${date}\n`;
                msg += `🔗 ${a.url}\n\n`;
            });

            msg += `━━━━━━━━━━━━━━━━━━\n`;
            msg += `💡 Try: \`.news medical\` | \`.news ai\` | \`.news nigeria\``;

            return ctx.reply(msg.trim());

        } catch (e) {
            console.error('News error:', e);
            return ctx.reply(`❌ Failed to fetch news for *${topic}*. Check your internet and try again.`);
        }
    }
};