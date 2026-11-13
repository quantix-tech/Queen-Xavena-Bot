import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';
import { addWarn, resetWarns } from '../warns.js';

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'slut', 'whore', 'mumu', 'werey', 'ode', 'oloshi', 'olodo', 'yeye', 'ewu', 'ashawo'];

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;

        const mode = getGroupFeature(m.key.remoteJid, 'antibadword');
        if (!mode || mode === 'off') return;

        const text = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '').toLowerCase();
        const hasBadWord = BAD_WORDS.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
        if (!hasBadWord) return;

        try {
            const isBot = await isBotAdmin(sock, m.key.remoteJid);
            if (!isBot) return;

            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
            if (isAdmin) return;

            await sock.sendMessage(m.key.remoteJid, {
                delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            });

            if (mode === 'warn') {
                const warns = addWarn(m.key.remoteJid, m.key.participant);
                if (warns >= 3) {
                    await sock.sendMessage(m.key.remoteJid, { text: `🚫 @${m.key.participant.split('@')[0]} has been removed (3/3 warnings for bad words).`, mentions: [m.key.participant] });
                    await sock.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove');
                    resetWarns(m.key.remoteJid, m.key.participant);
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: `⚠️ *Anti-Badword Warning*\n@${m.key.participant.split('@')[0]} watch your language (${warns}/3).`, mentions: [m.key.participant] });
                }
            } else if (mode === 'kick') {
                await sock.sendMessage(m.key.remoteJid, { text: `🚫 @${m.key.participant.split('@')[0]} has been removed for using profanity.`, mentions: [m.key.participant] });
                await sock.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove');
            }
        } catch (err) { console.error('Antibadword error:', err); }
    });
}