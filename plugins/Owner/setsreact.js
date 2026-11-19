import { saveStickerReactionMessage } from '../../lib/stickerreact.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'setsreact',
    aliases: ['setreactsticker'],
    description: 'Set the sticker used for reactions',
    category: 'Owner',
    ownerOnly: true,
    usage: 'setsreact (reply to sticker)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted) {
            return ctx.reply(`🎭 *Set React Sticker*\n\nReply to a sticker with \`${prefix}setsreact\` to save it.`);
        }

        // The helper expects the raw message object
        const saved = saveStickerReactionMessage(ctx.quoted);
        
        if (saved) {
            await ctx.reply('✅ *Reaction Sticker Saved!*\n\nI will now use this sticker when reacting to messages.');
        } else {
            await ctx.reply('❌ *Failed:* Please reply to a valid sticker.');
        }
    }
};