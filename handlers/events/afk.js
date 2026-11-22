import { getAFK, removeAFK, formatDuration } from '../afk.js';
import { getRealJid } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        
        if (!m?.message) return;
        if (m.key.remoteJid === 'status@broadcast' || m.key.remoteJid.endsWith('@broadcast')) return;

        // 👇 ANTI-SPAM FIX: Allow fromMe, but block if it's a message the bot just sent 👇
        if (m.key.fromMe) {
            // We check this via the global sentMessageIds set
            // If it's in the set, the bot sent it. Ignore it to prevent loops.
            // Note: We have to access the global set from index.js, or import it if we exported it.
            // Easiest way: check if the message is a reply to a mention, but simpler is checking the ID if we export it.
            
            // Since we didn't export sentMessageIds, we'll use a simpler heuristic:
            // If the text contains "Welcome Back!" or "AFK Notice", it's a bot message.
            const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            if (text.includes('Welcome Back!') || text.includes('AFK Notice')) {
                return; 
            }
        }

        const sender = await getRealJid(m.key.participant || m.key.remoteJid, sock);
        const chatId = m.key.remoteJid;

        // ─── 1. CHECK IF SENDER IS AFK ───
        const senderAFK = getAFK(sender);
        if (senderAFK) {
            removeAFK(sender);
            const duration = formatDuration(Date.now() - senderAFK.timestamp);
            
            await sock.sendMessage(chatId, {
                text: `👋 *Welcome Back!*\n\n@${sender} is no longer AFK.\n*You were away for:* ${duration}`,
                mentions: [m.key.participant || m.key.remoteJid]
            }, { quoted: m });
            
            return; 
        }

        // ─── 2. CHECK IF SOMEONE MENTIONED/REPLIED TO AN AFK USER ───
        let targetId = null;

        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length > 0) {
            targetId = mentions[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            targetId = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (targetId) {
            const targetRealJid = await getRealJid(targetId, sock);
            
            // Don't trigger AFK if you are tagging yourself
            if (targetRealJid === sender) return;

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