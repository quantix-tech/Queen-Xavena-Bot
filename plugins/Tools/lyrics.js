import { getLyrics } from '../../lib/lyrics.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'lyrics',
    aliases: ['lyric', 'lrc'],
    description: 'Search for song lyrics',
    category: 'Tools',
    ownerOnly: false,
    usage: 'lyrics <song name or artist - title>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const query = args.join(' ');

        if (!query) {
            return ctx.reply(`🎵 *Lyrics Search*\n\nUsage: \`${prefix}lyrics <song name>\`\n\n*Examples:*\n\`${prefix}lyrics Faded by Alan Walker\`\n\`${prefix}lyrics The Weeknd - Blinding Lights\`\n\`${prefix}lyrics Blinding Lights\``);
        }

        await ctx.reply(`🔍 *Searching for lyrics:* ${query}...`);

        try {
            const result = await getLyrics(query);

            if (!result.success) {
                return ctx.reply(`❌ *Not Found*\n\nCould not find lyrics for: ${query}\n_Try using the format: Artist - Title_`);
            }

            // Format the response
            let text = `🎵 *${result.title}*\n`;
            text += `👤 *Artist:* ${result.artist}\n`;
            
            if (result.album) text += `💿 *Album:* ${result.album}\n`;
            
            if (result.duration) {
                const min = Math.floor(result.duration / 60);
                const sec = String(result.duration % 60).padStart(2, '0');
                text += `⏱️ *Duration:* ${min}:${sec}\n`;
            }
            
            text += `\n${result.lyrics}\n\n_Source: ${result.source}_`;

            // WhatsApp message limit is ~65536 chars, safe to truncate at 50000
            if (text.length > 50000) {
                text = text.substring(0, 49000) + '\n\n... (truncated)';
            }

            await ctx.reply(text);

        } catch (err) {
            console.error('Lyrics error:', err.message);
            await ctx.reply(`❌ *Error*\nFailed to fetch lyrics. The API might be temporarily down.`);
        }
    }
};