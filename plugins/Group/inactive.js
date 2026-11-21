import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getGroupActivity } from '../../handlers/activity.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'inactive',
    description: 'List inactive members for a specific number of days',
    category: 'Group',
    ownerOnly: false,
    usage: 'inactive <days>',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return ctx.reply('❌ Group only.');
        
        const metadata = await getGroupMetadata(sock, jid);
        if (!(await isSenderAdmin(sock, jid, m.key.participant, metadata))) return ctx.reply('❌ Admin only.');

        const days = parseInt(args[0]);
        if (isNaN(days) || days < 1) return ctx.reply(`📅 *Inactive*\n\nUsage: \`${getPrefix()}inactive 7\` (shows members inactive for 7 days)`);

        const activity = getGroupActivity(jid);
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const participants = metadata.participants || [];
        
        let inactiveList = [];

        for (const p of participants) {
            const userActivity = activity[p.id];
            // If they have never spoken, or last spoke before the cutoff
            if (!userActivity || userActivity.lastSeen < cutoff) {
                inactiveList.push(p);
            }
        }

        if (inactiveList.length === 0) return ctx.reply(`✅ No members have been inactive for ${days} days.`);

        let text = `📅 *Inactive for ${days} days (${inactiveList.length})*\n\n`;
        const mentions = [];
        
        inactiveList.slice(0, 50).forEach((p, i) => {
            const name = p.notify || p.name || p.id.split('@')[0];
            text += `${i + 1}. @${name}\n`;
            mentions.push(p.id);
        });

        await sock.sendMessage(jid, { text, mentions }, { quoted: m });
    }
};