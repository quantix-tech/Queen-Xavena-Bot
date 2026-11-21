import { getGroupFeature } from '../features.js';
import { isBotAdmin, isSenderAdmin, getGroupMetadata } from '../../lib/utils.js';

export default function(sock) {
    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action, author } = update;

        // Only care about promote or demote actions
        if (action !== 'promote' && action !== 'demote') return;

        const jid = id;
        
        // Check which anti-feature is enabled
        const isAntiPromote = getGroupFeature(jid, 'antipromote') && action === 'promote';
        const isAntiDemote = getGroupFeature(jid, 'antidemote') && action === 'demote';

        if (!isAntiPromote && !isAntiDemote) return;

        try {
            const metadata = await getGroupMetadata(sock, jid);
            const isBot = await isBotAdmin(sock, jid, metadata);
            
            if (!isBot) return; // Bot needs admin rights to reverse it

            // Check if the action was done by someone other than the bot itself
            if (author && author !== sock.user.id) {
                // Reverse the action
                const reverseAction = action === 'promote' ? 'demote' : 'promote';
                await sock.groupParticipantsUpdate(jid, participants, reverseAction);
                
                await sock.sendMessage(jid, { 
                    text: `🛡️ *Anti-${action === 'promote' ? 'Promote' : 'Demote'}*\nThe action was reversed by bot protection.` 
                });
            }
        } catch (err) {
            console.error(`Anti-${action} error:`, err);
        }
    });
}