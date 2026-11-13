import { addSudo, getPrefix } from '../../lib/config.js';
import { getRealJid, loadOwners } from '../../lib/utils.js'; 

export default {
    command: 'addsudo',
    description: 'Add a user to the sudo list',
    category: 'Owner',
    ownerOnly: true,
    usage: 'addsudo @user / reply',

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
            return ctx.reply(`🛡️ *Add Sudo*\n\nUsage: \`${prefix}addsudo @user\`\nOr reply to a message with \`${prefix}addsudo\``);
        }

        const realNumber = await getRealJid(targetJid, sock);

        if (!realNumber) {
            return ctx.reply('❌ Could not resolve the user\'s phone number.');
        }

        // Check if they're trying to sudo themselves
        if (realNumber === ctx.sender) {
            return ctx.reply('❌ You cannot add yourself as sudo.');
        }

        // Check if the target is already an owner
        const owners = loadOwners();
        const botNumber = sock.user.id.split(':')[0].split('@')[0];
        if (realNumber === botNumber || owners.includes(realNumber)) {
            return ctx.reply('❌ That user is already the owner. No need for sudo access.');
        }

        const success = addSudo(realNumber);

        if (success) {
            return ctx.reply(`✅ *Sudo Added*\n\nNumber: *+${realNumber}* now has Sudo access.`);
        } else {
            return ctx.reply(`ℹ️ *Notice*\n\nNumber *+${realNumber}* is already a sudo user.`);
        }
    }
};