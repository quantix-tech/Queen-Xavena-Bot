import { translate } from '@vitalets/google-translate-api';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'tr',
    aliases: ['translate'],
    description: 'Translate text or a replied message',
    category: 'General',
    ownerOnly: false,
    usage: 'tr <language_code> [text]',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const targetLang = args[0]?.toLowerCase();

        if (!targetLang) {
            return ctx.reply(`🌍 *Translator*\n\nUsage:\n\`${prefix}tr <lang> <text>\`\n\`${prefix}tr <lang>\` (reply to a message)\n\n*Example:* \`${prefix}tr es Hello world\``);
        }

        let textToTranslate = args.slice(1).join(' ');
        
        // If no text provided in args, check if they replied to a message
        if (!textToTranslate && ctx.quoted) {
            textToTranslate = ctx.quoted.text;
        }

        if (!textToTranslate) {
            return ctx.reply(`❌ Please provide text or reply to a message to translate.`);
        }

        try {
            await ctx.react('⏳');
            const res = await translate(textToTranslate, { to: targetLang });
            
            await ctx.reply(`🌍 *Translated to ${targetLang.toUpperCase()}*\n\n${res.text}`);
            await ctx.react('✅');
        } catch (err) {
            console.error('Translate error:', err);
            await ctx.react('❌');
            await ctx.reply('❌ Failed to translate. Make sure you used a valid language code (e.g., en, es, fr, ig, yo).');
        }
    }
};