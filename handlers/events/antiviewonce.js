import { getGlobalFeature } from '../features.js';
import { getRealJid, extractRawId } from '../../lib/utils.js';
import { unwrap, getType } from '../../lib/message.js';
import { getStored } from '../../lib/vvstore.js';
import { downloadMediaMessage } from '@itsliaaa/baileys';
import pino from 'pino';

const silentLogger = pino({ level: 'silent' });
const VO_WRAPPERS = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'];

function findViewOnce(message) {
    let cur = message;
    for (let i = 0; i < 6 && cur; i++) {
        const hit = VO_WRAPPERS.find(w => cur?.[w]?.message);
        if (hit) return cur[hit].message;
        const next = unwrap(cur);
        if (!next || next === cur) break;
        cur = next;
    }
    return null;
}

export default function (sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        // Debug 1: Is the toggle ON?
        const isOn = getGlobalFeature('antiviewonce');
        if (!isOn) return; 

        if (!Array.isArray(messages)) return;

        for (const m of messages) {
            try {
                if (!m?.message || !m.key?.remoteJid) continue;
                if (m.key.fromMe) continue;

                // Debug 2: Is it a view once?
                const inner = findViewOnce(m.message);
                if (!inner) continue; // Normal message, ignore.

                const innerType = getType(inner);
                console.log(`\n[DEBUG-AVO] Found ViewOnce! Type: ${innerType}`);
                
                if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(innerType)) {
                    console.log(`[DEBUG-AVO] Unsupported type: ${innerType}`);
                    continue;
                }

                const stored = getStored(m.key) || m.message;

                console.log(`[DEBUG-AVO] Attempting download...`);
                const buffer = await downloadMediaMessage(
                    { key: m.key, message: stored },
                    'buffer',
                    {},
                    { logger: silentLogger, reuploadRequest: msg => sock.updateMediaMessage(msg) }
                ).catch((err) => {
                    console.log(`[DEBUG-AVO] Download FAILED:`, err.message);
                    return null;
                });

                if (!buffer?.length) {
                    console.log(`[DEBUG-AVO] Buffer is empty or null.`);
                    continue;
                }

                console.log(`[DEBUG-AVO] Download SUCCESS! Buffer size: ${buffer.length} bytes.`);

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