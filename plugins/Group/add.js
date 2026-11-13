import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'add',
    description: 'Add a user to the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'add 2348012345678',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');
        if (!args[0]) return ctx.reply('❌ *Add Member*\n\nUsage: `.add <number>`\nExample: `.add 2348012345678`');

        const cleanNumber = args[0].replace(/[^0-9]/g, '');
        const targetJid = cleanNumber + '@s.whatsapp.net';

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants;

            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to add someone.');
            }

            const alreadyIn = participants.some(p => 
                p.id === targetJid || 
                p.phoneNumber === targetJid || 
                p.id?.split('@')[0] === cleanNumber
            );
            
            if (alreadyIn) {
                return ctx.reply(`ℹ️ @${cleanNumber} is already in the group.`, { mentions: [targetJid] });
            }

            await sock.groupParticipantsUpdate(m.key.remoteJid, [targetJid], 'add');

            await ctx.reply(`✅ *Added*\n\n+${cleanNumber} has been added to the group.`, {
                mentions: [targetJid]
            });
        } catch (err) {
            console.error('Add error:', err);
            await ctx.reply(`❌ Failed to add user.\n_Note: Make sure their privacy settings allow being added._`);
        }
    }
};
