import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'poll',
    aliases: ['createpoll'],
    description: 'Create a WhatsApp poll',
    category: 'Group',
    ownerOnly: false,
    usage: 'poll <question> | <option1> | <option2>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const jid = m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        try {
            const metadata = await getGroupMetadata(sock, jid);
            const isAdmin = await isSenderAdmin(sock, jid, m.key.participant, metadata);
            if (!isAdmin) return ctx.reply('❌ Only group admins can create polls.');
        } catch (err) {
            return ctx.reply(`❌ Error: ${err.message}`);
        }

        const text = args.join(' ');
        if (!text) {
            return ctx.reply(`📊 *Poll*\n\n*Usage:* \`${prefix}poll <question> | <option1> | <option2>\`\n*Example:* \`${prefix}poll Best language? | JavaScript | Python | Rust\``);
        }

        const parts = text.split('|').map(s => s.trim()).filter(Boolean);

        if (parts.length < 3) {
            return ctx.reply(`❌ *Error*\n\nYou need at least 1 question + 2 options.\n\n*Example:* \`${prefix}poll Best language? | JavaScript | Python\``);
        }

        const question = parts[0];
        const options = parts.slice(1);

        if (options.length > 12) {
            return ctx.reply(`❌ *Error*\n\nMaximum 12 options allowed.`);
        }

        if (question.length > 255) {
            return ctx.reply(`❌ *Error*\n\nQuestion too long (max 255 chars).`);
        }

        try {
            await sock.sendMessage(jid, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: 1
                }
            }, { quoted: m });
        } catch (error) {
            console.error('Poll error:', error.message);
            await ctx.reply(`❌ *Error*\n\nFailed to create poll.\n_Note:_ ${error.message}`);
        }
    }
};