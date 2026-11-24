import { getGlobalFeature } from '../features.js';
import { getRealJid, extractRawId } from '../../lib/utils.js';
import { getStored } from '../../lib/vvstore.js';
import { downloadMediaMessage } from '@itsliaaa/baileys';
import pino from 'pino';

const silentLogger = pino({ level: 'silent' });

// Deep search function to find view-once media anywhere in the payload
function deepFindViewOnce(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 10) return null;

    // 1. Check all keys in the current object
    for (const key of Object.keys(obj)) {
        const val = obj[key];

        // If we find a known media type, check if it's view-once
        if (['imageMessage', 'videoMessage', 'audioMessage'].includes(key)) {
            if (val && val.viewOnce === true) {
                return { type: key, media: val, original: obj };
            }
        }

        // 2. If it's another object (like viewOnceMessage, ephemeral, etc.), dig deeper
        if (typeof val === 'object' && val !== null) {
            const result = deepFindViewOnce(val, depth + 1);
            if (result) return result; // Found it deep inside!
        }
    }

    return null;
}

export default function (sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        if (!getGlobalFeature('antiviewonce')) return; 
        if (!Array.isArray(messages)) return;

        for (const m of messages) {
            try {
                if (!m?.message || !m.key?.remoteJid) continue;
                if (m.key.fromMe) continue;

                // Use the deep search
                const found = deepFindViewOnce(m.message);
                if (!found) continue;

                const innerType = found.type;
                
                // Get the original stored message for decryption keys
                const stored = getStored(m.key) || m.message;

                const buffer = await downloadMediaMessage(
                    { key: m.key, message: stored },
                    'buffer',
                    {},
                    { logger: silentLogger, reuploadRequest: msg => sock.updateMediaMessage(msg) }
                ).catch(() => null);

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
                
                console.log(`[antiviewonce] Saved ${innerType} to bot DM`);
            } catch (err) {
                console.error('[antiviewonce]', err?.message || err);
            }
        }
    });
}