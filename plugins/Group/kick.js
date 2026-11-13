import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'kick',
    description: 'Remove a user from the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'kick @user / reply',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        let targetJid = null;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (ctx.quoted) {
            targetJid = ctx.quoted.sender;
        } else if (args[0]) {
            targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!targetJid) {
            return ctx.reply('❌ *Kick*\n\nTag a user or reply to their message to kick them.');
        }
        
        if (!targetJid.includes('@')) targetJid += '@s.whatsapp.net';

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants;

            // Use the new robust admin check helpers
            const senderIsAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const botIsAdmin = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!senderIsAdmin) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!botIsAdmin) {
                return ctx.reply('❌ I need to be an admin to kick someone.');
            }

            // Check target status
            const botNumber = sock.user.id.split(':')[0].split('@')[0];
            const targetNumber = targetJid.split('@')[0];
            const senderNumber = m.key.participant ? m.key.participant.split('@')[0] : '';

            const targetParticipant = participants.find(p => 
                p.id === targetJid || 
                p.phoneNumber === targetJid || 
                p.id?.split('@')[0] === targetNumber
            );
            const isTargetAdmin = targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin';

            if (targetNumber === botNumber) {
                return ctx.reply('❌ I cannot kick myself.');
            }
            if (targetNumber === senderNumber) {
                return ctx.reply('❌ You cannot kick yourself.');
            }
            if (isTargetAdmin) {
                return ctx.reply('❌ I cannot kick another admin.');
            }

            // Execute kick
            await sock.groupParticipantsUpdate(m.key.remoteJid, [targetJid], 'remove');

            // Get target name for the success message
            const targetName = targetParticipant?.notify || targetParticipant?.name || targetNumber;

            await ctx.reply(`✅ *Kicked*\n\n@${targetName} has been removed from the group.`, {
                mentions: [targetJid]
            });

        } catch (err) {
            console.error('Kick error:', err);
            await ctx.reply(`❌ Failed to kick user.\n_Error: ${err.message}_`);
        }
    }
};