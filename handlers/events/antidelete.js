import { getAntidelete } from '../../lib/config.js';
import { getFromCache, removeFromCache } from '../cache.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message) return;

        // 0 is the code for REVOKE (message deleted)
        const protocol = m.message.protocolMessage;
        if (!protocol || protocol.type !== 0) return;

        if (!getAntidelete()) return;

        const deletedId = protocol.key.id;
        const originalMsg = getFromCache(deletedId);

        if (originalMsg) {
            try {
                // 👇 Get the bot's own JID (the person who paired it)
                const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'; 
                
                // Extract who sent it and where
                const sender = originalMsg.pushName || originalMsg.key.participant || originalMsg.key.remoteJid;
                const chat = originalMsg.key.remoteJid.endsWith('@g.us') 
                    ? 'Group Chat' 
                    : 'Private DM';

                // Don't forward if the deleted message was in the bot's own DM 
                // (to prevent sending it to the same place it was deleted)
                if (originalMsg.key.remoteJid === botJid) {
                    return; 
                }

                const headerText = `🚫 *Antidelete Detected*\n\n👤 *Sender:* ${sender.split('@')[0]}\n💬 *Chat:* ${chat}`;
                
                // Send the header to the bot's own DM
                await sock.sendMessage(botJid, { text: headerText });

                // Forward the actual deleted message to the bot's own DM
                await sock.sendMessage(botJid, { 
                    forward: originalMsg, 
                    forceForward: true 
                });

                removeFromCache(deletedId);
            } catch (err) {
                console.error('[antidelete] Error forwarding message:', err.message);
            }
        }
    });
}