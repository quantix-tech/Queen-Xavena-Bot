import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'facebook',
    aliases: ['fb', 'fbdl'],
    description: 'Download Facebook videos',
    category: 'Download',
    ownerOnly: false,
    usage: 'facebook <url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let url = args[0];

        if (!url) {
            return ctx.reply(`📘 *Facebook Downloader*\n\nUsage: \`${prefix}facebook <url>\`\nExample: \`${prefix}facebook https://www.facebook.com/watch?v=xxxxx\``);
        }

        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return ctx.reply('❌ *Invalid Link*\n\nPlease provide a valid Facebook URL.');
        }

        await ctx.reply(`📘 *Facebook*\n\n⏳ _Fetching video..._`);

       
        const apiUrl = `https://prexzyapis.com/download/facebook?url=${encodeURIComponent(url)}`;

        try {
            const response = await axios.get(apiUrl, { timeout: 20000 });
            const data = response.data;

            // ─── ROBUST PARSER ───
            // Facebook APIs usually return an object with HD and SD links inside result/data
            let mediaData = data.result || data.data || data.media || data;
            let videoUrl = null;

            if (typeof mediaData === 'string' && mediaData.startsWith('http')) {
                videoUrl = mediaData;
            } else if (typeof mediaData === 'object') {
                // Try to grab HD first, then SD, then any generic URL
                videoUrl = mediaData.hd || mediaData.sd || mediaData.url || mediaData.video || mediaData.link;
            }

            if (!videoUrl) {
                throw new Error('Could not find a video link in the API response.');
            }

            await ctx.reply(`⏳ _Downloading video..._`);

            // Download the video into memory (prevents link expiration issues)
            const videoRes = await axios.get(videoUrl, { 
                responseType: 'arraybuffer', 
                timeout: 60000 
            });
            const videoBuffer = Buffer.from(videoRes.data);

            // Check size (WhatsApp limit ~100MB)
            const fileSizeMB = videoBuffer.length / (1024 * 1024);
            if (fileSizeMB > 100) {
                return ctx.reply(`❌ *File Too Large*\nThe video is ${fileSizeMB.toFixed(1)}MB, exceeding WhatsApp's limit.`);
            }

            // Send the video
            await sock.sendMessage(m.key.remoteJid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: `📘 *Facebook Video*\n\n*Size:* ${fileSizeMB.toFixed(1)}MB\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (err) {
            console.error('Facebook error:', err);
            await ctx.reply(`❌ *Download Failed*\n\nCould not fetch the Facebook video. It might be private, or the API is down.\n_Note: Try a different link._`);
        }
    }
};