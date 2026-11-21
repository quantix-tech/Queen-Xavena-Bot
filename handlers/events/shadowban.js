import { isShadowbanned } from '../shadowban.js';
import { isBotAdmin, getRealJid, extractRawId } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        // Only check group messages, ignore if from me
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;

        const jid = m.key.remoteJid;
        const senderJid = m.key.participant;
        
        if (!senderJid) return;

        try {
            // 1. Resolve both the raw LID and the real phone number
            const rawId = extractRawId(senderJid);
            const realNumber = await getRealJid(senderJid, sock);

            // 2. Check if EITHER the raw ID or real number is in the shadowban list
            const isBannedByLid = isShadowbanned(jid, senderJid);
            const isBannedByNumber = isShadowbanned(jid, realNumber);
            const isBannedByRaw = isShadowbanned(jid, rawId);

            if (isBannedByLid || isBannedByNumber || isBannedByRaw) {
                const isBot = await isBotAdmin(sock, jid);
                if (!isBot) return; // Cannot delete if not admin

                // 3. Silent Delete
                await sock.sendMessage(jid, {
                    delete: { remoteJid: jid, fromMe: false, id: m.key.id, participant: senderJid }
                });
                
                console.log(`[shadowban] Deleted message from banned user: ${senderJid}`);
            }
        } catch (err) {
            console.error('Shadowban handler error:', err);
        }
    });
}