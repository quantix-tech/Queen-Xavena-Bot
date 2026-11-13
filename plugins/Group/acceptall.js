import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'acceptall',
    description: 'Approve all pending join requests',
    category: 'Group',
    ownerOnly: false,
    usage: 'acceptall',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to approve requests.');
            }
            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const requests = await sock.groupRequestParticipantsList(m.key.remoteJid);

            if (!requests || requests.length === 0) {
                return ctx.reply('📭 *No Requests*\n\nNo pending join requests to approve.');
            }

            const jids = requests.map(r => r.jid || r.id).filter(Boolean);

            await sock.groupRequestParticipantsUpdate(m.key.remoteJid, jids, 'approve');

            await ctx.reply(`✅ *Approved*\n\n${jids.length} join request${jids.length > 1 ? 's' : ''} approved.`);
        } catch (err) {
            console.error('AcceptAll error:', err);
            await ctx.reply(`❌ Failed to approve requests.\n_Error: ${err.message}_`);
        }
    }
};