import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'gitclone',
    aliases: ['github', 'ghdl'],
    description: 'Download a GitHub repository as a ZIP',
    category: 'Download',
    ownerOnly: false,
    usage: 'gitclone <repo_url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let url = args[0];

        if (!url) {
            return ctx.reply(`🐙 *GitHub Cloner*\n\nUsage: \`${prefix}gitclone <repo_url>\`\nExample: \`${prefix}gitclone https://github.com/Quantix-tech/queen-xavena\``);
        }

        if (!url.includes('github.com')) {
            return ctx.reply('❌ *Invalid Link*\n\nPlease provide a valid GitHub repository URL.');
        }

        await ctx.reply(`🐙 *GitHub*\n\n⏳ _Fetching repository..._`);

        const apiUrl = `https://prexzyapis.com/download/github?url=${encodeURIComponent(url)}`;

        try {
            const response = await axios.get(apiUrl, { timeout: 20000 });
            const data = response.data;

            // Robust Parser
            const result = data.result || data.data || data;
            const downloadUrl = result.download_url || result.downloadUrl || result.url || result.link;
            const repoName = result.repo || result.name || 'repository';
            const zipName = result.filename || `${repoName}.zip`;

            if (!downloadUrl) {
                throw new Error('Could not find a download link in the API response.');
            }

            await ctx.reply(`⏳ _Downloading ZIP archive..._`);

            // Download the zip file
            const fileRes = await axios.get(downloadUrl, { 
                responseType: 'arraybuffer', 
                timeout: 120000 
            });
            const fileBuffer = Buffer.from(fileRes.data);
            const fileSizeMB = fileBuffer.length / (1024 * 1024);

            if (fileSizeMB > 100) {
                return ctx.reply(`❌ *File Too Large*\nThe ZIP is ${fileSizeMB.toFixed(1)}MB, exceeding WhatsApp's limit.`);
            }

            await sock.sendMessage(m.key.remoteJid, {
                document: fileBuffer,
                fileName: zipName,
                mimetype: 'application/zip',
                caption: `🐙 *GitHub Repository*\n\n*Name:* ${repoName}\n*Size:* ${fileSizeMB.toFixed(2)} MB\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (err) {
            console.error('GitHub error:', err);
            await ctx.reply(`❌ *Download Failed*\n\nCould not clone the repository. Make sure it is public.`);
        }
    }
};