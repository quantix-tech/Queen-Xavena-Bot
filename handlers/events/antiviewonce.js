import { getGroupFeature } from '../features.js';
import { getRealJid } from '../../lib/utils.js';
import axios from 'axios';

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

        // We need to get the actual media inside the viewOnce wrapper
        const innerMsg = isViewOnce.message;
        if (!innerMsg) return;

        try {
            // Download media using Baileys (we can't use ctx.getMedia because this is a raw event)
            const { downloadMediaMessage } = await import('@itsliaaa/baileys');
            const buffer = await downloadMediaMessage({ message: innerMsg, key: m.key }, 'buffer', {}, { logger: console });
            
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const senderName = m.pushName || 'User';
            
            await sock.sendMessage(botJid, {
                image: buffer, 
                caption: `👁️ *ViewOnce Caught*\nFrom: ${senderName}\nChat: ${isGroup ? 'Group' : 'DM'}`
            });

        } catch (e) {
            console.error('AntiViewOnce error:', e);
        }
    });
}