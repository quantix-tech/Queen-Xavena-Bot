import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin, getGroupMetadata } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;

        const jid = m.key.remoteJid;
        if (!getGroupFeature(jid, 'antitagall')) return;

        // Check mentions
        const msgType = Object.keys(m.message)[0];
        const contextInfo = m.message[msgType]?.contextInfo;
        const mentions = contextInfo?.mentionedJid || [];

        // If mentions are more than 10, consider it tagall
        if (mentions.length < 10) return;

        try {
            const isBot = await isBotAdmin(sock, jid);
            const isAdmin = await isSenderAdmin(sock, jid, m.key.participant);
            if (!isBot || isAdmin) return; // Bot needs admin, admins are exempt

            await sock.sendMessage(jid, {
                delete: { remoteJid: jid, fromMe: false, id: m.key.id, participant: m.key.participant }
            });

            await sock.sendMessage(jid, {
                text: `🚫 *Anti-TagAll*\n@${m.key.participant.split('@')[0]}, mass mentions are not allowed.`,
                mentions: [m.key.participant]
            });
        } catch (err) { console.error(err); }
    });
}