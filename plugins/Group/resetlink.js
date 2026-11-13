import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'resetlink',
    description: 'Revoke the current invite link and generate a new one',
    category: 'Group',
    ownerOnly: false,
    usage: 'resetlink',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to reset the group link.');
            }

            await sock.groupRevokeInvite(m.key.remoteJid);
            const newCode = await sock.groupInviteCode(m.key.remoteJid);
            const newLink = `https://chat.whatsapp.com/${newCode}`;

            await ctx.reply(`✅ *Link Reset*\n\nThe old invite link has been revoked.\n\n🔗 *New Link:*\n${newLink}`);
        } catch (err) {
            console.error('ResetLink error:', err);
            await ctx.reply(`❌ Failed to reset the group link.\n_Error: ${err.message}_`);
        }
    }
};