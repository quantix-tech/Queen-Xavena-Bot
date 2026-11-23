import { getGroupActivity } from '../../handlers/activity.js';
import { getPrefix } from '../../lib/config.js';
import moment from 'moment-timezone';

export default {
    command: 'top',
    aliases: ['topchats', 'leaderboard'],
    description: 'Show the most active members in this group',
    category: 'Group',
    ownerOnly: false,
    usage: 'top',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        const activity = getGroupActivity(jid);
        const userIds = Object.keys(activity);

        if (userIds.length === 0) {
            return ctx.reply('📭 *No Activity Yet*\n\nThere are no messages recorded for this group.');
        }

        // Calculate total messages
        let totalMsgs = 0;
        for (const id of userIds) {
            totalMsgs += activity[id].count;
        }

        // Sort users by message count (highest first)
        const sorted = Object.entries(activity)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10); // Top 10

        let text = `🏆 *Top Active Members*\n`;
        text += `💬 *Total Messages:* ${totalMsgs}\n\n`;

        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        sorted.forEach(([userId, data], index) => {
            const mention = `@${userId.split('@')[0].split(':')[0]}`;
            
            // Format the "last seen" time
            let timeAgo = 'Unknown';
            if (data.lastSeen) {
                timeAgo = moment(data.lastSeen).fromNow();
            }

            text += `${medals[index]} ${mention} — *${data.count}* msgs\n`;
            text += `   └ _Last seen: ${timeAgo}_\n`;
        });

        text += `\n_Use ${getPrefix()}top to refresh_`;

        // Send with mentions so WhatsApp tags the users
        const mentions = sorted.map(([userId]) => userId);

        await sock.sendMessage(jid, { text, mentions }, { quoted: m });
    }
};