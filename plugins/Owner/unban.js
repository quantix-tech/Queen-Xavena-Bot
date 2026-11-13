import { removeBan } from '../../handlers/bans.js';
import { getRealJid } from '../../lib/utils.js';

export default {
    command: 'unban',
    description: 'Unban a user',
    category: 'Owner',
    ownerOnly: true,
    usage: '.unban @user / reply',

    async execute(sock, m, args, ctx) {
        let targetJid = null;

        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (ctx.quoted && ctx.quoted.sender) {
            targetJid = ctx.quoted.sender;
        } else if (args[0]) {
            targetJid = args[0].replace(/[^0-9]/g, '');
        }

        if (!targetJid) {
            return ctx.reply('❌ *Unban*\n\nTag a user, reply to their message, or provide a number.');
        }

        const realNumber = await getRealJid(targetJid, sock);

        if (!realNumber) {
            return ctx.reply('❌ Could not resolve the user\'s phone number.');
        }

        const success = removeBan(realNumber);

        if (success) {
            await ctx.reply(`✅ *Unbanned*\n\n+${realNumber} can now use the bot again.`);
        } else {
            await ctx.reply(`ℹ️ *Notice*\n\n+${realNumber} is not banned.`);
        }
    }
};