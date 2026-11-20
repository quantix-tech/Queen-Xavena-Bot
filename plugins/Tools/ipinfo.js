import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'ipinfo',
    aliases: ['iplookup', 'ip'],
    description: 'Lookup information about an IP address',
    category: 'Tools',
    ownerOnly: false,
    usage: 'ipinfo <ip>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let target = args[0]?.trim() || '';

        // If no arg, check if they replied to a message containing an IP
        if (!target && ctx.quoted && ctx.quoted.text) {
            target = ctx.quoted.text.trim();
        }

        // Validation
        if (target && !/^(\d{1,3}\.){3}\d{1,3}$/.test(target) && !/^[a-f0-9:]+$/i.test(target)) {
            return ctx.reply(`🌍 *IP Info*\n\nUsage: \`${prefix}ipinfo <ip>\`\nExample: \`${prefix}ipinfo 8.8.8.8\`\n\n_Or leave empty to detect your own._`);
        }

        try {
            const url = target
                ? `https://ipapi.co/${encodeURIComponent(target)}/json/`
                : `https://ipapi.co/json/`;

            const res = await axios.get(url, { timeout: 15000 });
            const d = res.data;

            if (d.error) {
                return ctx.reply(`❌ *Error*\n\n${d.reason || 'Invalid IP or lookup failed.'}`);
            }

            const text = `🌍 *IP Info*\n\n` +
                `*IP:* ${d.ip || 'N/A'}\n` +
                `*Type:* ${d.version || 'N/A'}\n` +
                `*City:* ${d.city || 'N/A'}\n` +
                `*Region:* ${d.region || 'N/A'}\n` +
                `*Country:* ${d.country_name || 'N/A'} (${d.country_code || 'N/A'})\n` +
                `*Postal:* ${d.postal || 'N/A'}\n` +
                `*Latitude:* ${d.latitude || 'N/A'}\n` +
                `*Longitude:* ${d.longitude || 'N/A'}\n` +
                `*Timezone:* ${d.timezone || 'N/A'}\n` +
                `*UTC Offset:* ${d.utc_offset || 'N/A'}\n\n` +
                `*ISP:* ${d.org || 'N/A'}\n` +
                `*ASN:* ${d.asn || 'N/A'}\n` +
                `*Currency:* ${d.currency || 'N/A'}\n` +
                `*Languages:* ${d.languages || 'N/A'}`;

            await ctx.reply(text);
        } catch (error) {
            console.error('IPInfo error:', error.message);

            if (error.response?.status === 429) {
                return ctx.reply(`❌ *Rate Limited*\n\nToo many requests. Try again in a minute.`);
            }

            await ctx.reply(`❌ *Error*\n\nFailed to lookup IP.\n_Note:_ ${error.message}`);
        }
    }
};