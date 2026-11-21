import { getGroupMetadata, extractRawId } from '../../lib/utils.js';
import { getGroupActivity } from '../../handlers/activity.js';

export default {
    command: 'membercount',
    aliases: ['msgcount', 'topactive'],
    description: 'Group statistics',
    category: 'Group',
    ownerOnly: false,
    usage: 'membercount / msgcount / topactive',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return ctx.reply('❌ Group only.');
        
        const command = ctx.text.slice(1).trim().split(/\s+/)[0].toLowerCase();
        const metadata = await getGroupMetadata(sock, jid);
        const participants = metadata.participants || [];
        const activity = getGroupActivity(jid);

        // ─── MEMBER COUNT ───
        if (command === 'membercount') {
            const total = participants.length;
            const admins = participants.filter(p => p.admin).length;
            return ctx.reply(`👥 *Group Members*\n\n*Total:* ${total}\n*Admins:* ${admins}\n*Members:* ${total - admins}`);
        }

        // ─── MESSAGE COUNT (Total group activity) ───
        if (command === 'msgcount') {
            let totalMsgs = 0;
            for (const userId in activity) {
                totalMsgs += activity[userId].count || 0;
            }
            return ctx.reply(`💬 *Total Messages Tracked*\n\n*Group:* ${metadata.subject}\n*Messages:* ${totalMsgs}`);
        }

        // ─── TOP ACTIVE (Leaderboard) ───
        if (command === 'topactive') {
            const sorted = Object.entries(activity)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 10);

            if (sorted.length === 0) return ctx.reply('📊 No messages tracked yet.');

            let text = `🏆 *Top Active Members*\n\n`;
            const mentions = [];

            for (let i = 0; i < sorted.length; i++) {
                const [userId, data] = sorted[i];
                const p = participants.find(x => x.id === userId);
                const name = p?.notify || p?.name || userId.split('@')[0];
                
                text += `${i + 1}. @${name} — *${data.count}* msgs\n`;
                mentions.push(userId);
            }

            return sock.sendMessage(jid, { text, mentions }, { quoted: m });
        }
    }
};