import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName } from '../../lib/config.js';

export default {
    command: 'take',
    aliases: ['steal'],
    description: 'Change the pack name and author of a sticker',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'take <pack name> | <author>',

    async execute(sock, m, args, ctx) {
        await ctx.react('⏳');

        const media = await ctx.getMedia();
        if (!media || !media.isSticker) {
            await ctx.react('❌');
            return ctx.reply('❌ *Take*\n\nReply to a sticker to change its pack name.');
        }

        // Default values
        let packName = getBotName();
        let authorName = 'Lord Xaven';

        // Parse the input: if user provides text, use it
        if (args.length > 0) {
            const input = args.join(' ');
            if (input.includes('|')) {
                const parts = input.split('|');
                packName = parts[0].trim() || packName;
                authorName = parts[1]?.trim() || authorName;
            } else {
                packName = input.trim() || packName;
            }
        }

        try {
            const sticker = new Sticker(media.buffer, {
                pack: packName,
                author: authorName,
                type: StickerTypes.FULL,
                quality: 70,
                background: '#00000000'
            });

            const buffer = await sticker.toBuffer();

            await sock.sendMessage(m.key.remoteJid, { sticker: buffer }, { quoted: m });
            await ctx.react('✅');
        } catch (err) {
            console.error('Take error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to modify sticker.\n_Error: ${err.message}_`);
        }
    }
};