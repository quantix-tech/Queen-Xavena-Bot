import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'get',
    aliases: ['fetch', 'curl'],
    description: 'Fetch HTTP status, headers, and body preview from a URL',
    category: 'Tools',
    ownerOnly: false,
    usage: 'get <url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let url = args[0];

        if (!url) {
            return ctx.reply(`🌐 *HTTP Get*\n\nUsage: \`${prefix}get <url>\`\nExample: \`${prefix}get https://api.github.com\``);
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        await ctx.reply(`⏳ _Fetching ${url}..._`);

        try {
            const res = await axios.get(url, {
                validateStatus: () => true, // Don't throw on 404/500
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            // Format Headers
            let headersText = '';
            for (const [key, value] of Object.entries(res.headers)) {
                headersText += `├◆ *${key}:* ${value}\n`;
            }

            // Format Body (JSON or Text)
            let bodyText = '';
            if (typeof res.data === 'object') {
                bodyText = JSON.stringify(res.data, null, 2);
            } else {
                bodyText = String(res.data);
            }

            // Limit body size to avoid exceeding WhatsApp message limits (4096 chars)
            if (bodyText.length > 1000) {
                bodyText = bodyText.substring(0, 1000) + '\n... (truncated)';
            }

            const text = `🌐 *HTTP Get*\n\n` +
                         `*URL:* ${url}\n` +
                         `*Status:* ${res.status} ${res.statusText}\n\n` +
                         `┌─〔 📋 HEADERS 〕\n${headersText}└─────────────◆\n\n` +
                         `┌─〔 📄 BODY PREVIEW 〕\n${bodyText}\n└─────────────◆`;

            await ctx.reply(text);

        } catch (err) {
            console.error('GET error:', err.message);
            await ctx.reply(`❌ *Request Failed*\n_Error: ${err.message}_`);
        }
    }
};