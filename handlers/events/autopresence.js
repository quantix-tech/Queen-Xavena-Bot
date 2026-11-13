import { getGlobalFeature } from '../features.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || m.key.fromMe) return;

        if (getGlobalFeature('autotyping')) {
            await sock.sendPresenceUpdate('composing', m.key.remoteJid);
        }

        if (getGlobalFeature('autorecording')) {
            await sock.sendPresenceUpdate('recording', m.key.remoteJid);
        }
    });
}