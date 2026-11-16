import { getGroupFeature } from '../features.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || m.key.fromMe) return;
        if (m.key.remoteJid === 'status@broadcast' || m.key.remoteJid.endsWith('@broadcast')) return;

        if (!getGroupFeature('global', 'autoreact')) return;

        // Don't react to view-once or protocol messages (they crash)
        if (m.message.viewOnceMessage || m.message.protocolMessage) return;

        try {
            const emojis = ['❤️', '🔥', '💯', '😂', '😮', '👍', '🙏', '🎉'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

            await sock.sendMessage(m.key.remoteJid, {
                react: { text: randomEmoji, key: m.key }
            });
        } catch (e) {
            // Ignore errors here to prevent spam
        }
    });
}