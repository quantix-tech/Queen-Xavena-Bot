import yts from 'yt-search';
import axios from 'axios';
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

            const foundText = `🎬 *Found:* ${res.title}\n⏱ *Duration:* ${res.timestamp}\n\n⏳ _Fetching download link..._`;

            // Send thumbnail + text
            if (res.thumbnail) {
                await sock.sendMessage(m.key.remoteJid, {
                    image: { url: res.thumbnail },
                    caption: foundText
                }, { quoted: m });
            } else {
                await ctx.reply(foundText);
            }

            // 2. Use Prexzy API to get the video link
            // Assuming the endpoint is similar to ytmp3, usually it's /download/ytmp4 or /download/ytvideo
            const apiUrl = `https://prexzyapis.com/download/ytmp4?url=${encodeURIComponent(res.url)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const data = response.data;

            // Robust parsing
            let videoUrl = null;
            if (data.result) {
                videoUrl = data.result.video || data.result.url || data.result.download || data.result.link || data.result.mp4;
            } else if (data.data) {
                videoUrl = data.data.video || data.data.url || data.data.download || data.data.link || data.data.mp4;
            } else {
                videoUrl = data.video || data.url || data.download || data.link || data.mp4;
            }

            if (!videoUrl) {
                throw new Error('API did not return a video link.');
            }

            await ctx.reply(`⏳ _Downloading video to server..._`);

            // 3. Download the video buffer to check size and send
            const videoRes = await axios.get(videoUrl, { 
                responseType: 'arraybuffer', 
                timeout: 120000 
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