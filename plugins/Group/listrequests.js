import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'listrequests',
    description: 'List all pending join requests',
    category: 'Group',
    ownerOnly: false,
    usage: 'listrequests',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to view join requests.');
            }
            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const requests = await sock.groupRequestParticipantsList(m.key.remoteJid);

            if (!requests || requests.length === 0) {
                return ctx.reply('📭 *Pending Requests*\n\nNo pending join requests in this group.');
            }

            let text = `┌─〔 📋 JOIN REQUESTS 〕\n`;
            text += `├◆ *Group* : ${metadata.subject}\n`;
            text += `├◆ *Pending* : ${requests.length}\n`;
            text += `└─────────────◆\n\n`;

            const mentions = [];
            requests.forEach((req) => {
                const jid = req.jid || req.id;
                // Try to find their name in metadata (if they are a past participant)
                const participant = metadata.participants.find(p => p.id === jid);
                const displayName = participant?.notify || participant?.name || jid.split('@')[0];
                
                text += `├◆ @${displayName}\n`;
                mentions.push(jid);
            });

            text += `└─────────────◆\n\n`;
            text += `_Use \`.acceptall\` or \`.acceptlimit <number>\`_`;

            await sock.sendMessage(m.key.remoteJid, { text, mentions }, { quoted: m });
        } catch (err) {
            console.error('ListRequests error:', err);
            await ctx.reply(`❌ Failed to fetch requests.\n_Error: ${err.message}_`);
        }
    }
};