import QRCode from 'qrcode';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'qr',
    aliases: ['qrcode'],
    description: 'Generate a QR code from text or a link',
    category: 'Tools',
    ownerOnly: false,
    usage: 'qr <text or url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const text = args.join(' ');

        if (!text) {
            return ctx.reply(`📱 *QR Code Generator*\n\nUsage: \`${prefix}qr <text or link>\`\nExample: \`${prefix}qr https://github.com/Quantix-tech\``);
        }

        try {
            // Generate QR as a buffer
            const qrBuffer = await QRCode.toBuffer(text, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 512
            });

            await sock.sendMessage(m.key.remoteJid, {
                image: qrBuffer,
                caption: `📱 *QR Code*\n\n*Text:* ${text}`
            }, { quoted: m });
            
        } catch (err) {
            console.error('QR error:', err);
            await ctx.reply('❌ Failed to generate QR code. Text might be too long.');
        }
    }
};