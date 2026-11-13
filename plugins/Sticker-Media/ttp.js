import sharp from 'sharp';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName } from '../../lib/config.js';

export default {
    command: 'ttp',
    description: 'Convert text into a transparent sticker',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'ttp <text>',

    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        if (!text) {
            return ctx.reply('❌ *TTP*\n\nUsage: `.ttp <text>`\nExample: `.ttp Lord Xaven`');
        }

        if (text.length > 50) {
            return ctx.reply('❌ Text is too long. Keep it under 50 characters.');
        }

        await ctx.react('🎨');

        try {
            // We create a transparent SVG with a white stroke (outline) around the text
            const svgImage = `
                <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="65" font-weight="bold" fill="#FFFFFF" stroke="#000000" stroke-width="4" text-anchor="middle" dominant-baseline="middle">
                        ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </text>
                </svg>
            `;

            // Convert SVG to PNG using sharp (keeping the transparency)
            const pngBuffer = await sharp(Buffer.from(svgImage))
                .png()
                .toBuffer();

            // Convert PNG to Sticker
            const packName = getBotName();
            const sticker = new Sticker(pngBuffer, {
                pack: packName,
                author: 'Lord Xaven',
                type: StickerTypes.FULL,
                quality: 80,
                background: '#00000000' // Transparent
            });

            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(m.key.remoteJid, { sticker: stickerBuffer }, { quoted: m });
            await ctx.react('✅');

        } catch (err) {
            console.error('TTP error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to create sticker.\n_Error: ${err.message}_`);
        }
    }
};
