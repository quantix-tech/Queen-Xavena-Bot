import { getGlobalFeature } from '../features.js';
import { getRealJid } from '../../lib/utils.js';
import { unwrap, getType } from '../../lib/message.js';
import { downloadMediaMessage } from '@itsliaaa/baileys';
import pino from 'pino';

const silentLogger = pino({ level: 'silent' });
const VO_WRAPPERS = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'];

export default function (sock) {
    console.log('[AVO] Listener loaded');

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log('[AVO] upsert fired, type =', type, 'count =', messages?.length);

        if (type !== 'notify') {
            console.log('[AVO] STOP - type is not notify');
            return;
        }

        const enabled = getGlobalFeature('antiviewonce');
        console.log('[AVO] getGlobalFeature =', enabled);
        if (!enabled) {
            console.log('[AVO] STOP - antiviewonce is OFF in features.json');
            return;
        }

        for (const m of messages) {
            try {
                console.log('[AVO] --- new message ---');
                console.log('[AVO] fromMe =', m.key?.fromMe, 'remoteJid =', m.key?.remoteJid);
                console.log('[AVO] top keys =', Object.keys(m.message || {}));

                if (!m?.message || !m.key?.remoteJid) {
                    console.log('[AVO] STOP - no message or no remoteJid');
                    continue;
                }
                if (m.key.fromMe) {
                    console.log('[AVO] STOP - fromMe, skipping');
                    continue;
                }

                // Show raw structure
                console.log('[AVO] raw message =', JSON.stringify(m.message).slice(0, 1000));

                let wrapped = null;

                // DETECTION 1: Wrapper style
                let cur = m.message;
                for (let i = 0; i < 4; i++) {
                    const hit = VO_WRAPPERS.find(w => cur?.[w]?.message);
                    console.log(`[AVO] detection1 loop ${i}, hit =`, hit);
                    if (hit) { wrapped = cur[hit].message; break; }
                    const next = unwrap(cur);
                    console.log(`[AVO] detection1 loop ${i}, unwrap result keys =`, next ? Object.keys(next) : next);
                    if (!next || next === cur) break;
                    cur = next;
                }

                // DETECTION 2: Flag style
                if (!wrapped) {
                    console.log('[AVO] detection1 failed, trying flag style');
                    let check = m.message;
                    for (let i = 0; i < 4; i++) {
                        if (!check) break;
                        const t = getType(check);
                        console.log(`[AVO] detection2 loop ${i}, type =`, t, 'viewOnce =', check[t]?.viewOnce);
                        if (['imageMessage', 'videoMessage', 'audioMessage'].includes(t)) {
                            if (check[t]?.viewOnce === true) {
                                wrapped = check;
                                console.log('[AVO] detection2 FOUND via flag');
                                break;
                            }
                        }
                        const next = unwrap(check);
                        if (!next || next === check) break;
                        check = next;
                    }
                }

                if (!wrapped) {
                    console.log('[AVO] STOP - not detected as view-once');
                    continue;
                }

                console.log('[AVO] wrapped keys =', Object.keys(wrapped));
                const innerType = getType(wrapped);
                console.log('[AVO] innerType =', innerType);
                if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(innerType)) {
                    console.log('[AVO] STOP - unsupported innerType');
                    continue;
                }

                console.log('[AVO] trying downloadMediaMessage...');
                const buffer = await downloadMediaMessage(
                    { message: wrapped, key: m.key },
                    'buffer',
                    {},
                    { logger: silentLogger, reuploadRequest: sock.updateMediaMessage }
                );
                console.log('[AVO] download result length =', buffer?.length);

                if (!buffer?.length) {
                    console.log('[AVO] STOP - buffer empty');
                    continue;
                }

                const senderJid = m.key.participant || m.key.remoteJid;
                const realNumber = await getRealJid(senderJid, sock);
                const senderName = m.pushName || realNumber || 'Unknown';
                console.log('[AVO] sender =', senderName, realNumber);

                const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                console.log('[AVO] sending to botJid =', botJid);

                const caption =
                    `🔓 *View-Once ${innerType.replace('Message', '')}*\n` +
                    `From: ${senderName} (+${realNumber})\n` +
                    `Origin: ${m.key.remoteJid.endsWith('@g.us') ? 'Group' : 'DM'}`;

                if (innerType === 'imageMessage') {
                    await sock.sendMessage(botJid, { image: buffer, caption });
                } else if (innerType === 'videoMessage') {
                    await sock.sendMessage(botJid, { video: buffer, caption });
                } else {
                    await sock.sendMessage(botJid, { audio: buffer, mimetype: 'audio/mpeg', ptt: true });
                }
                console.log('[AVO] SUCCESS - sent to bot DM');
            } catch (err) {
                console.error('[AVO ERROR] ', err?.message || err);
                console.error(err?.stack);
            }
        }
    });
}