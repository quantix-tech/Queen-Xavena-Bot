// Queen Xavena — always-on message archiver.
// Runs on every messages.upsert and saves the raw message so view-once
// payloads can still be fetched later (getMessage / .vv / .vv2).

import { remember } from '../../lib/vvstore.js';

export default function (sock) {
    sock.ev.on('messages.upsert', ({ messages }) => {
        if (!Array.isArray(messages)) return;
        for (const m of messages) {
            try { remember(m); } catch (err) {
                console.error('[vv-store]', err?.message || err);
            }
        }
    });
}