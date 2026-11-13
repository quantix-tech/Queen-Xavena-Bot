import sharp from 'sharp';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getBotName } from '../../lib/config.js';

export default {
    command: 'attp',
    description: 'Convert text into a glowing sticker',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'attp <text>',

    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        if (!text) {
            return ctx.reply('❌ *ATTP*\n\nUsage: `.attp <text>`\nExample: `.attp Queen Xavena`');
        }

        if (text.length > 50) {
            return ctx.reply('❌ Text is too long. Keep it under 50 characters.');
        }

        await ctx.react('🎨');

        try {
            // Generate a beautiful SVG with the text
            // We use a random neon color for the glowing effect
            const colors = ['#FF0055', '#00FFAA', '#FFAA00', '#00AAFF', '#FF00FF', '#AA00FF'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const svgImage = `
                <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <rect width="100%" height="100%" fill="#0a0a0a"/>
                    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="45" font-weight="bold" fill="${randomColor}" text-anchor="middle" dominant-baseline="middle" filter="url(#glow)">
                        ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </text>
                </svg>
            `;

            // Convert SVG to PNG using sharp
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
                background: '#00000000'
            });

            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(m.key.remoteJid, { sticker: stickerBuffer }, { quoted: m });
            await ctx.react('✅');

        } catch (err) {
            console.error('ATTP error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to create sticker.\n_Error: ${err.message}_`);
        }
    }
};