import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'wagroupsearch',
    aliases: ['wagcsearch', 'groupsearch', 'gcsearch'],
    description: 'Search for WhatsApp groups',
    category: 'Group',
    ownerOnly: false,
    usage: 'wagroupsearch <keyword>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const query = args.join(' ').trim();

        if (!query) {
            return ctx.reply(`🔍 *WhatsApp Group Search*\n\n*Usage:* \`${prefix}wagroupsearch <keyword>\`\n*Example:* \`${prefix}wagroupsearch God\``);
        }

        try {
            const apiUrl = `https://api.deline.web.id/search/grubwa?q=${encodeURIComponent(query)}`;
            const res = await axios.get(apiUrl, { timeout: 30000 });
            const data = res.data;

            if (!data.status || !data.result || data.result.length === 0) {
                return ctx.reply(`❌ *No Results*\n\nNo WhatsApp groups found for: ${query}`);
            }

            const results = data.result.slice(0, 5);

            let text = `🔍 *WhatsApp Group Search*\n\n*Query:* ${query}\n*Total:* ${data.total || results.length}\n\n`;

            results.forEach((g, i) => {
                const name = g.Name || 'Untitled';
                const link = g.Link || 'No link';
                const desc = g.Description ? g.Description.substring(0, 60) : 'No description';
                text += `*${i + 1}. ${name}*\n`;
                text += `📝 _${desc}${g.Description && g.Description.length > 60 ? '...' : ''}_\n`;
                text += `🔗 ${link}\n\n`;
            });

            text += `_Showing ${results.length} of ${data.total || results.length}_`;

            await ctx.reply(text);
        } catch (error) {
            console.error('WAGroupSearch error:', error.message);
            await ctx.reply(`❌ *Error*\n\nFailed to search WhatsApp groups.\n_Note:_ ${error.message}`);
        }
    }
};