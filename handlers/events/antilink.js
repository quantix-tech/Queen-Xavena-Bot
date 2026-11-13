import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';
import { addWarn, resetWarns } from '../warns.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;

        const mode = getGroupFeature(m.key.remoteJid, 'antilink');
        if (!mode || mode === 'off') return;

        // Check text for links
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|info|io|gov|edu|co|me|ng|xyz)(\/[^\s]*)?)/i;
        if (!linkRegex.test(text)) return;

        try {
            const isBot = await isBotAdmin(sock, m.key.remoteJid);
            if (!isBot) return; // Need admin rights to delete

            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
            if (isAdmin) return; // Admins are exempt

            // Delete the message
            await sock.sendMessage(m.key.remoteJid, {
                delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            });

            if (mode === 'warn') {
                const warns = addWarn(m.key.remoteJid, m.key.participant);
                if (warns >= 3) {
                    await sock.sendMessage(m.key.remoteJid, { text: `🚫 @${m.key.participant.split('@')[0]} has been removed (3/3 warnings for sending links).`, mentions: [m.key.participant] });
                    await sock.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove');
                    resetWarns(m.key.remoteJid, m.key.participant);
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: `⚠️ *Anti-Link Warning*\n@${m.key.participant.split('@')[0]} links are not allowed (${warns}/3).`, mentions: [m.key.participant] });
                }
            } else if (mode === 'kick') {
                await sock.sendMessage(m.key.remoteJid, { text: `🚫 @${m.key.participant.split('@')[0]} has been removed for sending a link.`, mentions: [m.key.participant] });
                await sock.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove');
            }
        } catch (err) { console.error('Antilink error:', err); }
    });
}