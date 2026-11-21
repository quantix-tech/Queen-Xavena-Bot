import { trackMessage } from '../activity.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;
        
        if (m.key.participant) {
            trackMessage(m.key.remoteJid, m.key.participant);
        }
    });
}