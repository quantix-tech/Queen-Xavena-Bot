import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'tiktok',
    aliases: ['tt'],
    description: 'Download TikTok videos without watermark',
    category: 'Download',
    ownerOnly: false,
    usage: 'tiktok <url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let url = args[0];

        if (!url) {
            return ctx.reply(`📱 *TikTok Downloader*\n\nUsage: \`${prefix}tiktok <url>\`\nExample: \`${prefix}tiktok https://vm.tiktok.com/xxxxx\``);
        }

        if (!url.includes('tiktok.com') && !url.includes('vm.tiktok')) {
            return ctx.reply('❌ *Invalid Link*\n\nPlease provide a valid TikTok URL.');
        }

        await ctx.reply(`📱 *TikTok*\n\n⏳ _Fetching video..._`);

        const tiktokApiUrl = `https://api.bk9.dev/download/tiktok?url=${encodeURIComponent(url)}`;

        try {
            const response = await axios.get(tiktokApiUrl, { timeout: 15000 });
            const data = response.data;

            if (!data.status || !data.BK9 || !data.BK9.BK9) {
                throw new Error('No download link found.');
            }

            const videoUrl = data.BK9.BK9;
            const videoTitle = data.BK9.title || 'TikTok Video';

            // Download the video into memory
            const videoRes = await axios.get(videoUrl, { 
                responseType: 'arraybuffer', 
                timeout: 60000 
            });
            const videoBuffer = Buffer.from(videoRes.data);

            // Send the video
            await sock.sendMessage(m.key.remoteJid, {
                video: videoBuffer,
                caption: `📱 *TikTok Video*\n\n*Title:* ${videoTitle.substring(0, 40)}${videoTitle.length > 40 ? '...' : ''}\n*Quality:* No watermark\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (err) {
            console.error('TikTok error:', err);
            await ctx.reply(`❌ *Download Failed*\n\n${err.message || 'Could not fetch video'}\n_Note: Try a different TikTok link._`);
        }
    }
};
