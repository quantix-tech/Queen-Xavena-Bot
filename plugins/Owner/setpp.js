export default {
    command: 'setpp',
    description: 'Change the bot profile picture',
    category: 'Owner',
    ownerOnly: true,
    usage: '.setpp (reply to an image)',

    async execute(sock, m, args, ctx) {
        if (!ctx.quoted) {
            return ctx.reply('🖼️ *Set Profile Picture*\n\nReply to an image with `.setpp`.');
        }

        const media = await ctx.getMedia();
        if (!media || !media.isImage) {
            return ctx.reply('❌ Please reply to a valid image (JPG/PNG).');
        }

        try {
            await ctx.react('🖼️');
            
            // Get the bot's own JID
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            
            // Update profile picture
            await sock.updateProfilePicture(botJid, media.buffer);
            
            await ctx.reply('✅ *Profile Picture Updated!*');
        } catch (err) {
            console.error('Setpp error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to update profile picture.\n_Error: ${err.message}_`);
        }
    }
};