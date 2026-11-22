import { getPrefix } from '../../lib/config.js';

export default {
    command: 'country',
    aliases: ['countryinfo'],
    description: 'Get detailed info about any country including its flag',
    category: 'Tools',
    ownerOnly: false,
    usage: 'country <name>',

    async execute(sock, m, args, ctx) {
        const name = args.join(' ').trim();
        if (!name) return ctx.reply(`🌍 *Country Info*\n\nUsage: \`.country nigeria\`\nUsage: \`.country japan\``);

        await ctx.react('🌍');

        try {
            // 1. Get basic info (Capital, Currency, ISO) - FREE, NO KEY
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/capital', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const data = await res.json();
            const list = data.data || [];

            // Find the country (exact match first, then partial)
            const found = list.find(x => x.name.toLowerCase() === name.toLowerCase())
                || list.find(x => x.name.toLowerCase().includes(name.toLowerCase()))
                || list.find(x => name.toLowerCase().includes(x.name.toLowerCase()));

            if (!found) {
                await ctx.react('❌');
                return ctx.reply(`❌ Country *${name}* not found\n\nTry: \`.country Nigeria\` or \`.country Japan\``);
            }

            // 2. Fetch Population and Flag Image simultaneously for speed
            let population = 'N/A';
            let flagUrl = '';

            const [popRes, flagRes] = await Promise.all([
                fetch('https://countriesnow.space/api/v0.1/countries/population', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                    body: JSON.stringify({ country: found.name })
                }).catch(() => null),
                fetch('https://countriesnow.space/api/v0.1/countries/flag/images', {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                }).catch(() => null)
            ]);

            if (popRes) {
                const d2 = await popRes.json();
                const pops = d2.data?.populationCounts || [];
                if (pops.length) population = pops[pops.length - 1].value.toLocaleString();
            }

            if (flagRes) {
                const d3 = await flagRes.json();
                const f = d3.data?.find(x => x.name.toLowerCase() === found.name.toLowerCase());
                if (f) flagUrl = f.flag;
            }

            // 3. Build the message text
            let msg = `🌍 *${found.name}*\n━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `🏙️ *Capital:* ${found.capital || 'N/A'}\n`;
            msg += `👥 *Population:* ${population}\n`;
            msg += `💰 *Currency:* ${found.currency || 'N/A'}\n`;
            msg += `🌍 *ISO Code:* ${found.iso2 || ''} / ${found.iso3 || ''}\n`;
            msg += `📞 *Dial Code:* ${found.dial_code || 'N/A'}\n`;

            // 4. Send as Image with Caption if flag exists, otherwise plain text
            if (flagUrl) {
                await sock.sendMessage(m.key.remoteJid, {
                    image: { url: flagUrl },
                    caption: msg.trim()
                }, { quoted: m });
            } else {
                await ctx.reply(msg.trim());
            }

            await ctx.react('✅');

        } catch (e) {
            console.error('Country error:', e);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to fetch country info. Try again later.`);
        }
    }
};