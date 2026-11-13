import { getGlobalFeature } from '../features.js';

export default function(sock) {
    setInterval(async () => {
        if (!getGlobalFeature('autobio')) return;

        try {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const mins = Math.floor((uptime % 3600) / 60);
            
            const status = `Online for ${hours}h ${mins}m | Queen Xavena`;
            await sock.updateProfileStatus(status);
        } catch (err) {}
    }, 10 * 60 * 1000); // Runs every 10 minutes
        }
