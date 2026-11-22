import { getPrefix } from '../../lib/config.js';
export default {
    command: 'country',
    aliases: ['countryinfo'],
    description: 'Get info about any country - capital, population, currency, language and flag',
    category: 'Info',
    usage: 'country <name>',
    async execute(sock, m, args, ctx) {
        const name = args.join(' ').trim();
        if (!name) return ctx.reply(`🌍 *Country Info*\n\nUsage: \`.country nigeria\`\nUsage: \`.country japan\``);
        try {
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=true`);
            if (!res.ok) {
                const res2 = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`);
                if (!res2.ok) return ctx.reply(`❌ Country *${name}* not found`);
                const d2 = await res2.json();
                const c = d2[0];
                return ctx.reply(formatCountry(c));
            }
            const data = await res.json();
            return ctx.reply(formatCountry(data[0]));
        } catch (e) {
            return ctx.reply(`❌ Failed to fetch country info. Try again.`);
        }
        function formatCountry(c) {
            const curr = c.currencies ? Object.values(c.currencies).map(x => `${x.name} (${x.symbol || ''})`).join(', ') : 'N/A';
            const lang = c.languages ? Object.values(c.languages).join(', ') : 'N/A';
            return `🌍 *${c.name.common} ${c.flag || ''}*\n━━━━━━━━━━━━━━━━━━\n\n🏛️ *Official:* ${c.name.official}\n🏙️ *Capital:* ${c.capital?.join(', ') || 'N/A'}\n👥 *Population:* ${c.population.toLocaleString()}\n🗺️ *Region:* ${c.region} - ${c.subregion || ''}\n💰 *Currency:* ${curr}\n🗣️ *Language:* ${lang}\n🕐 *Timezone:* ${c.timezones?.join(', ')}\n🚗 *Driving Side:* ${c.car?.side}\n🌐 *Domain:* ${c.tld?.join(', ')}\n\n🔗 *Map:* ${c.maps?.googleMaps}`;
        }
    }
};