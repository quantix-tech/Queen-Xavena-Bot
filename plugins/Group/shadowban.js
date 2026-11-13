import { addShadowban } from '../../handlers/shadowban.js';
import { getGroupMetadata, isSenderAdmin, isBotAdmin, getRealJid } from '../../lib/utils.js';

export default {
    command: 'shadowban',
    description: 'Silently ban a user (deletes their messages)',
    category: 'Group',
    ownerOnly: false,
    usage: 'shadowban @user / reply',

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

        if (!targetJid) return ctx.reply('❌ *Shadowban*\n\nTag a user or reply to their message.');
        if (!targetJid.includes('@')) targetJid += '@s.whatsapp.net';

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to shadowban someone.');
            }

            const realNumber = await getRealJid(targetJid, sock);
            if (realNumber === ctx.sender) {
                return ctx.reply('❌ You cannot shadowban yourself.');
            }

            const targetParticipant = metadata.participants.find(p => p.id === targetJid || p.phoneNumber === targetJid);
            const targetName = targetParticipant?.notify || targetParticipant?.name || targetJid.split('@')[0];

            const added = addShadowban(m.key.remoteJid, targetJid);
            if (added) {
                await ctx.reply(`👻 *Shadowbanned*\n\n@${targetName} is now shadowbanned.\n\n_All their future messages will be deleted silently._`, { mentions: [targetJid] });
            } else {
                await ctx.reply(`ℹ️ @${targetName} is already shadowbanned.`, { mentions: [targetJid] });
            }
        } catch (err) {
            console.error('Shadowban error:', err);
            await ctx.reply(`❌ Failed to shadowban.\n_Error: ${err.message}_`);
        }
    }
};