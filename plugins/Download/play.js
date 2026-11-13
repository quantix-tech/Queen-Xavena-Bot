import yts from 'yt-search';
import ytdl from '@vreden/youtube_scraper';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'play',
    aliases: ['song', 'ytmp3'],
    description: 'Download audio from YouTube',
    category: 'Download',
    ownerOnly: false,
    usage: 'play <song name>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const query = args.join(' ');
        
        if (!query) {
            return ctx.reply(`❌ *Play*\n\nUsage: \`${prefix}play <song name>\`\nExample: \`${prefix}play Faded\``);
        }

        await ctx.reply(`🔍 *Searching YouTube for:* ${query}...`);

        try {
            // 1. Search YouTube
            const ytsSearch = await yts(query);
            const res = ytsSearch?.all?.[0];

            if (!res) {
                return ctx.reply(`❌ *Not Found*\n\nNo results for: ${query}`);
            }

            const foundText = `🎵 *Found:* ${res.title}\n⏱ *Duration:* ${res.timestamp}\n\n⏳ _Downloading audio..._`;

            // 2. Send the "Found" message with the thumbnail image
            if (res.thumbnail) {
                await sock.sendMessage(m.key.remoteJid, {
                    image: { url: res.thumbnail },
                    caption: foundText
                }, { quoted: m });
            } else {
                await ctx.reply(foundText);
            }

            // 3. Get MP3 download link using the scraper
            const anu = await ytdl.ytmp3(res.url);

            if (!anu?.status || !anu?.download?.url) {
                throw new Error('Could not fetch audio link.');
            }

            const urlMp3 = anu.download.url;

            // 4. Send audio (No externalAdReply)
            await sock.sendMessage(m.key.remoteJid, {
                audio: { url: urlMp3 },
                mimetype: 'audio/mpeg',
                fileName: `${res.title}.mp3`
            }, { quoted: m });

        } catch (err) {
            console.error('Play error:', err);
            await ctx.reply(`❌ *Download Failed*\nYouTube is blocking the request or the video is unavailable.\n_Error: ${err.message}_`);
        }
    }
};