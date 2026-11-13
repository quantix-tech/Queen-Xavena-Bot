import { getShadowbanList } from '../../handlers/shadowban.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

export default {
    command: 'shadowbans',
    description: 'List all shadowbanned users in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'shadowbans',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const list = getShadowbanList(m.key.remoteJid);

            if (list.length === 0) {
                return ctx.reply('📭 *Shadowban List*\n\nNo one is shadowbanned in this group.');
            }

            let text = `┌─〔 👻 SHADOWBANNED 〕\n`;
            text += `├◆ *Group* : ${metadata.subject}\n`;
            text += `├◆ *Total* : ${list.length}\n`;
            text += `└─────────────◆\n\n`;

            const mentions = [];
            list.forEach(jid => {
                const participant = metadata.participants.find(p => p.id === jid || p.phoneNumber === jid);
                const displayName = participant?.notify || participant?.name || jid.split('@')[0];
                text += `├◆ @${displayName}\n`;
                mentions.push(jid);
            });

            text += `└─────────────◆`;

            await sock.sendMessage(m.key.remoteJid, { text, mentions }, { quoted: m });
        } catch (err) {
            console.error('ListShadowbans error:', err);
            await ctx.reply(`❌ Failed to fetch shadowban list.\n_Error: ${err.message}_`);
        }
    }
};