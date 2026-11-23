import { getGlobalFeature } from '../features.js';
import { getRealJid, extractRawId } from '../../lib/utils.js';
import { unwrap, getType } from '../../lib/message.js';
import { getStored } from '../../lib/vvstore.js';
import { downloadMediaMessage } from '@itsliaaa/baileys';
import pino from 'pino';

const silentLogger = pino({ level: 'silent' });
const VO_WRAPPERS = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'];

// NEW LOGIC: Handles both wrapped view-onces (from Android clients) 
// AND unwrapped direct view-onces (from Web clients).
function findViewOnce(message) {
    let cur = message;
    
    // 1. Check for wrappers
    for (let i = 0; i < 6 && cur; i++) {
        const hit = VO_WRAPPERS.find(w => cur?.[w]?.message);
        if (hit) return cur[hit].message;
        const next = unwrap(cur);
        if (!next || next === cur) break;
        cur = next;
    }

    // 2. Check for direct view-once flag on the media itself
    cur = unwrap(message) || message;
    const type = getType(cur);
    if (type && cur[type]?.viewOnce === true) {
        console.log(`[DEBUG-AVO] Found direct viewOnce flag on ${type}!`);
        return cur;
    }

    return null;
}

export default function (sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const isOn = getGlobalFeature('antiviewonce');
        if (!isOn) return; 

        if (!Array.isArray(messages)) return;

        for (const m of messages) {
            try {
                if (!m?.message || !m.key?.remoteJid) continue;
                if (m.key.fromMe) continue;

                const inner = findViewOnce(m.message);
                if (!inner) continue;

                const innerType = getType(inner);
                if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(innerType)) continue;

                console.log(`[DEBUG-AVO] Found ViewOnce! Type: ${innerType}`);

                const stored = getStored(m.key) || m.message;

                const buffer = await downloadMediaMessage(
                    { key: m.key, message: stored },
                    'buffer',
                    {},
                    { logger: silentLogger, reuploadRequest: msg => sock.updateMediaMessage(msg) }
                ).catch((err) => {
                    console.log(`[DEBUG-AVO] Download FAILED:`, err.message);
                    return null;
                });

                if (!buffer?.length) continue;

                const senderJid = m.key.participant || m.key.remoteJid;
                const realNumber = await getRealJid(senderJid, sock);
                const senderName = m.pushName || realNumber || 'Unknown';
                const origin = m.key.remoteJid.endsWith('@g.us') ? 'Group' : 'DM';
                const botJid = extractRawId(sock.user.id) + '@s.whatsapp.net';

                const caption = `🔓 *View-Once ${innerType.replace('Message', '')}*\nFrom: ${senderName}\nOrigin: ${origin}`;

                if (innerType === 'imageMessage') {
                    await sock.sendMessage(botJid, { image: buffer, caption });
                } else if (innerType === 'videoMessage') {
                    await sock.sendMessage(botJid, { video: buffer, caption });
                } else {
                    await sock.sendMessage(botJid, { audio: buffer, mimetype: 'audio/mpeg', ptt: true });
                    await sock.sendMessage(botJid, { text: caption });
                }
                
                console.log(`[DEBUG-AVO] Saved to bot DM successfully.`);

            } catch (err) {
                console.error('[antiviewonce] Error:', err?.message || err);
            }
        }
    });
}