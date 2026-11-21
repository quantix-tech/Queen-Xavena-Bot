import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;
        if (!getGroupFeature(m.key.remoteJid, 'antiforward')) return;

        // Check if the message is forwarded
        const msgType = Object.keys(m.message)[0];
        const contextInfo = m.message[msgType]?.contextInfo;
        const isForwarded = contextInfo?.isForwarded || contextInfo?.forwardingScore > 0;

        if (!isForwarded) return;

        if (await isBotAdmin(sock, m.key.remoteJid) && !(await isSenderAdmin(sock, m.key.remoteJid, m.key.participant))) {
            await sock.sendMessage(m.key.remoteJid, { delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant } });
        }
    });
}