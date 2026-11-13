import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;
        if (!m.message.stickerMessage) return;

        const isEnabled = getGroupFeature(m.key.remoteJid, 'antisticker');
        if (!isEnabled) return;

        try {
            const isBot = await isBotAdmin(sock, m.key.remoteJid);
            if (!isBot) return;

            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
            if (isAdmin) return;

            await sock.sendMessage(m.key.remoteJid, {
                delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            });
            // We don't warn for stickers, just delete.
        } catch (err) { console.error('Antisticker error:', err); }
    });
}