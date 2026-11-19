import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;

        // Check if it's a status (group status) that mentioned the group
        const msgType = Object.keys(m.message)[0];
        const contextInfo = m.message[msgType]?.contextInfo;
        
        if (!contextInfo) return;
        
        // WhatsApp uses 'groupMentions' for status mentions
        const hasGroupMention = contextInfo.groupMentions && contextInfo.groupMentions.length > 0;
        
        // Alternatively, checks for isGroupStatus
        const isGroupStatus = contextInfo.isGroupStatus === true;

        if (!hasGroupMention && !isGroupStatus) return;

        const isEnabled = getGroupFeature(m.key.remoteJid, 'antigroupmention');
        if (!isEnabled) return;

        try {
            const isBot = await isBotAdmin(sock, m.key.remoteJid);
            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
            
            if (!isBot || isAdmin) return; // Bot must be admin, don't delete admin messages

            await sock.sendMessage(m.key.remoteJid, {
                delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            });

            await sock.sendMessage(m.key.remoteJid, {
                text: `🚫 *Anti-Group Mention*\n\n@${m.key.participant.split('@')[0]}, group mentions in statuses are not allowed here.`,
                mentions: [m.key.participant]
            });

        } catch (err) {
            console.error('AntiGroupMention error:', err);
        }
    });
}