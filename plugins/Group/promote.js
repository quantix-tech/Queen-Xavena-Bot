import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'promote',
    description: 'Promote a user to group admin',
    category: 'Group',
    ownerOnly: false,
    usage: 'promote @user / reply',

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

        if (!targetJid) return ctx.reply('❌ *Promote*\n\nTag a user or reply to their message to promote them.');
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
                return ctx.reply('❌ I need to be an admin to promote someone.');
            }

            const targetParticipant = participants.find(p => p.id === targetJid || p.phoneNumber === targetJid);
            const isTargetAdmin = targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin';

            if (targetJid === sock.user.id.split(':')[0] + '@s.whatsapp.net') {
                return ctx.reply('❌ I am already an admin.');
            }
            if (isTargetAdmin) {
                return ctx.reply(`ℹ️ @${targetParticipant?.notify || targetJid.split('@')[0]} is already an admin.`, { mentions: [targetJid] });
            }

            await sock.groupParticipantsUpdate(m.key.remoteJid, [targetJid], 'promote');

            const targetName = targetParticipant?.notify || targetParticipant?.name || targetJid.split('@')[0];

            await ctx.reply(`✅ *Promoted*\n\n@${targetName} is now a group admin.`, {
                mentions: [targetJid]
            });
        } catch (err) {
            console.error('Promote error:', err);
            await ctx.reply(`❌ Failed to promote user.\n_Error: ${err.message}_`);
        }
    }
};