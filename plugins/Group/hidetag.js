import { getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'hidetag',
    description: 'Tag all members silently (hidden mentions)',
    category: 'Group',
    ownerOnly: false,
    usage: 'hidetag <message>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

     

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants || [];

            // Check if sender is admin
            const senderParticipant = participants.find(p => p.id === m.key.participant);
            const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

            if (!isSenderAdmin) {
       
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const message = args.join(' ') || '📢 *Attention Everyone*';
            const mentions = participants.map(p => p.id);

            // Send the message with all JIDs hidden in the mentions array
            await sock.sendMessage(m.key.remoteJid, {
                text: message,
                mentions: mentions
            }, { quoted: m });

           

        } catch (err) {
            console.error('Hidetag error:', err);
         
            await ctx.reply(`❌ Failed to tag everyone.\n_Error: ${err.message}_`);
        }
    }
};