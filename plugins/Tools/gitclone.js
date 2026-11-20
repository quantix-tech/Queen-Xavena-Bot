import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'gitclone',
    aliases: ['githubclone', 'repoclone'],
    description: 'Download a GitHub repository as a ZIP file',
    category: 'Tools',
    ownerOnly: false,
    usage: 'gitclone <github_url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const url = args.join(' ').trim();

        if (!url) {
            return ctx.reply(`📦 *Git Clone*\n\n*Usage:* \`${prefix}gitclone <github_url>\`\n*Example:* \`${prefix}gitclone https://github.com/Quantix-tech/queen-xavena\``);
        }

        if (!url.includes('github.com')) {
            return ctx.reply(`❌ *Error*\n\nPlease provide a valid GitHub repository URL.`);
        }

        await ctx.reply(`⏳ _Fetching repository info..._`);

        try {
            const apiUrl = `https://api-rebix.zone.id/api/gitclone?url=${encodeURIComponent(url)}`;
            const res = await axios.get(apiUrl, { timeout: 30000 });
            const data = res.data;

            if (!data.success || !data.download_url) {
                return ctx.reply(`❌ *Error*\n\nCould not fetch repository.\n_Make sure the repo is public._`);
            }

            const { repository, download_url, filename } = data;

            await ctx.reply(`⏳ _Downloading ZIP archive..._`);

            // Download the zip
            const zipRes = await axios.get(download_url, {
                responseType: 'arraybuffer',
                timeout: 120000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (!zipRes.data || zipRes.data.byteLength < 500) {
                return ctx.reply(`❌ *Error*\n\nFailed to download repository.`);
            }

            const zipBuffer = Buffer.from(zipRes.data);
            const sizeMb = (zipBuffer.length / 1024 / 1024).toFixed(2);

            await sock.sendMessage(m.key.remoteJid, {
                document: zipBuffer,
                fileName: filename || `${repository.replace('/', '-')}.zip`,
                mimetype: 'application/zip',
                caption: `📦 *Git Clone*\n\n*Repo:* ${repository}\n*Size:* ${sizeMb} MB\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (error) {
            console.error('GitClone error:', error.message);
            await ctx.reply(`❌ *Error*\n\nFailed to clone repository.\n_Note:_ ${error.message}`);
        }
    }
};