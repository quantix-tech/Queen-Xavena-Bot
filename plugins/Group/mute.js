import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'mute',
    description: 'Close the group (only admins can send messages)',
    category: 'Group',
    ownerOnly: false,
    usage: 'mute',

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
                return ctx.reply('❌ I need to be an admin to mute the group.');
            }

            await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
            await ctx.reply('🔒 *Group Muted*\n\nOnly admins can send messages now.');
        } catch (err) {
            console.error('Mute error:', err);
            await ctx.reply(`❌ Failed to mute the group.\n_Error: ${err.message}_`);
        }
    }
};