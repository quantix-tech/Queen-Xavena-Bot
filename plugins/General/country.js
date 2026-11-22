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

        // Helper to send image + caption - tries 3 ways
        const sendFlag = async (flagUrl, caption) => {
            const chatId = m.chat || m.key?.remoteJid;
            // Try 1: URL
            try {
                return await sock.sendMessage(chatId, { image: { url: flagUrl }, caption }, { quoted: m });
            } catch {}
            // Try 2: Buffer (most reliable for WhatsApp)
            try {
                const res = await fetch(flagUrl);
                const buf = Buffer.from(await res.arrayBuffer());
                return await sock.sendMessage(chatId, { image: buf, caption }, { quoted: m });
            } catch {}
            // Try 3: Text fallback
            return ctx.reply(caption + `\n🏳️ *Flag:* ${flagUrl}`);
        };

        try {
            // 1. YOUR API - restcountries.eu v2
            let c = null;
            try {
                const res = await fetch(`https://restcountries.eu/rest/v2/name/${encodeURIComponent(name)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const data = await res.json();
                if (Array.isArray(data) && data.length && data[0].name) c = data[0];
            } catch {}
            if (!c) {
                try {
                    const resAll = await fetch(`https://restcountries.eu/rest/v2/all`);
                    const all = await resAll.json();
                    if (Array.isArray(all)) c = all.find(x => x.name?.toLowerCase() === name.toLowerCase()) || all.find(x => x.name?.toLowerCase().includes(name.toLowerCase()));
                } catch {}
            }

            // If v2 works, use am
            if (c) {
                const curr = c.currencies?.map(x => `${x.name} (${x.symbol || x.code || ''})`).join(', ') || 'N/A';
                const lang = c.languages?.map(x => x.name).join(', ') || 'N/A';
                const code = (c.alpha2Code || 'NG').toLowerCase();
                const flagPng = `https://flagcdn.com/w640/${code}.png`;
                const caption = `🌍 *${c.name}*\n━━━━━━━━━━━━━━━━━━\n\n🏛️ *Official:* ${c.nativeName || c.name}\n🏙️ *Capital:* ${c.capital || 'N/A'}\n👥 *Population:* ${c.population ? c.population.toLocaleString() : 'N/A'}\n🗺️ *Region:* ${c.region || 'N/A'} - ${c.subregion || ''}\n💰 *Currency:* ${curr}\n🗣️ *Language:* ${lang}\n📞 *Calling Code:* +${c.callingCodes?.join(', +') || 'N/A'}\n🌐 *Domain:* ${c.topLevelDomain?.join(', ') || 'N/A'}`;
                return await sendFlag(flagPng, caption);
            }

            // 2. FALLBACK - CountriesNow - Merge 3 endpoints to fix undefined
            const [capRes, currRes, codeRes] = await Promise.all([
                fetch('https://countriesnow.space/api/v0.1/countries/capital'),
                fetch('https://countriesnow.space/api/v0.1/countries/currency'),
                fetch('https://countriesnow.space/api/v0.1/countries/codes')
            ]);
            const capData = (await capRes.json()).data || [];
            const currData = (await currRes.json()).data || [];
            const codeData = (await codeRes.json()).data || [];

            const found = capData.find(x => x.name.toLowerCase() === name.toLowerCase()) || capData.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
            if (!found) return ctx.reply(`❌ Country *${name}* not found`);

            const currInfo = currData.find(x => x.name.toLowerCase() === found.name.toLowerCase());
            const codeInfo = codeData.find(x => x.name.toLowerCase() === found.name.toLowerCase());

            // Currency fix: CountriesNow returns { currency: "NGN", ... } or { currency: "Naira" } depending on version
            let currency = currInfo?.currency || 'N/A';
            // Dial code fix: field is dial_code
            let dial = codeInfo?.dial_code || codeInfo?.dialCode || 'N/A';
            if (dial !== 'N/A' && !String(dial).startsWith('+')) dial = `+${dial}`;

            // Population
            let population = 'N/A';
            try {
                const popRes = await fetch('https://countriesnow.space/api/v0.1/countries/population', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ country: found.name }) });
                const popData = await popRes.json();
                const pops = popData.data?.populationCounts || [];
                if (pops.length) population = pops[pops.length - 1].value.toLocaleString();
            } catch {}

            const flagPng = `https://flagcdn.com/w640/${(found.iso2 || 'ng').toLowerCase()}.png`;
            const caption = `🌍 *${found.name}*\n━━━━━━━━━━━━━━━━━━\n\n🏙️ *Capital:* ${found.capital || 'N/A'}\n👥 *Population:* ${population}\n💰 *Currency:* ${currency}\n🌍 *ISO:* ${found.iso2 || 'N/A'} / ${found.iso3 || 'N/A'}\n📞 *Dial Code:* ${dial}`;

            return await sendFlag(flagPng, caption);

        } catch (e) {
            console.error('Country error:', e);
            return ctx.reply(`❌ Failed to fetch. Try \`.country Nigeria\` again.`);
        }
    }
};