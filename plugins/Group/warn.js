import { getGroupMetadata, isSenderAdmin, isBotAdmin, getRealJid } from '../../lib/utils.js';
import { addWarn, resetWarns } from '../../handlers/warns.js';

export default {
    command: 'warn',
    description: 'Warn a user (kicks at 3 warnings)',
    category: 'Group',
    ownerOnly: false,
    usage: 'warn @user / reply',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        let targetJid = null;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (ctx.quoted) {
            targetJid = ctx.quoted.sender || ctx.quoted.key.participant;
        }

        if (!targetJid) return ctx.reply('❌ *Warn*\n\nTag a user or reply to their message to warn them.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const senderIsAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const botIsAdmin = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!senderIsAdmin) return ctx.reply('❌ Only group admins can use this.');
            if (!botIsAdmin) return ctx.reply('❌ I need to be admin to kick after 3 warnings.');

            const warns = addWarn(m.key.remoteJid, targetJid);
            const targetName = targetJid.split('@')[0];

            if (warns >= 3) {
                await sock.groupParticipantsUpdate(m.key.remoteJid, [targetJid], 'remove');
                resetWarns(m.key.remoteJid, targetJid);
                await ctx.reply(`🚫 *Kicked*\n\n@${targetName} has reached 3 warnings and was removed from the group.`, { mentions: [targetJid] });
            } else {
                await ctx.reply(`⚠️ *Warning*\n\n@${targetName} has been warned (${warns}/3).`, { mentions: [targetJid] });
            }
        } catch (err) {
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};