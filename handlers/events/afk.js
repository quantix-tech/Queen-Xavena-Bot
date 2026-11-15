import { getAFK, removeAFK, formatDuration } from '../afk.js';
import { getRealJid } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || m.key.remoteJid === 'status@broadcast' || m.key.remoteJid.endsWith('@broadcast')) return;
        if (m.key.fromMe) return;

        const sender = await getRealJid(m.key.participant || m.key.remoteJid, sock);
        const chatId = m.key.remoteJid;

        // 1. Check if the SENDER is AFK (If they talk, remove AFK)
        const senderAFK = getAFK(sender);
        if (senderAFK) {
            removeAFK(sender);
            const duration = formatDuration(Date.now() - senderAFK.timestamp);
            await sock.sendMessage(chatId, {
                text: `👋 *Welcome Back!*\n\n@${sender} is no longer AFK.\n*You were away for:* ${duration}`,
                mentions: [m.key.participant || m.key.remoteJid]
            }, { quoted: m });
            return; // Stop processing so we don't trigger the AFK warning below
        }

        // 2. Check if someone MENTIONED or REPLIED to an AFK user
        let targetId = null;

        // Check mentions
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length > 0) {
            targetId = mentions[0];
        } 
        // Check if they replied to someone
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            targetId = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (targetId) {
            const targetRealJid = await getRealJid(targetId, sock);
            const targetAFK = getAFK(targetRealJid);

            if (targetAFK) {
                const duration = formatDuration(Date.now() - targetAFK.timestamp);
                await sock.sendMessage(chatId, {
                    text: `💤 *AFK Notice*\n\n@${targetRealJid} is currently AFK.\n*Reason:* ${targetAFK.reason}\n*Time Away:* ${duration}`,
                    mentions: [targetId]
                }, { quoted: m });
            }
        }
    });
}