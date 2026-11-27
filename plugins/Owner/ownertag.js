import { getOwnerTag, setOwnerTag, getPrefix } from '../../lib/config.js';

export default {
    command: 'ownertag',
    aliases: ['queentag', 'qtag'],
    description: 'Auto-react to messages from the Queen and authorized mods',
    category: 'Owner',
    ownerOnly: true,
    usage: 'ownertag <on/off/set>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();
        const current = getOwnerTag();

        if (!action) {
            return ctx.reply(
                `╭─⌈ 👑 *QUEEN TAG* ⌋\n` +
                `│\n` +
                `│ Status : ${current.enabled ? '✅ ON' : '❌ OFF'}\n` +
                `│ Emoji  : ${current.emoji}\n` +
                `│\n` +
                `│ ${prefix}ownertag on\n` +
                `│ ${prefix}ownertag off\n` +
                `│ ${prefix}ownertag set <emoji>\n` +
                `╰───\n\n` +
                `_Messages and stickers from the Queen or authorized mods get the selected reaction._`
            );
        }

        if (action === 'on') {
            if (current.enabled) return ctx.reply(`👑 Queen Tag is already *ON*.\n\nReaction: ${current.emoji}`);
            setOwnerTag({ enabled: true });
            return ctx.reply(`✅ *Queen Tag ON*\n\nReaction: ${current.emoji}`);
        }

        if (action === 'off') {
            if (!current.enabled) return ctx.reply(`👑 Queen Tag is already *OFF*.`);
            setOwnerTag({ enabled: false });
            return ctx.reply(`❌ *Queen Tag OFF*`);
        }

        if (action === 'set') {
            const emoji = args.slice(1).join('').trim();
            if (!emoji) return ctx.reply(`❌ Provide an emoji.\n\nExample: \`${prefix}ownertag set 👑\``);
            setOwnerTag({ enabled: true, emoji });
            return ctx.reply(`✅ *Queen Tag Updated*\n\nReaction: ${emoji}\nStatus: ON`);
        }

        // Shortcut: .ownertag 👑
        if (args[0]) {
            const emoji = args.join('').trim();
            setOwnerTag({ enabled: true, emoji });
            return ctx.reply(`✅ *Queen Tag Updated*\n\nReaction: ${emoji}\nStatus: ON`);
        }
    }
};