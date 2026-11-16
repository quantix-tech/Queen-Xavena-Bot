import { getGroupFeature } from '../features.js';

export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message) return;

        // Only trigger for contact statuses
        if (m.key.remoteJid !== 'status@broadcast') return;
        if (m.key.fromMe) return; // Don't view/react to our own status

        // 1. Auto View
        if (getGroupFeature('global', 'autostatusview')) {
            try {
                await sock.readMessages([m.key]);
            } catch (e) {
                console.error('AutoStatusView error:', e.message);
            }
        }

        // 2. Auto Like (React)
        if (getGroupFeature('global', 'autostatuslike')) {
            try {
                // 👇 Expanded emoji list for better variety 👇
                const emojis = [
                    // Love & Affection
                    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', 
                    '💖', '💗', '💓', '💞', '💕', '💘', '💝', '💟', '♥️', '🫶', '💋', '😍', '🥰', '😘', '😻',
                    // Hype & Fire
                    '🔥', '💯', '🚀', '⚡', '✨', '🌟', '💥', '👑', '🏆', '🥇', '🎉', '🎊',
                    // Funny & Laughing
                    '😂', '🤣', '😆', '😅', '😁', '😄', '😃', '😀', '🤭', '🤡',
                    // Shock & Surprise
                    '😱', '😲', '🤯', '😮', '😯', '😳', '🤩',
                    // Sad & Empathy
                    '😢', '😭', '🥺', '😔', '😞', '💔',
                    // Respect & Cool
                    '😎', '🫡', '🎯', '🙌', '👏', '🙏', '💪', '🤝'
                ];
                
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                
                await sock.sendMessage('status@broadcast', {
                    react: { text: randomEmoji, key: m.key }
                }, {
                    statusJidList: [m.key.participant] // Targets the status sender
                });
            } catch (e) {
                console.error('AutoStatusLike error:', e.message);
            }
        }
    });
}