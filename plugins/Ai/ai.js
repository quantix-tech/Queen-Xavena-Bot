import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'ai',
    aliases: ['ask', 'xavena'],
    description: 'Ask the AI a question directly',
    category: 'AI',
    ownerOnly: false,
    usage: 'ai <question>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const query = args.join(' ');

        if (!query) {
            return ctx.reply(`🤖 *Queen Xavena AI*\n\n*Usage:* \`${prefix}ai <question>\`\n*Example:* \`${prefix}ai Explain quantum physics in one sentence\``);
        }

        // Send a typing presence to show the bot is "thinking"
        await sock.sendPresenceUpdate('composing', m.key.remoteJid);

        try {
            // 1. Try Primary API
            let apiUrl = `https://queen-xavena-api.vercel.app/api/v1/ai/ch?q=${encodeURIComponent(query)}`;
            
            console.log(`[AI] Sending prompt to Primary Custom API...`);
            let res = await axios.get(apiUrl, { timeout: 30000 });
            let data = res.data;
            
            let answer = data.result || data.data || data.response || data.message || data.answer || data.text;

            // 2. Fallback to AIWriter if the first fails
            if (!answer) {
                console.log(`[AI] Primary failed. Trying Fallback...`);
                apiUrl = `https://queen-xavena-api.vercel.app/api/v1/ai/aiwriter-chat?prompt=${encodeURIComponent(query)}`;
                res = await axios.get(apiUrl, { timeout: 30000 });
                data = res.data;
                answer = data.result || data.data || data.response || data.message || data.answer || data.text;
            }

            if (!answer) {
                throw new Error('No valid response from API');
            }

            // 3. Clean up markdown formatting for WhatsApp if necessary
            // Sometimes AI outputs too many asterisks or hash symbols that look messy
            let cleanAnswer = answer.trim();

            // Send the response
            await ctx.reply(`🤖 *AI Response*\n\n${cleanAnswer}`);

        } catch (err) {
            console.error('[AI Command Error]:', err.message);
            await ctx.reply(`❌ *Error*\n\nThe AI is currently unavailable or busy. Please try again later.`);
        } finally {
            // Stop the typing presence
            await sock.sendPresenceUpdate('paused', m.key.remoteJid);
        }
    }
};