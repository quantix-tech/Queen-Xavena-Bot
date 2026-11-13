import { removeSudo, getPrefix } from '../../lib/config.js';
import { getRealJid } from '../../lib/utils.js';

export default {
    command: 'delsudo',
    description: 'Remove a user from the sudo list',
    category: 'Owner',
    ownerOnly: true,
    usage: 'delsudo @user / reply',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let targetJid = null;

        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = m.message.extendedTextMessage.contextInfo.participant;
        } else if (args[0]) {
            targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!targetJid) {
            return ctx.reply(`🛡️ *Del Sudo*\n\nUsage: \`${prefix}delsudo @user\`\nOr reply to a message with \`${prefix}delsudo\``);
        }

        const realNumber = await getRealJid(targetJid, sock);

        if (!realNumber) {
            return ctx.reply('❌ Could not resolve the user\'s phone number.');
        }

        const success = removeSudo(realNumber);

        if (success) {
            return ctx.reply(`✅ *Sudo Removed*\n\nNumber *+${realNumber}* has lost Sudo access.`);
        } else {
            return ctx.reply(`ℹ️ *Notice*\n\nNumber *+${realNumber}* is not a sudo user.`);
        }
    }
};