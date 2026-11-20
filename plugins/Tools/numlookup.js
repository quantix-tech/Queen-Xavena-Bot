import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'numlookup',
    aliases: ['nl', 'numberlookup'],
    description: 'Lookup information about a phone number',
    category: 'Tools',
    ownerOnly: false,
    usage: 'numlookup <number>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        
        if (!args[0]) {
            return ctx.reply(`🔍 *Number Lookup*\n\n*Usage:* \`${prefix}numlookup <number>\`\n*Example:* \`${prefix}numlookup +12128148373\``);
        }

        let query = args.join(' ').trim();
        
        // Format the number
        if (!query.startsWith('+')) {
            if (query.startsWith('00')) query = '+' + query.slice(2);
            else query = '+' + query;
        }
        query = '+' + query.replace(/[^0-9]/g, '');

        try {
            const apiUrl = `https://api-rebix.zone.id/api/numberlookup?q=${encodeURIComponent(query)}`;
            const res = await axios.get(apiUrl, { timeout: 30000 });
            const data = res.data;

            if (!data.status || !data.result || !data.result.status) {
                return ctx.reply(`❌ *Error*\n\nCould not lookup this number.\n_Make sure it's in international format._`);
            }

            const r = data.result;

            const text = `
╭─❏ 𝐍𝐔𝐌𝐁𝐄𝐑 𝐋𝐎𝐎𝐊𝐔𝐏
│ • ɪɴᴘᴜᴛ : ${r.input}
│ • ᴠᴀʟɪᴅ : ${r.is_valid ? '✅ Yes' : '❌ No'}
│ • ᴛʏᴘᴇ : ${r.type || 'N/A'}
│ • ᴄᴏᴜɴᴛʀʏ : ${r.country || 'N/A'}
│ • ɢᴇᴏ : ${r.geo_name || 'N/A'}
│ • ᴛɪᴍᴇᴢᴏɴᴇ : ${r.timezone || 'N/A'}
│ • ᴄᴀʀʀɪᴇʀ : ${r.carrier || 'N/A'}
│ • ᴇ𝟷𝟼𝟺 : ${r.formats?.e164 || 'N/A'}
│ • ɪɴᴛʟ : ${r.formats?.international || 'N/A'}
│ • ɴᴀᴛɪᴏɴᴀʟ : ${r.formats?.national || 'N/A'}
╰──────────────❏
`;

            await ctx.reply(text);
        } catch (error) {
            console.error('NumLookup error:', error.message);
            await ctx.reply(`❌ *Error*\n\nFailed to lookup number.\n_Note:_ ${error.message}`);
        }
    }
};