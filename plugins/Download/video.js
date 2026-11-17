import yts from 'yt-search';
import axios from 'axios';
import ytdl from '@vreden/youtube_scraper';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'video',
    aliases: ['ytmp4', 'ytvideo', 'mp4'],
    description: 'Download video from YouTube',
    category: 'Download',
    ownerOnly: false,
    usage: 'video <video name>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const query = args.join(' ');
        
        if (!query) {
            return ctx.reply(`❌ *Video*\n\nUsage: \`${prefix}video <video name>\`\nExample: \`${prefix}video Alan Walker Faded\``);
        }

        await ctx.reply(`🔍 *Searching YouTube for:* ${query}...`);

        try {
            // 1. Search YouTube
            const ytsSearch = await yts(query);
            const res = ytsSearch?.all?.[0];

            if (!res) {
                return ctx.reply(`❌ *Not Found*\n\nNo results for: ${query}`);
            }

            // 2. Check Duration (Protect against massive files)
            const durationSeconds = res.seconds;
            if (durationSeconds && durationSeconds > 1200) { // 1200s = 20 minutes
                return ctx.reply(`⚠️ *Video Too Long*\n\nThis video is ${res.timestamp} long. WhatsApp has a 100MB limit, and large videos usually fail to download.\n\nPlease try a shorter video or use \`${prefix}play\` for audio instead.`);
            }

            const foundText = `🎬 *Found:* ${res.title}\n⏱ *Duration:* ${res.timestamp || 'Unknown'}\n\n⏳ _Fetching download link..._`;

            if (res.thumbnail) {
                await sock.sendMessage(m.key.remoteJid, {
                    image: { url: res.thumbnail },
                    caption: foundText
                }, { quoted: m });
            } else {
                await ctx.reply(foundText);
            }

            let videoUrl = null;

            // ─── ATTEMPT 1: Prexzy API ───
            try {
                console.log('[video] Trying Prexzy API...');
                const apiUrl = `https://prexzyapis.com/download/ytmp4?url=${encodeURIComponent(res.url)}`;
                const response = await axios.get(apiUrl, { timeout: 60000 }); // 60 seconds timeout
                const data = response.data;

                const result = data.result || data.data || data;
                videoUrl = result.video || result.url || result.download || result.link || result.mp4;

                if (!videoUrl) throw new Error('No link in Prexzy response');
                console.log('[video] Prexzy API Success!');
            } catch (apiErr) {
                console.log(`[video] Prexzy failed (${apiErr.message}). Trying fallback...`);

                // ─── ATTEMPT 2: Vreden Scraper Fallback ───
                try {
                    const anu = await ytdl.ytmp4(res.url);
                    if (anu?.status && anu?.download?.url) {
                        videoUrl = anu.download.url;
                        console.log('[video] Vreden Fallback Success!');
                    } else {
                        throw new Error('No link in Vreden response');
                    }
                } catch (fallbackErr) {
                    throw new Error(`All APIs failed. Last error: ${fallbackErr.message}`);
                }
            }

            await ctx.reply(`⏳ _Downloading video to server..._`);

            // 3. Download the video buffer
            const videoRes = await axios.get(videoUrl, { 
                responseType: 'arraybuffer', 
                timeout: 120000 // 2 minutes to download
            });
            const videoBuffer = Buffer.from(videoRes.data);

            // Check size limit (100MB)
            const fileSizeMB = videoBuffer.length / (1024 * 1024);
            if (fileSizeMB > 100) {
                return ctx.reply(`❌ *File Too Large*\nThe video is ${fileSizeMB.toFixed(1)}MB, which exceeds WhatsApp's 100MB limit.`);
            }

            // 4. Send the video
            await sock.sendMessage(m.key.remoteJid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `${res.title}.mp4`,
                caption: `🎬 *${res.title}*\n\n📦 *Size:* ${fileSizeMB.toFixed(1)}MB\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (err) {
            console.error('Video error:', err);
            await ctx.reply(`❌ *Download Failed*\nCould not download the video. The API might be down or the video is restricted.\n_Error: ${err.message}_`);
        }
    }
};