import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'setgcdesc',
    description: 'Change the group description',
    category: 'Group',
    ownerOnly: false,
    usage: 'setgcdesc <new description>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');
        if (!args[0]) return ctx.reply('❌ *Set GC Description*\n\nUsage: `.setgcdesc <new description>`');

        const newDesc = args.join(' ');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to change the group description.');
            }

            await sock.groupUpdateDescription(m.key.remoteJid, newDesc);

            await ctx.reply(`✅ *Group Description Updated*\n\n📝 *New Desc:*\n${newDesc}`);
        } catch (err) {
            console.error('SetGCDesc error:', err);
            await ctx.reply(`❌ Failed to change the group description.\n_Error: ${err.message}_`);
        }
    }
};