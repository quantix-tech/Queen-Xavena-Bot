import { Jimp, loadFont, HorizontalAlign, VerticalAlign } from 'jimp';
import { SANS_32_WHITE } from 'jimp/fonts';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'fakequote',
    aliases: ['fc', 'quote'],
    description: 'Generate a fake WhatsApp quote image',
    category: 'General',
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

            let ppBuffer;
            try {
                const ppUrl = await sock.profilePictureUrl(jid, 'image');
                ppBuffer = Buffer.from(await (await fetch(ppUrl)).arrayBuffer());
            } catch (e) {
                ppBuffer = await new Jimp({ width: 200, height: 200, color: 0xccccccff }).getBufferAsync('image/png');
            }

            const canvasWidth = 800;
            const canvasHeight = 400;
            const image = new Jimp({ width: canvasWidth, height: canvasHeight, color: 0x0b141aff });

            const font = await loadFont(SANS_32_WHITE);

            const bubbleColor = 0x005c4bff;
            image.scan(50, 50, 700, 300, function (x, y, idx) {
                this.bitmap.data[idx + 0] = (bubbleColor >> 24) & 0xff;
                this.bitmap.data[idx + 1] = (bubbleColor >> 16) & 0xff;
                this.bitmap.data[idx + 2] = (bubbleColor >> 8) & 0xff;
                this.bitmap.data[idx + 3] = bubbleColor & 0xff;
            });

            const pp = await Jimp.read(ppBuffer);
            pp.circle();
            pp.resize({ w: 80, h: 80 });
            image.composite(pp, 70, 70);

            image.print({
                font,
                x: 170,
                y: 80,
                text: name,
            });

            image.print({
                font,
                x: 70,
                y: 180,
                maxWidth: 660,
                text: text,
            });

            const timeFont = await loadFont(SANS_32_WHITE);
            image.print({
                font: timeFont,
                x: 650,
                y: 310,
                text: '12:00',
            });

            const finalBuffer = await image.getBufferAsync('image/png');

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