import { removeShadowban } from '../../handlers/shadowban.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

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
            targetJid = ctx.quoted.sender;
        } else if (args[0]) {
            targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!targetJid) return ctx.reply('❌ *Unshadowban*\n\nTag a user or reply to their message.');
        if (!targetJid.includes('@')) targetJid += '@s.whatsapp.net';

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const targetParticipant = metadata.participants.find(p => p.id === targetJid || p.phoneNumber === targetJid);
            const targetName = targetParticipant?.notify || targetParticipant?.name || targetJid.split('@')[0];

            const removed = removeShadowban(m.key.remoteJid, targetJid);
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