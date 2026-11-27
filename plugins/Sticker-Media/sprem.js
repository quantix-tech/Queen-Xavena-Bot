import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName, getPrefix } from '../../lib/config.js';

export default {
    command: 'sprem',
    aliases: ['stickerprem', 'spremium'],
    description: 'Convert image/video/sticker to premium sticker',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'sprem (reply to media)',

    async execute(sock, m, args, ctx) {
        await ctx.react('⏳');

        const media = await ctx.getMedia();

        if (!media) {
            await ctx.react('❌');
            const prefix = getPrefix();
            return ctx.reply(`❌ *Premium Sticker*\n\nReply to an image, video, sticker, or GIF with \`${prefix}sprem\`.`);
        }

        if (!media.isImage && !media.isVideo && !media.isSticker) {
            await ctx.react('❌');
            return ctx.reply('❌ Only images, videos, and stickers can be converted.');
        }

        try {
            const packName = getBotName();
            const authorName = 'Lord Xaven';

            const sticker = new Sticker(media.buffer, {
                pack: packName,
                author: authorName,
                type: StickerTypes.FULL,
                quality: 70,
                background: '#00000000'
            });

            const buffer = await sticker.toBuffer();

            await sock.sendMessage(m.key.remoteJid, { sticker: buffer, premium: 1 }, { quoted: m });
            await ctx.react('✅');
        } catch (err) {
            console.error('Sprem error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to create premium sticker.\n_Error: ${err.message}_`);
        }
    }
};