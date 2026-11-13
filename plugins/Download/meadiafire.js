import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'mediafire',
    aliases: ['mf', 'mfdl'],
    description: 'Download files from MediaFire',
    category: 'Download',
    ownerOnly: false,
    usage: 'mediafire <url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let url = args[0];

        if (!url) {
            return ctx.reply(`📦 *MediaFire Downloader*\n\nUsage: \`${prefix}mediafire <url>\`\nExample: \`${prefix}mediafire https://www.mediafire.com/file/...\``);
        }

        if (!url.includes('mediafire.com')) {
            return ctx.reply('❌ *Invalid Link*\n\nPlease provide a valid MediaFire URL.');
        }

        await ctx.reply(`📦 *MediaFire*\n\n⏳ _Fetching file info..._`);

        const apiUrl = `https://prexzyapis.com/download/mediafire?url=${encodeURIComponent(url)}`;

        try {
            const response = await axios.get(apiUrl, { timeout: 20000 });
            const data = response.data;

            // Robust Parser
            const result = data.result || data.data || data;
            const downloadUrl = result.downloadUrl || result.link || result.url;
            const fileName = result.fileName || result.name || 'mediafire_file.zip';
            const fileSize = result.fileSize || result.size || 'Unknown';

            if (!downloadUrl) {
                throw new Error('Could not find a download link in the API response.');
            }

            await ctx.reply(`⏳ _Downloading ${fileName}..._`);

            // Download the file into memory
            const fileRes = await axios.get(downloadUrl, { 
                responseType: 'arraybuffer', 
                timeout: 120000 
            });
            const fileBuffer = Buffer.from(fileRes.data);

            // Check size limit (100MB)
            const fileSizeMB = fileBuffer.length / (1024 * 1024);
            if (fileSizeMB > 100) {
                return ctx.reply(`❌ *File Too Large*\nThe file is ${fileSizeMB.toFixed(1)}MB, exceeding WhatsApp's limit.`);
            }

            await sock.sendMessage(m.key.remoteJid, {
                document: fileBuffer,
                fileName: fileName,
                mimetype: 'application/octet-stream',
                caption: `📦 *MediaFire Download*\n\n*File:* ${fileName}\n*Size:* ${fileSizeMB.toFixed(2)} MB\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (err) {
            console.error('MediaFire error:', err);
            await ctx.reply(`❌ *Download Failed*\n\nCould not fetch the file from MediaFire.\n_Note: The file might be deleted or private._`);
        }
    }
};