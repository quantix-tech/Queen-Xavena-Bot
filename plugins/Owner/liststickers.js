import { listStickers } from '../../handlers/stickers.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'liststickers',
    description: 'List all bound sticker commands',
    category: 'Owner',
    ownerOnly: true,
    usage: '.liststickers',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const data = listStickers();
        const entries = Object.entries(data);

        if (entries.length === 0) {
            return ctx.reply(`📭 *Sticker Commands*\n\nNo stickers are currently bound.`);
        }

        let text = `📋 *Sticker Commands* (${entries.length})\n\n`;
        entries.forEach(([hash, cmd], i) => {
            text += `${i + 1}. \`${hash.substring(0, 8)}...\` ➔ *${prefix}${cmd}*\n`;
        });

        await ctx.reply(text);
    }
};