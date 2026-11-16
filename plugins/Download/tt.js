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

        let videoUrl = null;
        let videoTitle = 'TikTok Video';

        // ─── ATTEMPT 1: BK9 API ───
        try {
            console.log('[tiktok] Trying BK9 API...');
            const res = await axios.get(`https://api.bk9.dev/download/tiktok?url=${encodeURIComponent(url)}`, { timeout: 30000 });
            
            if (res.data?.status && res.data?.BK9?.BK9) {
                videoUrl = res.data.BK9.BK9;
                videoTitle = res.data.BK9.title || videoTitle;
                console.log('[tiktok] BK9 API Success!');
            } else {
                throw new Error('Invalid BK9 response format');
            }
        } catch (err) {
            console.log(`[tiktok] BK9 API failed or timed out (${err.message}). Trying Prexzy fallback...`);

            // ─── ATTEMPT 2: Prexzy API Fallback ───
            try {
                const res = await axios.get(`https://prexzyapis.com/download/tiktok?url=${encodeURIComponent(url)}`, { timeout: 30000 });
                const data = res.data;

                // Robust parsing for Prexzy response
                const result = data.result || data.data || data;
                videoUrl = result.video || result.video_url || result.url || result.play || result.hd;
                videoTitle = result.title || videoTitle;

                if (!videoUrl) throw new Error('No video URL found in Prexzy response');
                console.log('[tiktok] Prexzy API Success!');
            } catch (fallbackErr) {
                console.error('[tiktok] Both APIs failed:', fallbackErr.message);
                return ctx.reply(`❌ *Download Failed*\n\nCould not fetch the TikTok video. The API might be down or the link is invalid.\n_Error: ${fallbackErr.message}_`);
            }
        }

        // ─── DOWNLOAD AND SEND ───
        try {
            // Download the video into memory
            const videoRes = await axios.get(videoUrl, { 
                responseType: 'arraybuffer', 
                timeout: 60000 
            });
            const videoBuffer = Buffer.from(videoRes.data);

            await sock.sendMessage(m.key.remoteJid, {
                video: videoBuffer,
                caption: `📱 *TikTok Video*\n\n*Title:* ${videoTitle.substring(0, 40)}${videoTitle.length > 40 ? '...' : ''}\n*Quality:* No watermark\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (downloadErr) {
            console.error('[tiktok] Failed to download video file:', downloadErr.message);
            await ctx.reply(`❌ *Download Failed*\nFailed to download the video file from the server. It might be too large or the link expired.`);
        }
    }
};