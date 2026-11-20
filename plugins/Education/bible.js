import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'bible',
    aliases: ['verse'],
    description: 'Lookup Bible verses',
    category: 'Education',
    ownerOnly: false,
    usage: 'bible <reference> OR bible <search>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const query = args.join(' ').trim();
        
        if (!query) {
            return ctx.reply(`📖 *Bible*\n\n*Usage:*\n\`${prefix}bible <reference>\`\n\`${prefix}bible <search query>\`\n\n*Examples:*\n\`${prefix}bible john 3:16\`\n\`${prefix}bible psalm 23\`\n\`${prefix}bible love\``);
        }

        const apiBase = 'https://bible-api.com';

        try {
            const isReference = /\d/.test(query);

            if (isReference) {
                // ─── Verse lookup ───
                const res = await axios.get(`${apiBase}/${encodeURIComponent(query)}`, { timeout: 15000 });
                const d = res.data;

                if (!d.text) {
                    return ctx.reply(`❌ *Not Found*\n\nCould not find: ${query}`);
                }

                const cleanText = d.text.replace(/\s+/g, ' ').trim();
                const ref = d.reference || query;
                const translation = d.translation_name || 'N/A';

                let text = `📖 *${ref}*\n\n"${cleanText}"\n\n_${translation}_`;

                if (text.length > 4000) {
                    text = `📖 *${ref}*\n\n"${cleanText.substring(0, 3500)}..."\n\n_${translation}_`;
                }

                await ctx.reply(text);
            } else {
                // ─── Search (Random verse) ───
                const res = await axios.get(`https://bible-api.com/data/web/random`, { timeout: 15000 });
                const d = res.data;

                if (!d.random_verse) {
                    return ctx.reply(`❌ *Error*\n\nCould not fetch a random verse.`);
                }

                const v = d.random_verse;
                const ref = `${v.book} ${v.chapter}:${v.verse}`;
                const cleanText = (v.text || '').replace(/\s+/g, ' ').trim();

                await ctx.reply(`📖 *${ref}*\n\n"${cleanText}"\n\n_${d.translation?.name || 'World English Bible'}_\n\n_Search for specific verses with:_ \`${prefix}bible john 3:16\``);
            }
        } catch (error) {
            console.error('Bible error:', error.message);

            if (error.response?.status === 404) {
                return ctx.reply(`❌ *Not Found*\n\nCould not find: ${query}\n\n_Try formats like:_ john 3:16, psalm 23, genesis 1`);
            }

            await ctx.reply(`❌ *Error*\n\nFailed to fetch Bible verse.\n_Note:_ ${error.message}`);
        }
    }
};