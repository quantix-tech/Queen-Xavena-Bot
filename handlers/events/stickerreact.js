import { getGroupFeature } from '../features.js';
import { sendStickerReaction, isStickerReactionMessage } from '../../lib/stickerreact.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid) return;

        // Ignore status and broadcast
        if (m.key.remoteJid === 'status@broadcast' || m.key.remoteJid.endsWith('@broadcast')) return;

        // Check if the feature is enabled
        const isEnabled = getGroupFeature('global', 'stickerreact_enabled');
        if (!isEnabled) return;

        // Prevent the bot from reacting to its OWN sticker reactions (infinite loop)
        if (isStickerReactionMessage(m.message)) return;

        const mode = getGroupFeature('global', 'stickerreact_mode') || 'owner';

        // Mode logic:
        // Owner mode: only reacts if the message is from the owner (fromMe: true)
        // Global mode: reacts to everyone
        if (mode === 'owner' && !m.key.fromMe) return;

        // Send the reaction
        await sendStickerReaction(sock, m.key.remoteJid, m.key);
    });
}