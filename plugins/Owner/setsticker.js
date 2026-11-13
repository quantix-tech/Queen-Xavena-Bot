import { bindSticker, getStickerHash } from '../../handlers/stickers.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'setsticker',
    description: 'Bind a command to a sticker',
    category: 'Owner',
    ownerOnly: true,
    usage: '.setsticker <command>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted || !ctx.quoted.type.includes('sticker')) {
            return ctx.reply(`❌ *Set Sticker*\n\nReply to a sticker with \`${prefix}setsticker <command>\``);
        }

        if (!args[0]) {
            return ctx.reply(`❌ Provide the command to bind. Example: \`${prefix}setsticker ping\``);
        }

        const cmd = args[0].toLowerCase().replace(prefix, '');
        const media = await ctx.getMedia();

        if (!media || !media.isSticker) {
            return ctx.reply('❌ Failed to download the sticker.');
        }

        const hash = getStickerHash(media.buffer);
        bindSticker(hash, cmd);

        await ctx.reply(`✅ *Sticker Bound!*\n\nWhenever this sticker is sent, the bot will run *${prefix}${cmd}*`);
    }
};