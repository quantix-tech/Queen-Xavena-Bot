import axios from 'axios';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName } from '../../lib/config.js';

export default {
    command: 'emojimix',
    description: 'Combine two emojis into a sticker',
    category: 'Fun',
    ownerOnly: false,
    usage: 'emojimix 😂+😭',

    async execute(sock, m, args, ctx) {
        if (!args[0]) {
            return ctx.reply('❌ *EmojiMix*\n\nUsage: `.emojimix 😂+😭`\n_Note: Separate the two emojis with a `+` sign._');
        }

        const input = args[0];
        if (!input.includes('+')) {
            return ctx.reply('❌ Please separate the two emojis with a `+` sign.\nExample: `.emojimix 😂+😭`');
        }

        const [emoji1, emoji2] = input.split('+');

        await ctx.react('🎨');

        try {
            // Convert emojis to their unicode hex codes
            const codePoint1 = emoji1.trim().codePointAt(0).toString(16);
            const codePoint2 = emoji2.trim().codePointAt(0).toString(16);

            // Google Emoji Kitchen API
            const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${codePoint1}_${codePoint2}`;
            
            const response = await axios.get(url, { timeout: 15000 });

            if (!response.data.results || response.data.results.length === 0) {
                await ctx.react('❌');
                return ctx.reply('❌ Those two emojis cannot be mixed.');
            }

            // Get the highest quality image from the results
            const imageUrl = response.data.results[0].url;

            // Download the image buffer
            const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' }).then(res => res.data);

            // Convert to sticker
            const packName = getBotName();
            const sticker = new Sticker(Buffer.from(imageBuffer), {
                pack: packName,
                author: 'Lord Xaven',
                type: StickerTypes.FULL,
                quality: 80,
                background: '#00000000'
            });

            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(m.key.remoteJid, { sticker: stickerBuffer }, { quoted: m });
            await ctx.react('✅');

        } catch (err) {
            console.error('Emojimix error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to mix emojis.\n_Error: ${err.message}_`);
        }
    }
};
