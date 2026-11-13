import { unbindSticker, unbindByCommand, getStickerHash } from '../../handlers/stickers.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'delsticker',
    description: 'Remove a sticker command binding',
    category: 'Owner',
    ownerOnly: true,
    usage: '.delsticker <command> OR reply to sticker',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        // If replying to a sticker, remove by hash
        if (ctx.quoted && ctx.quoted.type.includes('sticker')) {
            const media = await ctx.getMedia();
            if (media && media.isSticker) {
                const hash = getStickerHash(media.buffer);
                if (unbindSticker(hash)) {
                    return ctx.reply(`✅ *Sticker Unbound*\n\nThis sticker will no longer trigger a command.`);
                } else {
                    return ctx.reply(`ℹ️ This sticker is not bound to any command.`);
                }
            }
        }

        // If a command name is provided, remove by command
        if (args[0]) {
            const cmd = args[0].toLowerCase().replace(prefix, '');
            if (unbindByCommand(cmd)) {
                return ctx.reply(`✅ *Commands Removed*\n\nAll stickers bound to *${prefix}${cmd}* have been unbound.`);
            } else {
                return ctx.reply(`ℹ️ No stickers are bound to *${prefix}${cmd}*.`);
            }
        }

        return ctx.reply(`❌ *Del Sticker*\n\nReply to a sticker or provide a command name: \`${prefix}delsticker <command>\``);
    }
};