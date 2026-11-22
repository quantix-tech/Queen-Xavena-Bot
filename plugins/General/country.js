export default {
    command: 'country',
    aliases: ['countryinfo'],
    description: 'Get detailed info about any country including its flag',
    category: 'Info',
    ownerOnly: false,
    usage: 'country <name>',

    async execute(sock, m, args, ctx) {
        const name = args.join(' ').trim();
        if (!name) return ctx.reply(`🌍 *Country Info*\n\nUsage: \`.country nigeria\`\nUsage: \`.country japan\``);

        await ctx.react('🌍');

        try {
            // Use restcountries API (Highly reliable, no key needed)
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=true`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();
            const c = data[0];

            if (!c) throw new Error('No data');

            // Extract data safely with fallbacks
            const countryName = c.name.common;
            const capital = c.capital ? c.capital[0] : 'N/A';
            const population = c.population ? c.population.toLocaleString() : 'N/A';
            
            // Extract currency (e.g., "Nigerian naira (₦)")
            let currency = 'N/A';
            if (c.currencies) {
                const curKey = Object.keys(c.currencies)[0];
                const curData = c.currencies[curKey];
                currency = `${curData.name} (${curData.symbol || curKey})`;
            }

            // Extract languages
            const languages = c.languages ? Object.values(c.languages).join(', ') : 'N/A';
            
            // Extract dial code
            let dialCode = 'N/A';
            if (c.idd && c.idd.root) {
                dialCode = `${c.idd.root}${c.idd.suffixes ? c.idd.suffixes[0] : ''}`;
            }

            const region = c.region || 'N/A';
            const flagUrl = c.flags?.png || c.flags?.svg;

            // Build the message
            let msg = `🌍 *${countryName}*\n━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `🏙️ *Capital:* ${capital}\n`;
            msg += `👥 *Population:* ${population}\n`;
            msg += `💰 *Currency:* ${currency}\n`;
            msg += `🗣️ *Languages:* ${languages}\n`;
            msg += `🌐 *Region:* ${region}\n`;
            msg += `🌍 *ISO Code:* ${c.cca2} / ${c.cca3}\n`;
            msg += `📞 *Dial Code:* ${dialCode}\n`;

            // Send as Image with Caption
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
            console.error('Country error:', e.message);
            await ctx.react('❌');
            await ctx.reply(`❌ *Country not found:* "${name}"\n\n_Try checking your spelling or using the English name._`);
        }
    }
};