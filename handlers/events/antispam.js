import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';
import { addWarn, resetWarns } from '../warns.js';

const spamCache = new Map();

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || !m.key.remoteJid.endsWith('@g.us') || m.key.fromMe) return;

        const mode = getGroupFeature(m.key.remoteJid, 'antispam');
        if (!mode || mode === 'off') return;

        try {
            const isBot = await isBotAdmin(sock, m.key.remoteJid);
            if (!isBot) return;

            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant);
            if (isAdmin) return;

            const groupCache = spamCache.get(m.key.remoteJid) || new Map();
            const userTimestamps = groupCache.get(m.key.participant) || [];
            const now = Date.now();

            const recentTimestamps = userTimestamps.filter(ts => now - ts < 3000);
            recentTimestamps.push(now);
            groupCache.set(m.key.participant, recentTimestamps);
            spamCache.set(m.key.remoteJid, groupCache);

            if (recentTimestamps.length >= 5) {
                groupCache.delete(m.key.participant);

                await sock.sendMessage(m.key.remoteJid, {
                    delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
                });

                if (mode === 'warn') {
                    const warns = addWarn(m.key.remoteJid, m.key.participant);
                    if (warns >= 3) {
                        await sock.sendMessage(m.key.remoteJid, { text: `🚫 @${m.key.participant.split('@')[0]} has been removed (3/3 warnings for spamming).`, mentions: [m.key.participant] });
                        await sock.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove');
                        resetWarns(m.key.remoteJid, m.key.participant);
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { text: `⚠️ *Anti-Spam Warning*\n@${m.key.participant.split('@')[0]} please slow down (${warns}/3).`, mentions: [m.key.participant] });
                    }
                } else if (mode === 'kick') {
                    await sock.sendMessage(m.key.remoteJid, { text: `🚫 @${m.key.participant.split('@')[0]} has been removed for spamming.`, mentions: [m.key.participant] });
                    await sock.groupParticipantsUpdate(m.key.remoteJid, [m.key.participant], 'remove');
                }
            }
        } catch (err) { console.error('Antispam error:', err); }
    });
}