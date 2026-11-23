import sharp from 'sharp';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'hd',
    aliases: ['enhance', 'upscale'],
    description: 'Upscale and sharpen an image to HD',
    category: 'General',
    ownerOnly: false,
    usage: 'hd (reply to an image)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted || ctx.quoted.type !== 'imageMessage') {
            if (ctx.type !== 'imageMessage') {
                return ctx.reply(`❌ Please reply to an image or send an image with the caption \`${prefix}hd\``);
            }
        }

        try {
            await ctx.react('⏳');
            
            const media = await ctx.getMedia();
            if (!media || !media.isImage) {
                return ctx.reply('❌ Failed to download the image.');
            }

            const enhancedBuffer = await sharp(media.buffer)
                .resize({ width: 1920, withoutEnlargement: false })
                .sharpen({ sigma: 1.5 })
                .jpeg({ quality: 95 })
                .toBuffer();

            await sock.sendMessage(m.key.remoteJid, {
                image: enhancedBuffer,
                caption: `✨ *Image Enhanced to HD*`
            }, { quoted: m });

            await ctx.react('✅');
        } catch (err) {
            console.error('Enhance error:', err);
            await ctx.react('❌');
            await ctx.reply('❌ Failed to enhance the image.');
        }
    }
};