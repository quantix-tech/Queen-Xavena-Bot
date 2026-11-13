import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

export default {
    command: 'gclink',
    description: 'Get the group invite link',
    category: 'Group',
    ownerOnly: false,
    usage: 'gclink',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);

            if (!isAdmin) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const code = await sock.groupInviteCode(m.key.remoteJid);
            const link = `https://chat.whatsapp.com/${code}`;

            await ctx.reply(`🔗 *Group Link*\n\n${link}\n\n_Share this link to invite people to the group._`);
        } catch (err) {
            console.error('GCLink error:', err);
            await ctx.reply(`❌ Failed to get the group link.\n_Note: The group may have "Only admins can send invite links" enabled._`);
        }
    }
};