import { getGlobalFeature } from '../features.js';
import { getRealJid, extractRawId } from '../../lib/utils.js';
import { unwrap, getType } from '../../lib/message.js';
import { downloadMediaMessage } from '@itsliaaa/baileys';
import pino from 'pino';

const silentLogger = pino({ level: 'silent' });

const VO_WRAPPERS = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'];

export default function (sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        if (!getGlobalFeature('antiviewonce')) return;

        for (const m of messages) {
            try {
                if (!m?.message || !m.key?.remoteJid) continue;
                if (m.key.fromMe) continue;

                // Detect a view-once wrapper anywhere in the chain
                let wrapped = null;
                let cur = m.message;
                for (let i = 0; i < 4; i++) {
                    const hit = VO_WRAPPERS.find(w => cur?.[w]?.message);
                    if (hit) { wrapped = cur[hit].message; break; }
                    // unwrap one layer at a time in case it's nested
                    const next = unwrap(cur);
                    if (!next || next === cur) break;
                    cur = next;
                }
                if (!wrapped) continue;

                const innerType = getType(wrapped);
                if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(innerType)) continue;

                // Download
                const buffer = await downloadMediaMessage(
                    { message: wrapped, key: m.key },
                    'buffer',
                    {},
                    { logger: silentLogger, reuploadRequest: sock.updateMediaMessage }
                );
                if (!buffer?.length) continue;

                // Who sent it
                const senderJid = m.key.participant || m.key.remoteJid;
                const realNumber = await getRealJid(senderJid, sock);
                const senderName = m.pushName || realNumber || 'Unknown';
                const origin = m.key.remoteJid.endsWith('@g.us')
                    ? `Group: ${m.key.remoteJid.split('@')[0]}`
                    : 'DM';

                const caption =
                    `🔓 *View-Once ${innerType.replace('Message', '')}*\n` +
                    `From: ${senderName} (+${realNumber})\n` +
                    `Origin: ${origin}`;

                const botJid = extractRawId(sock.user.id) + '@s.whatsapp.net';

                if (innerType === 'imageMessage') {
                    await sock.sendMessage(botJid, { image: buffer, caption });
                } else if (innerType === 'videoMessage') {
                    await sock.sendMessage(botJid, { video: buffer, caption });
                } else {
                    await sock.sendMessage(botJid, { audio: buffer, mimetype: 'audio/mpeg', ptt: true });
                }
            } catch (err) {
                console.error('[antiviewonce]', err?.message || err);
            }
        }
    });
}