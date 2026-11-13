import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'unmute',
    description: 'Open the group (everyone can send messages)',
    category: 'Group',
    ownerOnly: false,
    usage: 'unmute',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to unmute the group.');
            }

            await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement');
            await ctx.reply('🔓 *Group Unmuted*\n\nAll members can send messages now.');
        } catch (err) {
            console.error('Unmute error:', err);
            await ctx.reply(`❌ Failed to unmute the group.\n_Error: ${err.message}_`);
        }
    }
};