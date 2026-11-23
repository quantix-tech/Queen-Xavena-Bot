import { getGroupActivity, getTotalMessages } from '../../handlers/activity.js';
import { getPrefix } from '../../lib/config.js';

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
        const totalMsgs = getTotalMessages(jid);

        if (totalMsgs === 0) {
            return ctx.reply('📭 *No Activity Yet*\n\nThere are no messages recorded for this group.');
        }

        // Sort users by message count (highest first)
        const sorted = Object.entries(activity)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10); // Top 10

        let text = `🏆 *Top Active Members*\n`;
        text += `💬 *Total Messages:* ${totalMsgs}\n\n`;

        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        sorted.forEach(([userId, count], index) => {
            const mention = `@${userId.split('@')[0].split(':')[0]}`;
            text += `${medals[index]} ${mention} — *${count}* msgs\n`;
        });

        text += `\n_Use ${getPrefix()}top to refresh_`;

        // Send with mentions so WhatsApp tags the users
        const mentions = sorted.map(([userId]) => userId);

        await sock.sendMessage(jid, { text, mentions }, { quoted: m });
    }
};