import { getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'gcinfo',
    description: 'Get detailed info about the current group',
    category: 'Group',
    ownerOnly: false,
    usage: 'gcinfo',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

      

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants || [];
            
            const totalMembers = participants.length;
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const totalAdmins = admins.length;

            const createdDate = new Date(metadata.creation * 1000).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric'
            });

            let text = `┌─〔 👥 GROUP INFO 〕\n`;
            text += `├◆ *Name* : ${metadata.subject}\n`;
            text += `├◆ *ID* : ${metadata.id}\n`;
            text += `├◆ *Created* : ${createdDate}\n`;
            text += `├◆ *Members* : ${totalMembers}\n`;
            text += `├◆ *Admins* : ${totalAdmins}\n`;
            text += `├◆ *Restrict* : ${metadata.announce ? 'Yes (Only Admins)' : 'No (Everyone)'}\n`;
            text += `└─────────────◆\n\n`;

            text += `┌─〔 📝 DESCRIPTION 〕\n`;
            if (metadata.desc) {
                const desc = metadata.desc.length > 150 ? metadata.desc.substring(0, 150) + '...' : metadata.desc;
                text += `${desc}\n`;
            } else {
                text += `_No description set._\n`;
            }
            text += `└─────────────◆`;

            await ctx.reply(text);
         
        } catch (err) {
            console.error('GCInfo error:', err);
        
            await ctx.reply(`❌ Failed to fetch group info.\n_Error: ${err.message}_`);
        }
    }
};