import { getGroupMetadata } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'exportgc',
    aliases: ['exportmembers'],
    description: 'Export group members list as a text file',
    category: 'Group',
    ownerOnly: false,
    usage: 'exportgc',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants || [];
            
            let text = `👥 *Group:* ${metadata.subject}\n📅 *Exported:* ${new Date().toLocaleString()}\n\n`;
            
            participants.forEach((p, i) => {
                const name = p.notify || p.name || 'Unknown';
                const phone = p.phoneNumber ? p.phoneNumber.split('@')[0] : p.id.split('@')[0];
                const role = p.admin ? `[${p.admin}]` : '[member]';
                text += `${i + 1}. ${name} (+${phone}) ${role}\n`;
            });

            const buffer = Buffer.from(text, 'utf-8');
            const fileName = `${metadata.subject.replace(/[^a-zA-Z0-9]/g, '_')}_members.txt`;

            await sock.sendMessage(m.key.remoteJid, {
                document: buffer,
                mimetype: 'text/plain',
                fileName: fileName,
                caption: `✅ *Exported ${participants.length} members.*`
            }, { quoted: m });

        } catch (err) {
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};