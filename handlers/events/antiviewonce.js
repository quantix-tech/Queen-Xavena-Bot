import { getGroupFeature } from '../features.js';
import { downloadMediaMessage } from '@itsliaaa/baileys';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message || m.key.fromMe) return;

        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const featureKey = isGroup ? 'antiviewonce' : 'antiviewonce_dm';
        
        if (!getGroupFeature(jid, featureKey)) return;

        // Detect ViewOnce wrappers
        const isViewOnce = m.message.viewOnceMessage || m.message.viewOnceMessageV2 || m.message.viewOnceMessageV2Extension;
        if (!isViewOnce) return;

        console.log(`[antiviewonce] Detected ViewOnce message from ${m.pushName || jid}`);

        try {
            // 👇 Pass the ENTIRE message object (m) to downloadMediaMessage so it can decrypt properly
            const buffer = await downloadMediaMessage(m, 'buffer', {}, { logger: console });
            
            if (!buffer || buffer.length < 100) throw new Error('Empty buffer');

            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const senderName = m.pushName || jid.split('@')[0];
            
            // Determine mimetype from the inner message
            const innerMsg = m.message.viewOnceMessage?.message || m.message.viewOnceMessageV2?.message || m.message.viewOnceMessageV2Extension?.message;
            const msgType = Object.keys(innerMsg)[0];
            
            let caption = `👁️ *ViewOnce Caught*\n\n👤 *From:* ${senderName}\n💬 *Chat:* ${isGroup ? 'Group' : 'DM'}`;
            if (jid.endsWith('@g.us')) caption += `\n📍 *Group:* ${jid.split('@')[0]}`;

            if (msgType === 'imageMessage') {
                await sock.sendMessage(botJid, { image: buffer, caption });
            } else if (msgType === 'videoMessage') {
                await sock.sendMessage(botJid, { video: buffer, caption });
            } else if (msgType === 'audioMessage') {
                await sock.sendMessage(botJid, { audio: buffer, mimetype: 'audio/mp4', ptt: true });
            }

            console.log(`[antiviewonce] Successfully forwarded to bot DM`);

        } catch (e) {
            console.error('[antiviewonce] Failed to decrypt or send:', e.message);
        }
    });
}