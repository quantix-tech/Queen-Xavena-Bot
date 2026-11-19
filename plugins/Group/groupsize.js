import { getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'groupsize',
    aliases: ['gcsize', 'members'],
    description: 'Check the number of members and admins in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'groupsize',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants || [];
            
            const total = participants.length;
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length;
            const members = total - admins;

            await ctx.reply(`👥 *Group Size*\n\n*Group:* ${metadata.subject}\n*Total:* ${total} members\n*Admins:* ${admins}\n*Members:* ${members}`);
        } catch (err) {
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};