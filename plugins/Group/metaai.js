import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'metaai',
    description: 'Add the Meta AI bot to the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'metaai',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        // Meta AI's official WhatsApp JID
        const META_AI_JID = '13135550002@s.whatsapp.net';

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const senderIsAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const botIsAdmin = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!senderIsAdmin) return ctx.reply('❌ Only group admins can add Meta AI.');
            if (!botIsAdmin) return ctx.reply('❌ I need to be an admin to add Meta AI.');

            // Check if Meta AI is already in the group
            const isMetaAiInGroup = metadata.participants.some(p => p.id === META_AI_JID || p.phoneNumber === META_AI_JID);
            if (isMetaAiInGroup) {
                return ctx.reply('ℹ️ Meta AI is already in this group.');
            }

            await ctx.reply('⏳ *Adding Meta AI to the group...*');

            // Add Meta AI
            await sock.groupParticipantsUpdate(m.key.remoteJid, [META_AI_JID], 'add');
            
            await ctx.reply('✅ *Meta AI Added!*\n\nMeta AI has been successfully added to the group.');

        } catch (err) {
            console.error('MetaAI error:', err);
            await ctx.reply(`❌ *Failed to add Meta AI.*\n\nWhatsApp restricts bots from adding Meta AI automatically. You may need to add it manually.\n_Error: ${err.message}_`);
        }
    }
};