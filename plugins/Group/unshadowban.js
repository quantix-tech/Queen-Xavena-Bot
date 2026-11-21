import { removeShadowban } from '../../handlers/shadowban.js';
import { getGroupMetadata, isSenderAdmin, getRealJid, extractRawId } from '../../lib/utils.js';

export default {
    command: 'unshadowban',
    description: 'Remove a user from the shadowban list',
    category: 'Group',
    ownerOnly: false,
    usage: 'unshadowban @user / reply',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        let targetJid = null;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (ctx.quoted) {
            targetJid = ctx.quoted.sender || ctx.quoted.key.participant;
        } else if (args[0]) {
            targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!targetJid) return ctx.reply('❌ *Unshadowban*\n\nTag a user or reply to their message.');
        if (!targetJid.includes('@')) targetJid += '@s.whatsapp.net';

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            if (!isSender) return ctx.reply('❌ Only group admins can use this command.');

            // Resolve the ID to get all formats
            const realNumber = await getRealJid(targetJid, sock);
            const rawId = extractRawId(targetJid);

            const targetParticipant = metadata.participants.find(p => p.id === targetJid || p.phoneNumber === targetJid);
            const targetName = targetParticipant?.notify || targetParticipant?.name || targetJid.split('@')[0];

            // Remove ALL formats from the ban list
            let removed = false;
            if (realNumber) removed = removeShadowban(m.key.remoteJid, realNumber) || removed;
            if (rawId && rawId !== realNumber) removed = removeShadowban(m.key.remoteJid, rawId) || removed;
            if (targetJid && targetJid !== rawId) removed = removeShadowban(m.key.remoteJid, targetJid) || removed;

            if (removed) {
                await ctx.reply(`👼 *Unshadowbanned*\n\n@${targetName} can now send messages normally.`, { mentions: [targetJid] });
            } else {
                await ctx.reply(`ℹ️ @${targetName} is not shadowbanned.`, { mentions: [targetJid] });
            }
        } catch (err) {
            console.error('Unshadowban error:', err);
            await ctx.reply(`❌ Failed to unshadowban.\n_Error: ${err.message}_`);
        }
    }
};