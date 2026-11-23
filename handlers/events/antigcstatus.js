import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';


function isGroupStatus(m) {
    if (!m?.message) return false;

    
    if (m.message.groupStatus) return true;

   
    if (m.message.groupStatusMessageV2) return true;

    return false;
}

export default function (sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        if (!Array.isArray(messages)) return;

        for (const m of messages) {
            try {
                if (!m?.message || !m.key?.remoteJid) continue;
                if (!m.key.remoteJid.endsWith('@g.us')) continue;
                if (m.key.fromMe) continue;

                const isEnabled = getGroupFeature(m.key.remoteJid, 'antigcstatus');
                if (!isEnabled) continue;

                if (!isGroupStatus(m)) continue;

                const isBot = await isBotAdmin(sock, m.key.remoteJid);
                if (!isBot) continue;

                const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
                if (isAdmin) continue;

                await sock.sendMessage(m.key.remoteJid, {
                    delete: {
                        remoteJid: m.key.remoteJid,
                        fromMe: false,
                        id: m.key.id,
                        participant: m.key.participant
                    }
                });

                await sock.sendMessage(m.key.remoteJid, {
                    text: `🚫 *GC Status Not Allowed*\n@${m.key.participant.split('@')[0]}, group statuses are disabled here.`,
                    mentions: [m.key.participant]
                });
            } catch (err) {
                console.error('[antigcstatus]', err?.message || err);
            }
        }
    });
}