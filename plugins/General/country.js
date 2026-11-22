import { getPrefix } from '../../lib/config.js';

// Cache - so we no fetch big list every time
let capitalCache = null;
let capitalCacheTime = 0;
let codesCache = null;
let codesCacheTime = 0;
const countryCache = new Map(); // nigeria -> full result

// Retry helper - try 3 times before giving up
async function fetchRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
            const res = await fetch(url, { ...options, signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0', ...(options.headers || {}) } });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 500 * (i + 1))); // wait 500ms, 1s, 1.5s
        }
    }
}

export default {
    command: 'country',
    aliases: ['countryinfo'],
    description: 'Get info about any country with flag image + caption - stable with cache and retry',
    category: 'Info',
    usage: 'country <name>',
    async execute(sock, m, args, ctx) {
        const name = args.join(' ').trim();
        if (!name) return ctx.reply(`🌍 *Country Info*\n\nUsage: \`.country nigeria\`\nUsage: \`.country japan\``);
        const key = name.toLowerCase();

        // If we don fetch this country before, return cached result instantly - no API call, no breaking
        if (countryCache.has(key)) {
            const cached = countryCache.get(key);
            return await sendFlag(cached.flag, cached.caption);
        }

        const sendFlag = async (flagUrl, caption) => {
            const chatId = m.chat || m.key?.remoteJid;
            try { return await sock.sendMessage(chatId, { image: { url: flagUrl }, caption }, { quoted: m }); } catch {}
            try {
                const res = await fetch(flagUrl);
                const buf = Buffer.from(await res.arrayBuffer());
                return await sock.sendMessage(chatId, { image: buf, caption }, { quoted: m });
            } catch {}
            return ctx.reply(caption + `\n🏳️ *Flag:* ${flagUrl}`);
        };

        try {
            // 1. PRIMARY - CountriesNow (more stable than restcountries.eu)
            // Get capital list - cached for 1 hour, not every command
            if (!capitalCache || Date.now() - capitalCacheTime > 3600000) {
                const d = await fetchRetry('https://countriesnow.space/api/v0.1/countries/capital');
                capitalCache = d.data || [];
                capitalCacheTime = Date.now();
            }
            const found = capitalCache.find(x => x.name.toLowerCase() === key) || capitalCache.find(x => x.name.toLowerCase().includes(key));
            if (!found) return ctx.reply(`❌ Country *${name}* not found\n\nTry: \`.country Nigeria\` or \`.country Ghana\``);

            // 2. Currency - POST with retry
            let currency = 'N/A';
            try {
                const currData = await fetchRetry('https://countriesnow.space/api/v0.1/countries/currency', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ iso2: found.iso2 }) });
                currency = currData.data?.currency || 'N/A';
                if (typeof currency === 'object') currency = currency.code || currency.name || 'N/A';
            } catch {}

            // 3. Population - GET /q with retry
            let population = 'N/A';
            try {
                const popData = await fetchRetry(`https://countriesnow.space/api/v0.1/countries/population/q?country=${encodeURIComponent(found.name)}`);
                const pops = popData.data?.populationCounts || [];
                if (pops.length) population = pops[pops.length - 1].value.toLocaleString();
            } catch {}

            // 4. Dial code - cached for 1 hour
            let dial = 'N/A';
            try {
                if (!codesCache || Date.now() - codesCacheTime > 3600000) {
                    const d = await fetchRetry('https://countriesnow.space/api/v0.1/countries/codes');
                    codesCache = d.data || [];
                    codesCacheTime = Date.now();
                }
                const codeInfo = codesCache.find(x => x.name.toLowerCase() === found.name.toLowerCase());
                dial = codeInfo?.dial_code || 'N/A';
                if (dial !== 'N/A' && !String(dial).startsWith('+')) dial = `+${dial}`;
            } catch {}

            // 5. Try restcountries.eu v2 ONLY for extra details (region, language) - if e fail, we still have main data, we no go fail
            let extra = '';
            try {
                const v2 = await fetchRetry(`https://restcountries.eu/rest/v2/name/${encodeURIComponent(found.name)}`, {}, 1); // only 1 try, no need to block
                if (Array.isArray(v2) && v2[0]) {
                    const c = v2[0];
                    const lang = c.languages?.map(x => x.name).join(', ');
                    if (lang) extra += `\n🗣️ *Language:* ${lang}`;
                    if (c.region) extra += `\n🗺️ *Region:* ${c.region} - ${c.subregion || ''}`;
                }
            } catch {}

            const flagPng = `https://flagcdn.com/w640/${(found.iso2 || 'ng').toLowerCase()}.png`;
            const caption = `🌍 *${found.name}*\n━━━━━━━━━━━━━━━━━━\n\n🏙️ *Capital:* ${found.capital || 'N/A'}\n👥 *Population:* ${population}\n💰 *Currency:* ${currency}\n🌍 *ISO:* ${found.iso2 || 'N/A'} / ${found.iso3 || 'N/A'}\n📞 *Dial Code:* ${dial}${extra}`;

            // Save to cache 
            countryCache.set(key, { flag: flagPng, caption });
            // Keep cache small - max 100 countries
            if (countryCache.size > 100) countryCache.delete(countryCache.keys().next().value);

            return await sendFlag(flagPng, caption);

        } catch (e) {
            console.error('Country error:', e);
            return ctx.reply(`❌ Server busy, try again in 5 seconds.\n\n\`.country ${name}\``);
        }
    }
};