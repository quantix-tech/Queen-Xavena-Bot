import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'pinterest',
    aliases: ['pin', 'pindl'],
    description: 'Download Pinterest images or videos',
    category: 'Download',
    ownerOnly: false,
    usage: 'pinterest <url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let url = args[0];

        if (!url) {
            return ctx.reply(`📌 *Pinterest Downloader*\n\nUsage: \`${prefix}pinterest <url>\`\nExample: \`${prefix}pinterest https://pin.it/xxxxx\``);
        }

        if (!url.includes('pin.it') && !url.includes('pinterest.com')) {
            return ctx.reply('❌ *Invalid Link*\n\nPlease provide a valid Pinterest URL.');
        }

        await ctx.reply(`📌 *Pinterest*\n\n⏳ _Fetching media..._`);

        const apiUrl = `https://prexzyapis.com/download/pinterestV2?url=${encodeURIComponent(url)}`;

        try {
            const response = await axios.get(apiUrl, { timeout: 20000 });
            const data = response.data;

            // Robust Parser
            const result = data.result || data.data || data;
            
            // Pinterest can return video or image
            const mediaUrl = result.video || result.video_url || result.image || result.image_url || result.url || result.link;
            const isVideo = !!(result.video || result.video_url || (mediaUrl && mediaUrl.includes('.mp4')));

            if (!mediaUrl) {
                throw new Error('Could not find any media in the API response.');
            }

            await ctx.reply(`⏳ _Downloading ${isVideo ? 'video' : 'image'}..._`);

            // Download media
            const fileRes = await axios.get(mediaUrl, { 
                responseType: 'arraybuffer', 
                timeout: 60000 
            });
            const fileBuffer = Buffer.from(fileRes.data);

            if (isVideo) {
                await sock.sendMessage(m.key.remoteJid, {
                    video: fileBuffer,
                    mimetype: 'video/mp4',
                    caption: `📌 *Pinterest Video*\n\n> Powered by Queen Xavena`
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, {
                    image: fileBuffer,
                    caption: `📌 *Pinterest Image*\n\n> Powered by Queen Xavena`
                }, { quoted: m });
            }

        } catch (err) {
            console.error('Pinterest error:', err);
            await ctx.reply(`❌ *Download Failed*\n\nCould not fetch Pinterest media. The link might be invalid or private.`);
        }
    }
};