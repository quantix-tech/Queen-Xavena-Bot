import sharp from 'sharp';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'fakequote',
    aliases: ['fc', 'quote'],
    description: 'Generate a fake WhatsApp quote image',
    category: 'Tools',
    ownerOnly: false,
    usage: 'fakequote <text> OR reply to a message',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let text = args.join(' ');
        
        if (!text && ctx.quoted) {
            text = ctx.quoted.text;
        }

        if (!text) {
            return ctx.reply(`❌ Provide some text, or reply to a message you want to quote.\n\n*Example:* \`${prefix}fakequote I am the greatest\``);
        }

        try {
            await ctx.react('⏳');

            let name = m.pushName || 'User';
            let jid = m.key.remoteJid;
            
            if (ctx.quoted) {
                jid = ctx.quoted.sender.includes('@') ? ctx.quoted.sender : ctx.quoted.sender + '@s.whatsapp.net';
                if (m.key.remoteJid.endsWith('@g.us')) {
                    try {
                        const metadata = await sock.groupMetadata(m.key.remoteJid);
                        const participant = metadata.participants.find(p => p.id === jid);
                        name = participant?.notify || participant?.name || jid.split('@')[0];
                    } catch (e) {}
                } else {
                    name = jid.split('@')[0];
                }
            }

            // 1. Get and process profile picture (Make it round)
            let ppBase64 = '';
            try {
                const ppUrl = await sock.profilePictureUrl(jid, 'image');
                const ppBuffer = Buffer.from(await (await fetch(ppUrl)).arrayBuffer());
                const roundPp = await sharp(ppBuffer)
                    .resize(80, 80)
                    .composite([{
                        input: Buffer.from('<svg><circle cx="40" cy="40" r="40"/></svg>'),
                        blend: 'dest-in'
                    }])
                    .png()
                    .toBuffer();
                ppBase64 = roundPp.toString('base64');
            } catch (e) {
                // If no profile pic, leave it blank (SVG will show gray circle)
            }

            // 2. Escape text for SVG
            const escapeSvg = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            
            const safeName = escapeSvg(name.substring(0, 25)); // Truncate long names
            const safeText = escapeSvg(text);

            // 3. Create SVG template
            // Note: We use <foreignObject> to let the SVG handle text wrapping automatically
            const svg = `
            <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
                <!-- Background -->
                <rect width="100%" height="100%" fill="#0b141a" />
                
                <!-- Chat Bubble -->
                <rect x="50" y="50" width="700" height="300" rx="15" fill="#005c4b" />
                
                <!-- Profile Picture (or gray circle if none) -->
                ${ppBase64 
                    ? `<image href="data:image/png;base64,${ppBase64}" x="70" y="70" width="80" height="80" />`
                    : `<circle cx="110" cy="110" r="40" fill="#cccccc" />`
                }
                
                <!-- Name Text -->
                <text x="170" y="110" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">${safeName}</text>
                
                <!-- Message Text (using foreignObject for auto-wrapping) -->
                <foreignObject x="70" y="160" width="640" height="150">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #ffffff; font-family: Arial, sans-serif; font-size: 22px; line-height: 1.4; word-wrap: break-word; white-space: pre-wrap;">${safeText}</div>
                </foreignObject>
                
                <!-- Timestamp -->
                <text x="690" y="320" font-family="Arial, sans-serif" font-size="18" fill="#8696a0" text-anchor="end">12:00</text>
                
                <!-- Double Checkmarks -->
                <path d="M 705 310 L 710 315 L 720 305" stroke="#53bdeb" stroke-width="2" fill="none" />
                <path d="M 712 310 L 717 315 L 727 305" stroke="#53bdeb" stroke-width="2" fill="none" />
            </svg>
            `;

            // 4. Render SVG to PNG
            const finalBuffer = await sharp(Buffer.from(svg))
                .png()
                .toBuffer();

            await sock.sendMessage(m.key.remoteJid, {
                image: finalBuffer,
                caption: '🎭 *Fake Quote Generated*'
            }, { quoted: m });

            await ctx.react('✅');
        } catch (err) {
            console.error('FakeQuote error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to generate the quote image.\n_Error: ${err.message}_`);
        }
    }
};