// Store online users in memory
export const onlineUsers = new Map();

export default function(sock) {
    sock.ev.on('presence.update', (update) => {
        const { id, presences } = update;
        for (const [participant, data] of Object.entries(presences)) {
            if (data.lastKnownPresence === 'available' || data.lastKnownPresence === 'composing' || data.lastKnownPresence === 'recording') {
                onlineUsers.set(`${id}:${participant}`, Date.now());
            } else {
                onlineUsers.delete(`${id}:${participant}`);
            }
        }
    });
}