import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';
import { unwrap, getType } from '../../lib/message.js';
import { delay } from '@itsliaaa/baileys';

function isGroupStatus(m) {
    if (!m?.message) return false;

    
    if (m.message.groupStatus) return true;
    if (m.message.groupStatusMessageV2) return true;
    if (m.message.groupStatusMessage) return true;

    // 2. Unwrap and check contextInfo
    const inner = unwrap(m.message) || m.message;
    const type = getType(inner);
    if (!type) return false;

    const ctxInfo = inner[type]?.contextInfo;
    if (!ctxInfo) return false;

    
    if (ctxInfo.isGroupStatus === true) return true;
    if (ctxInfo.remoteJid === 'status@broadcast') return true;
    
    
    if (ctxInfo.statusSourceType !== undefined) return true;

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

                const mode = getGroupFeature(m.key.remoteJid, 'antigcstatus');
                if (!mode || mode === 'off') continue;

                // If it's not a status, skip
                if (!isGroupStatus(m)) continue;

                const isBot = await isBotAdmin(sock, m.key.remoteJid);
                if (!isBot) continue;

                const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
                if (isAdmin) continue;

               
                try {
                    await sock.sendMessage(m.key.remoteJid, { delete: m.key });
                    console.log(`[antigcstatus] Deleted status from ${m.key.participant}`);
                } catch (delErr) {
                    console.error('[antigcstatus] Delete failed:', delErr.message);
                }

              
                if (mode === 'kick' || mode === true) {
                    await delay(500);
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `🚫 @${m.key.participant.split('@')[0]} has been removed for posting a group status.`,
                        mentions: [m.key.participant]
                    });
                    await sock.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove');
                }
            } catch (err) {
                console.error('[antigcstatus]', err?.message || err);
            }
        }
    });
}