import { getPrefix } from '../../lib/config.js';

export default {
    command: 'country',
    aliases: ['countryinfo'],
    description: 'Get info about any country with flag image + caption using restcountries.eu v2 API',
    category: 'Info',
    usage: 'country <name>',
    async execute(sock, m, args, ctx) {
        const name = args.join(' ').trim();
        if (!name) return ctx.reply(`🌍 *Country Info*\n\nUsage: \`.country nigeria\`\nUsage: \`.country japan\``);

        try {
            // 1. YOUR API - https://restcountries.eu/rest/v2/all
            let c = null;

            try {
                const res = await fetch(`https://restcountries.eu/rest/v2/name/${encodeURIComponent(name)}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const data = await res.json();
                if (Array.isArray(data) && data.length && data[0].name) c = data[0];
            } catch {}

            if (!c) {
                try {
                    const resAll = await fetch(`https://restcountries.eu/rest/v2/all`);
                    const all = await resAll.json();
                    if (Array.isArray(all)) {
                        c = all.find(x => x.name?.toLowerCase() === name.toLowerCase())
                            || all.find(x => x.name?.toLowerCase().includes(name.toLowerCase()));
                    }
                } catch {}
            }

            // 2. FALLBACK if restcountries.eu don die
            if (!c) {
                const res2 = await fetch('https://countriesnow.space/api/v0.1/countries/capital');
                const d2 = await res2.json();
                const found = d2.data?.find(x => x.name.toLowerCase() === name.toLowerCase() || x.name.toLowerCase().includes(name.toLowerCase()));
                if (!found) return ctx.reply(`❌ Country *${name}* not found\n\nTry: \`.country Nigeria\``);

                // Fallback flag - PNG from flagcdn using iso2
                const flagPng = `https://flagcdn.com/w640/${(found.iso2 || 'ng').toLowerCase()}.png`;
                const caption = `🌍 *${found.name}*\n━━━━━━━━━━━━━━━━━━\n\n🏙️ *Capital:* ${found.capital}\n💰 *Currency:* ${found.currency}\n🌍 *ISO:* ${found.iso2} / ${found.iso3}\n📞 *Dial Code:* ${found.dial_code}`;
                try {
                    return await sock.sendMessage(m.chat, { image: { url: flagPng }, caption }, { quoted: m });
                } catch {
                    return ctx.reply(caption + `\n🏳️ *Flag:* ${flagPng}`);
                }
            }

            // 3. Format v2 data
            const curr = c.currencies?.map(x => `${x.name} (${x.symbol || x.code || ''})`).join(', ') || 'N/A';
            const lang = c.languages?.map(x => x.name).join(', ') || 'N/A';
            const pop = c.population ? c.population.toLocaleString() : 'N/A';

            // v2 flag is .svg - WhatsApp no show SVG, so use flagcdn PNG
            // c.alpha2Code = "NG" -> https://flagcdn.com/w640/ng.png
            const code = (c.alpha2Code || 'NG').toLowerCase();
            const flagPng = `https://flagcdn.com/w640/${code}.png`;

            const caption = `🌍 *${c.name}*\n━━━━━━━━━━━━━━━━━━\n\n` +
                `🏛️ *Official:* ${c.nativeName || c.name}\n` +
                `🏙️ *Capital:* ${c.capital || 'N/A'}\n` +
                `👥 *Population:* ${pop}\n` +
                `🗺️ *Region:* ${c.region || 'N/A'} - ${c.subregion || ''}\n` +
                `💰 *Currency:* ${curr}\n` +
                `🗣️ *Language:* ${lang}\n` +
                `📞 *Calling Code:* +${c.callingCodes?.join(', +') || 'N/A'}\n` +
                `🌐 *Domain:* ${c.topLevelDomain?.join(', ') || 'N/A'}`;

            // 4. Send IMAGE + CAPTION
            try {
                return await sock.sendMessage(m.chat, { image: { url: flagPng }, caption }, { quoted: m });
            } catch (e) {
                // If image fail, send text + flag link
                console.error('Flag image error:', e);
                return ctx.reply(caption + `\n\n🏳️ *Flag:* ${flagPng}`);
            }

        } catch (e) {
            console.error('Country error:', e);
            return ctx.reply(`❌ Failed to fetch. Try \`.country Nigeria\` again.`);
        }
    }
};