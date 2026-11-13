import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'acceptlimit',
    description: 'Approve a specific number of join requests',
    category: 'Group',
    ownerOnly: false,
    usage: 'acceptlimit <number>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');
        if (!args[0] || isNaN(args[0])) return ctx.reply('❌ *Accept Limit*\n\nUsage: `.acceptlimit <number>`');

        const limit = parseInt(args[0]);
        if (limit < 1) return ctx.reply('❌ Limit must be at least 1.');

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

            const totalPending = requests.length;
            const toApprove = Math.min(limit, totalPending);
            const jids = requests.slice(0, toApprove).map(r => r.jid || r.id).filter(Boolean);

            if (jids.length === 0) {
                return ctx.reply('❌ Could not extract user IDs from requests.');
            }

            await ctx.reply(`⏳ *Approving ${jids.length} requests...*\n\n_Pending before: ${totalPending}_`);

            let approved = 0;
            let failed = 0;
            const BATCH_SIZE = 50;

            for (let i = 0; i < jids.length; i += BATCH_SIZE) {
                const batch = jids.slice(i, i + BATCH_SIZE);
                try {
                    await sock.groupRequestParticipantsUpdate(m.key.remoteJid, batch, 'approve');
                    approved += batch.length;
                } catch (err) {
                    failed += batch.length;
                }
                if (i + BATCH_SIZE < jids.length) {
                    await new Promise(r => setTimeout(r, 1500));
                }
            }

            const remaining = totalPending - approved;

            let msg = `✅ *Batch Approved*\n\n`;
            msg += `*Requested:* ${limit}\n`;
            msg += `*Approved:* ${approved}\n`;
            msg += `*Failed:* ${failed}\n`;
            msg += `*Pending Before:* ${totalPending}\n`;
            msg += `*Remaining:* ${remaining}`;

            if (remaining > 0) {
                msg += `\n\n_Tip: Use \`.acceptlimit ${remaining}\` to approve the rest._`;
            }

            await ctx.reply(msg);
        } catch (err) {
            console.error('AcceptLimit error:', err);
            await ctx.reply(`❌ Failed to approve requests.\n_Error: ${err.message}_`);
        }
    }
};