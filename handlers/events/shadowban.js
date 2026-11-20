import { isShadowbanned } from '../shadowban.js';
import { isBotAdmin, extractRawId } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;

        const jid = m.key.remoteJid;
        const senderJid = m.key.participant;
        
        if (!senderJid) return;

        // Check if the sender is shadowbanned by their exact raw number
        if (isShadowbanned(jid, senderJid)) {
            try {
                const isBot = await isBotAdmin(sock, jid);
                if (!isBot) return; // Cannot delete if not admin

                await sock.sendMessage(jid, {
                    delete: { remoteJid: jid, fromMe: false, id: m.key.id, participant: senderJid }
                });
            } catch (err) {
                console.error('Shadowban delete error:', err);
            }
            return; // Stop processing
        }
    });
}