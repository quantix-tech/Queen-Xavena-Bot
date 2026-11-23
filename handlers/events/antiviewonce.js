// Queen Xavena — automatic view-once saver.
// Fires on every incoming message when the global 'antiviewonce' flag is ON.
// Saves view-once media silently to the bot's own DM.

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
        if (type !== 'notify' || !getGlobalFeature('antiviewonce')) return;
        if (!Array.isArray(messages)) return;

        for (const m of messages) {
            try {
                if (!m?.message || !m.key?.remoteJid) continue;
                if (m.key.fromMe) continue;

                const inner = findViewOnce(m.message);
                if (!inner) continue;

                const type_ = getType(inner);
                if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(type_)) continue;

                // Prefer the stored original (needed for decryption)
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
                const origin = m.key.remoteJid.endsWith('@g.us')
                    ? `Group: ${String(m.key.remoteJid).split('@')[0]}`
                    : 'DM';

                const caption =
                    `🔓 *View-Once ${type_.replace('Message', '')}*\n` +
                    `From: ${senderName} (+${realNumber})\n` +
                    `Origin: ${origin}`;

                const botJid = extractRawId(sock.user.id) + '@s.whatsapp.net';

                if (type_ === 'imageMessage') {
                    await sock.sendMessage(botJid, { image: buffer, caption });
                } else if (type_ === 'videoMessage') {
                    await sock.sendMessage(botJid, { video: buffer, caption });
                } else {
                    await sock.sendMessage(botJid, { audio: buffer, mimetype: 'audio/mpeg', ptt: true });
                    await sock.sendMessage(botJid, { text: caption });
                }
            } catch (err) {
                console.error('[antiviewonce]', err?.message || err);
            }
        }
    });
}