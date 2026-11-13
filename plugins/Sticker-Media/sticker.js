import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName, getPrefix } from '../../lib/config.js';

export default {
    command: 'sticker',
    aliases: ['s', 'stiker'],
    description: 'Convert an image or video to a sticker',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'sticker (reply to media)', // <-- No hardcoded prefix

    async execute(sock, m, args, ctx) {
        await ctx.react('⏳');

        const media = await ctx.getMedia();
        
        if (!media) {
            await ctx.react('❌');
            const prefix = getPrefix();
            return ctx.reply(`❌ *Sticker*\n\nReply to an image, video, or GIF with \`${prefix}sticker\`.`);
        }

        if (!media.isImage && !media.isVideo) {
            await ctx.react('❌');
            return ctx.reply('❌ Only images and videos can be converted to stickers.');
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

            await sock.sendMessage(m.key.remoteJid, { sticker: buffer }, { quoted: m });
            await ctx.react('✅');
        } catch (err) {
            console.error('Sticker error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to create sticker.\n_Error: ${err.message}_`);
        }
    }
};