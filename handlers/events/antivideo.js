import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;
        if (!getGroupFeature(m.key.remoteJid, 'antivideo')) return;

        // Check if the message type is a video
        const msgType = Object.keys(m.message)[0];
        if (msgType !== 'videoMessage') return;

        try {
            const isBot = await isBotAdmin(sock, m.key.remoteJid);
            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
            
            if (!isBot || isAdmin) return; // Bot must be admin, admins are exempt

            await sock.sendMessage(m.key.remoteJid, {
                delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            });

            await sock.sendMessage(m.key.remoteJid, {
                text: `🚫 *Anti-Video*\n@${m.key.participant.split('@')[0]}, videos are not allowed here.`,
                mentions: [m.key.participant]
            });
        } catch (err) {
            console.error('AntiVideo error:', err);
        }
    });
}