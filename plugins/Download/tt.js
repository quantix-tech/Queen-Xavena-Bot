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

        try {
            // ─── SINGLE API: Prexzy ───
            const res = await axios.get(`https://prexzyapis.com/download/tiktok?url=${encodeURIComponent(url)}`, { timeout: 30000 });
            
            // Real structure is: res.data.data
            const data = res.data?.data;

            if (!res.data?.status || !data) {
                throw new Error('API returned no data');
            }

            // play = no watermark, hdplay = HD no watermark, wmplay = with watermark
            const videoUrl = data.hdplay || data.play;
            const videoTitle = data.title || 'TikTok Video';
            const author = data.author?.nickname || data.author?.unique_id || 'Unknown';
            const duration = data.duration || 0;

            if (!videoUrl) throw new Error('No video URL found');

            // ─── DOWNLOAD AND SEND ───
            const videoRes = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://www.tiktok.com/'
                }
            });
            const videoBuffer = Buffer.from(videoRes.data);

            await sock.sendMessage(m.key.remoteJid, {
                video: videoBuffer,
                caption: `📱 *TikTok Video*\n\n*Title:* ${videoTitle.substring(0, 80)}${videoTitle.length > 80 ? '...' : ''}\n*Author:* @${author}\n*Duration:* ${duration}s\n*Quality:* No watermark\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (err) {
            console.error('[tiktok] Failed:', err.message);
            return ctx.reply(`❌ *Download Failed*\n\nCould not fetch the TikTok video. The API might be down or the link is invalid.\n_Error: ${err.message}_`);
        }
    }
};