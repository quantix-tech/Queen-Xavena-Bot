import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'npm',
    aliases: ['npminfo'],
    description: 'Get information about an NPM package',
    category: 'Tools',
    ownerOnly: false,
    usage: 'npm <package>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const pkg = args[0];

        if (!pkg) {
            return ctx.reply(`📦 *NPM Info*\n\n*Usage:* \`${prefix}npm <package>\`\n*Example:* \`${prefix}npm express\``);
        }

        await ctx.reply(`⏳ _Fetching NPM data for ${pkg}..._`);

        try {
            const res = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, {
                timeout: 15000
            });

            const data = res.data;
            const latest = data['dist-tags']?.latest;
            const versionData = data.versions?.[latest] || {};

            const name = data.name || pkg;
            const description = data.description || 'No description';
            const author = typeof data.author === 'string' ? data.author : (data.author?.name || 'Unknown');
            const license = data.license || versionData.license || 'N/A';
            const homepage = data.homepage || versionData.homepage || 'N/A';
            const repo = typeof data.repository === 'string' ? data.repository : (data.repository?.url || 'N/A');

            // Dependencies count
            const deps = Object.keys(versionData.dependencies || {}).length;
            const devDeps = Object.keys(versionData.devDependencies || {}).length;

            // Weekly downloads
            let downloads = 'N/A';
            try {
                const dlRes = await axios.get(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg)}`, { timeout: 8000 });
                if (dlRes.data?.downloads) {
                    downloads = dlRes.data.downloads.toLocaleString();
                }
            } catch (e) { /* ignore download fetch error */ }

            // Keywords
            const keywords = (versionData.keywords || []).slice(0, 5).join(', ') || 'N/A';

            // Last publish
            const published = data.time?.[latest] ? new Date(data.time[latest]).toLocaleDateString() : 'N/A';

            const text = `📦 *${name}*\n\n` +
                `*Version:* ${latest || 'N/A'}\n` +
                `*Description:* ${description}\n` +
                `*Author:* ${author}\n` +
                `*License:* ${license}\n` +
                `*Published:* ${published}\n` +
                `*Dependencies:* ${deps}\n` +
                `*Dev Dependencies:* ${devDeps}\n` +
                `*Weekly Downloads:* ${downloads}\n` +
                `*Keywords:* ${keywords}\n\n` +
                `*Homepage:* ${homepage}\n` +
                `*Repository:* ${repo}`;

            await ctx.reply(text);

        } catch (error) {
            console.error('NPM error:', error.message);

            if (error.response?.status === 404) {
                return ctx.reply(`❌ *Not Found*\n\nPackage "*${pkg}*" doesn't exist on npm.`);
            }

            await ctx.reply(`❌ *Error*\n\nFailed to fetch npm package.\n_Note:_ ${error.message}`);
        }
    }
};