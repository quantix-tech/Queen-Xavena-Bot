import axios from 'axios';
import FormData from 'form-data';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'url',
    aliases: ['tourl', 'upload'],
    description: 'Upload replied media and get a direct URL',
    category: 'Tools',
    ownerOnly: false,
    usage: 'url (reply to media)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted) {
            return ctx.reply(`🔗 *URL Uploader*\n\nReply to an image, video, or document with \`${prefix}url\`.`);
        }

        const media = await ctx.getMedia();
        if (!media) {
            return ctx.reply('❌ Failed to download the replied media.');
        }

        await ctx.reply(`⏳ _Uploading..._`);

        try {
            const form = new FormData();
            
            // Determine a filename and extension based on mimetype
            let ext = 'bin';
            if (media.isImage) ext = 'jpg';
            else if (media.isVideo) ext = 'mp4';
            else if (media.isAudio) ext = 'mp3';
            else if (media.mimetype) {
                const parts = media.mimetype.split('/');
                if (parts.length > 1) ext = parts[1].split(';')[0];
            }

            const filename = `file_${Date.now()}.${ext}`;
            form.append('file', media.buffer, { filename });

            // Your Render Uploader Endpoint
            const UPLOADER_ENDPOINT = 'https://xaven-uploader.onrender.com/upload'; 
            
            const response = await axios.post(UPLOADER_ENDPOINT, form, {
                headers: {
                    ...form.getHeaders(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000, // 👈 Increased to 120 seconds to handle Render cold starts
            });

            const data = response.data;

            if (!data.success || !data.url) {
                throw new Error(data.error || 'Uploader returned an invalid response.');
            }

            await ctx.reply(`✅ *Upload Successful*\n\n🔗 *URL:* ${data.url}`);

        } catch (err) {
            console.error('URL Upload error:', err.message);
            await ctx.reply(`❌ *Upload Failed*\n\nCould not upload the media.\n_Error: ${err.message}_`);
        }
    }
};