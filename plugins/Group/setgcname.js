import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'setgcname',
    description: 'Change the group name',
    category: 'Group',
    ownerOnly: false,
    usage: 'setgcname <new name>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');
        if (!args[0]) return ctx.reply('❌ *Set GC Name*\n\nUsage: `.setgcname <new name>`');

        const newName = args.join(' ');
        if (newName.length > 25) return ctx.reply('❌ Group name cannot exceed 25 characters.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to change the group name.');
            }

            const oldName = metadata.subject;
            await sock.groupUpdateSubject(m.key.remoteJid, newName);

            await ctx.reply(`✅ *Group Name Updated*\n\n📝 *Old:* ${oldName}\n✨ *New:* ${newName}`);
        } catch (err) {
            console.error('SetGCName error:', err);
            await ctx.reply(`❌ Failed to change the group name.\n_Error: ${err.message}_`);
        }
    }
};