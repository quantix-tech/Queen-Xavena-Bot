import { addActivity } from '../activity.js';
import { getPrefix } from '../../lib/config.js';

export default function (sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify' || !Array.isArray(messages)) return;
        
        const prefix = getPrefix();

        for (const m of messages) {
            if (!m?.message || !m.key?.remoteJid) continue;
            if (!m.key.remoteJid.endsWith('@g.us')) continue; // Groups only
            if (m.key.fromMe) continue; // Ignore bot's own messages

            // Check if it's a command (ignore commands)
            const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            if (prefix && text.startsWith(prefix)) continue;

            // It's a normal message, track it!
            const userId = m.key.participant;
            if (userId) {
                addActivity(m.key.remoteJid, userId);
            }
        }
    });
}