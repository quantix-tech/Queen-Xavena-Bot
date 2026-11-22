import { getPrefix } from '../../lib/config.js';

export default {
    command: 'country',
    aliases: ['countryinfo'],
    description: 'Get info about any country - capital, population, currency, language and flag without API key',
    category: 'Info',
    usage: 'country <name>',
    async execute(sock, m, args, ctx) {
        const name = args.join(' ').trim();
        if (!name) return ctx.reply(`🌍 *Country Info*\n\nUsage: \`.country nigeria\`\nUsage: \`.country japan\``);

        try {
            // 1. Get capital / currency / ISO - FREE, NO KEY
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/capital', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const data = await res.json();
            const list = data.data || [];

            const found = list.find(x => x.name.toLowerCase() === name.toLowerCase())
                || list.find(x => x.name.toLowerCase().includes(name.toLowerCase()))
                || list.find(x => name.toLowerCase().includes(x.name.toLowerCase()));

            if (!found) return ctx.reply(`❌ Country *${name}* not found\n\nTry: \`.country Nigeria\` or \`.country Ghana\``);

            // 2. Get population - FREE, NO KEY (POST)
            let population = 'N/A';
            try {
                const res2 = await fetch('https://countriesnow.space/api/v0.1/countries/population', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                    body: JSON.stringify({ country: found.name })
                });
                const d2 = await res2.json();
                const pops = d2.data?.populationCounts || [];
                if (pops.length) population = pops[pops.length - 1].value.toLocaleString();
            } catch {}

            // 3. Get flag - FREE, NO KEY
            let flagUrl = '';
            try {
                const res3 = await fetch('https://countriesnow.space/api/v0.1/countries/flag/images');
                const d3 = await res3.json();
                const f = d3.data?.find(x => x.name.toLowerCase() === found.name.toLowerCase());
                if (f) flagUrl = f.flag;
            } catch {}

            let msg = `🌍 *${found.name}*\n━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `🏙️ *Capital:* ${found.capital || 'N/A'}\n`;
            msg += `👥 *Population:* ${population}\n`;
            msg += `💰 *Currency:* ${found.currency || 'N/A'}\n`;
            msg += `🌍 *ISO Code:* ${found.iso2 || ''} / ${found.iso3 || ''}\n`;
            msg += `📞 *Dial Code:* ${found.dial_code || 'N/A'}\n`;
            if (flagUrl) msg += `🏳️ *Flag:* ${flagUrl}\n`;

            return ctx.reply(msg.trim());

        } catch (e) {
            console.error('Country error:', e);
            return ctx.reply(`❌ Failed to fetch. Check internet and try \`.country Nigeria\` again.`);
        }
    }
};