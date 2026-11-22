import axios from 'axios';
export default {
    command: 'country', description: 'Get info about a country', category: 'General', ownerOnly: false, usage: 'country <name>',
    async execute(sock, m, args, ctx) {
        const country = args.join(' ');
        if (!country) return ctx.reply('❌ Provide a country name.');
        try {
            const res = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`, { timeout: 10000 });
            const d = res.data[0];
            await ctx.reply(`🌍 *Country Info*\n\n*Name:* ${d.name.common}\n*Capital:* ${d.capital?.[0] || 'N/A'}\n*Region:* ${d.region}\n*Population:* ${d.population.toLocaleString()}\n*Currency:* ${Object.values(d.currencies || {})[0]?.name || 'N/A'}`);
        } catch (e) { await ctx.reply('❌ Country not found.'); }
    }
};