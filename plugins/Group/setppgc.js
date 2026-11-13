import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'setgcpp',
    description: 'Change the group profile picture',
    category: 'Group',
    ownerOnly: false,
    usage: 'setgcpp (reply to image)',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');
        if (!ctx.quoted) return ctx.reply('🖼️ *Set GC Picture*\n\nReply to an image with `.setgcpp`.');

        const media = await ctx.getMedia();
        if (!media || !media.isImage) return ctx.reply('❌ Please reply to a valid image (JPG/PNG).');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to change the group picture.');
            }

            await sock.updateProfilePicture(m.key.remoteJid, media.buffer);

            await ctx.reply(`✅ *Group Profile Picture Updated!*`);
        } catch (err) {
            console.error('SetGCPP error:', err);
            await ctx.reply(`❌ Failed to update group picture.\n_Error: ${err.message}_`);
        }
    }
};