import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'demote',
    description: 'Remove admin rights from a user',
    category: 'Group',
    ownerOnly: false,
    usage: 'demote @user / reply',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        let targetJid = null;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (ctx.quoted) {
            targetJid = ctx.quoted.sender;
        } else if (args[0]) {
            targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!targetJid) return ctx.reply('❌ *Demote*\n\nTag a user or reply to their message to demote them.');
        if (!targetJid.includes('@')) targetJid += '@s.whatsapp.net';

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants;

            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to demote someone.');
            }

            const targetParticipant = participants.find(p => p.id === targetJid || p.phoneNumber === targetJid);
            const isTargetAdmin = targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin';

            if (targetJid === sock.user.id.split(':')[0] + '@s.whatsapp.net') {
                return ctx.reply('❌ I cannot demote myself.');
            }
            if (!isTargetAdmin) {
                return ctx.reply(`ℹ️ @${targetParticipant?.notify || targetJid.split('@')[0]} is not an admin.`, { mentions: [targetJid] });
            }

            await sock.groupParticipantsUpdate(m.key.remoteJid, [targetJid], 'demote');

            const targetName = targetParticipant?.notify || targetParticipant?.name || targetJid.split('@')[0];

            await ctx.reply(`✅ *Demoted*\n\n@${targetName} is no longer a group admin.`, {
                mentions: [targetJid]
            });
        } catch (err) {
            console.error('Demote error:', err);
            await ctx.reply(`❌ Failed to demote user.\n_Error: ${err.message}_`);
        }
    }
};