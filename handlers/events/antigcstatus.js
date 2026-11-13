import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;

        const isGcStatus = m.message?.extendedTextMessage?.contextInfo?.isGroupStatus ||
                           m.message?.imageMessage?.contextInfo?.isGroupStatus ||
                           m.message?.videoMessage?.contextInfo?.isGroupStatus;

        if (!isGcStatus) return;

        const isEnabled = getGroupFeature(m.key.remoteJid, 'antigcstatus');
        if (!isEnabled) return;

        try {
            const isBot = await isBotAdmin(sock, m.key.remoteJid);
            if (!isBot) return;

            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
            if (isAdmin) return;

            await sock.sendMessage(m.key.remoteJid, {
                delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            });
            await sock.sendMessage(m.key.remoteJid, {
                text: `🚫 *GC Status Not Allowed*\n@${m.key.participant.split('@')[0]}, group statuses are disabled here.`,
                mentions: [m.key.participant]
            });
        } catch (err) { console.error('Antigcstatus error:', err); }
    });
}