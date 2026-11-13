import { getWelcomeConfig } from '../welcome.js';

export default function(sock) {
    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        if (action !== 'add' && action !== 'remove') return;

        const config = getWelcomeConfig(id);

        try {
            const metadata = await sock.groupMetadata(id);

            for (let jid of participants) {
                // Fix: Ensure jid is a string (sometimes Baileys returns an object)
                if (typeof jid !== 'string') {
                    jid = jid.id || jid.jid || String(jid);
                }
                if (!jid || typeof jid !== 'string') continue;

                const participant = metadata.participants.find(p => p.id === jid);
                // Get push name (fallback to phone number)
                const displayName = participant?.notify || participant?.name || jid.split('@')[0];

                const replacements = {
                    '{mention}': `@${displayName}`,
                    '{group}': metadata.subject,
                    '{count}': metadata.participants.length
                };

                if (action === 'add' && config.welcome.enabled) {
                    let text = config.welcome.text;
                    for (const [key, val] of Object.entries(replacements)) {
                        text = text.split(key).join(val);
                    }

                    let ppUrl;
                    try {
                        ppUrl = await sock.profilePictureUrl(jid, 'image');
                    } catch (err) {
                        ppUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
                    }

                    await sock.sendMessage(id, { 
                        image: { url: ppUrl }, 
                        caption: text, 
                        mentions: [jid] 
                    });
                }

                if (action === 'remove' && config.goodbye.enabled) {
                    let text = config.goodbye.text;
                    for (const [key, val] of Object.entries(replacements)) {
                        text = text.split(key).join(val);
                    }
                    
                    await sock.sendMessage(id, { text, mentions: [jid] });
                }
            }
        } catch (err) {
            console.error('Group update error:', err);
        }
    });
}