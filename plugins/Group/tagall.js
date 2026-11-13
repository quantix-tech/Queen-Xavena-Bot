import { getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'tagall',
    description: 'Tag every member in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'tagall <message>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

       

        try {
            // 1. Force fetch metadata (stops the <group> node error)
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants || [];

            // 2. Check if sender is admin
            const senderParticipant = participants.find(p => p.id === m.key.participant);
            const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

            if (!isSenderAdmin) {
           
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const customMsg = args.join(' ') || '📢 *Attention Everyone*';
            const mentions = [];

            let text = `┌─〔 📢 GROUP ANNOUNCEMENT 〕\n`;
            text += `├◆ *Message* : ${customMsg}\n`;
            text += `├◆ *Members* : ${participants.length}\n`;
            text += `└─────────────◆\n\n`;

            // 3. Loop through and get push names
            participants.forEach((p) => {
                const displayName = p.notify || p.name || p.id.split('@')[0];
                text += `├◆ @${displayName}\n`;
                mentions.push(p.id);
            });
            
            text += `└─────────────◆`;

            await sock.sendMessage(m.key.remoteJid, {
                text: text,
                mentions: mentions
            }, { quoted: m });

         

        } catch (err) {
            console.error('Tagall error:', err);
       
            await ctx.reply(`❌ Failed to tag all.\n_Error: ${err.message}_`);
        }
    }
};