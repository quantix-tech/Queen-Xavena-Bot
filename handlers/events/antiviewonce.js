import { getGlobalFeature } from '../features.js';
import { getRealJid } from '../../lib/utils.js';
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

                // ONLY log if it looks like media / view-once - ignore everything else silently
                const topKeys = Object.keys(m.message);
                const isMaybeMedia = topKeys.some(k =>
                    ['imageMessage', 'videoMessage', 'audioMessage',
                     'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension',
                     'ephemeralMessage', 'documentWithCaptionMessage'].includes(k)
                );
                if (!isMaybeMedia) continue; // <-- text, protocolMessage, reactions, etc. = no log

                console.log('[AVO] media msg from', m.key.remoteJid, 'keys =', topKeys);

                let wrapped = null;

                // DETECTION 1: Wrapper style
                let cur = m.message;
                for (let i = 0; i < 4; i++) {
                    const hit = VO_WRAPPERS.find(w => cur?.[w]?.message);
                    if (hit) { wrapped = cur[hit].message; break; }
                    const next = unwrap(cur);
                    if (!next || next === cur) break;
                    cur = next;
                }

                // DETECTION 2: Flag style
                if (!wrapped) {
                    let check = m.message;
                    for (let i = 0; i < 4; i++) {
                        if (!check) break;
                        const t = getType(check);
                        if (['imageMessage', 'videoMessage', 'audioMessage'].includes(t)) {
                            if (check[t]?.viewOnce === true) {
                                wrapped = check;
                                break;
                            }
                        }
                        const next = unwrap(check);
                        if (!next || next === check) break;
                        check = next;
                    }
                }

                if (!wrapped) {
                    console.log('[AVO] not view-once, skipping');
                    continue;
                }

                const innerType = getType(wrapped);
                console.log('[AVO] view-once detected, type =', innerType);
                if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(innerType)) continue;

                const buffer = await downloadMediaMessage(
                    { message: wrapped, key: m.key },
                    'buffer',
                    {},
                    { logger: silentLogger, reuploadRequest: sock.updateMediaMessage }
                );
                console.log('[AVO] download length =', buffer?.length);

                if (!buffer?.length) {
                    console.log('[AVO] download failed / empty');
                    continue;
                }

                const senderJid = m.key.participant || m.key.remoteJid;
                const realNumber = await getRealJid(senderJid, sock);
                const senderName = m.pushName || realNumber || 'Unknown';
                const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

                const caption = `🔓 *View-Once ${innerType.replace('Message', '')}*\nFrom: ${senderName} (+${realNumber})`;

                if (innerType === 'imageMessage') {
                    await sock.sendMessage(botJid, { image: buffer, caption });
                } else if (innerType === 'videoMessage') {
                    await sock.sendMessage(botJid, { video: buffer, caption });
                } else {
                    await sock.sendMessage(botJid, { audio: buffer, mimetype: 'audio/mpeg', ptt: true });
                }
                console.log('[AVO] ✅ sent to bot DM');
            } catch (err) {
                console.error('[AVO ERROR]', err?.message || err);
            }
        }
    });
}