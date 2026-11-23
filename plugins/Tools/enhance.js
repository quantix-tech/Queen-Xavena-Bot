import sharp from 'sharp';

export default {
    command: 'hd',
    aliases: ['enhance', 'upscale'],
    description: 'Upscale and sharpen an image to HD',
    category: 'Tools',
    ownerOnly: false,
    usage: 'hd (reply to an image)',

    async execute(sock, m, args, ctx) {
        if (!ctx.quoted || ctx.quoted.type !== 'imageMessage') {
            if (ctx.type !== 'imageMessage') {
                return ctx.reply('❌ Please reply to an image or send an image with the caption `.hd`');
            }
        }

        try {
            await ctx.react('⏳');
            
            // ctx.getMedia() automatically checks the current message OR the quoted message
            const media = await ctx.getMedia();
            if (!media || !media.isImage) {
                return ctx.reply('❌ Failed to download the image.');
            }

            // Use sharp to upscale and sharpen
            const enhancedBuffer = await sharp(media.buffer)
                .resize({ width: 1920, withoutEnlargement: false }) // Scale to 1080p width
                .sharpen({ sigma: 1.5 }) // Add sharpness
                .jpeg({ quality: 95 }) // Output as high-quality JPEG
                .toBuffer();

            await sock.sendMessage(m.key.remoteJid, {
                image: enhancedBuffer,
                caption: `✨ *Image Enhanced to HD*\n\n> Powered by Queen Xavena`
            }, { quoted: m });

            await ctx.react('✅');
        } catch (err) {
            console.error('Enhance error:', err);
            await ctx.react('❌');
            await ctx.reply('❌ Failed to enhance the image.');
        }
    }
};