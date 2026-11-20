import { getGroupMetadata } from '../../lib/utils.js';
import { onlineUsers } from '../../handlers/events/presence.js';

export default {
    command: 'listonline',
    description: 'List members currently online in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'listonline',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, jid);
            const participants = metadata.participants || [];
            
            const activeMembers = [];
            for (const p of participants) {
                if (onlineUsers.has(`${jid}:${p.id}`)) {
                    activeMembers.push(p);
                }
            }

            if (activeMembers.length === 0) {
                return ctx.reply('🟢 *List Online*\n\nNo members are currently online.');
            }

            let text = `🟢 *Online Members (${activeMembers.length})*\n\n`;
            const mentions = [];
            activeMembers.forEach((p, i) => {
                const name = p.notify || p.name || p.id.split('@')[0];
                text += `${i + 1}. @${name}\n`;
                mentions.push(p.id);
            });

            await sock.sendMessage(jid, { text, mentions }, { quoted: m });
        } catch (err) { return ctx.reply(`❌ Error: ${err.message}`); }
    }
};