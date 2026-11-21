import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';
import { getGroupActivity } from '../../handlers/activity.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'kickinactive',
    description: 'Kick members inactive for a specific number of days',
    category: 'Group',
    ownerOnly: false,
    usage: 'kickinactive <days> OR kickinactive all',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return ctx.reply('❌ Group only.');
        
        const metadata = await getGroupMetadata(sock, jid);
        if (!(await isSenderAdmin(sock, jid, m.key.participant, metadata))) return ctx.reply('❌ Admin only.');
        if (!(await isBotAdmin(sock, jid, metadata))) return ctx.reply('❌ I need admin rights.');

        const input = args[0]?.toLowerCase();
        const activity = getGroupActivity(jid);
        const participants = metadata.participants || [];
        
        let toKick = [];

        if (input === 'all') {
            // Kick everyone with 0 activity
            for (const p of participants) {
                if (!activity[p.id]) toKick.push(p.id);
            }
        } else {
            const days = parseInt(input);
            if (isNaN(days) || days < 1) return ctx.reply(`📅 *Kick Inactive*\n\nUsage: \`${getPrefix()}kickinactive 7\` or \`${getPrefix()}kickinactive all\``);
            
            const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
            for (const p of participants) {
                const userActivity = activity[p.id];
                if (!userActivity || userActivity.lastSeen < cutoff) {
                    toKick.push(p.id);
                }
            }
        }

        if (toKick.length === 0) return ctx.reply(`✅ No inactive members found to kick.`);

        await ctx.reply(`⏳ Kicking ${toKick.length} inactive members...`);
        
        let success = 0;
        for (let i = 0; i < toKick.length; i += 5) {
            try {
                await sock.groupParticipantsUpdate(jid, toKick.slice(i, i + 5), 'remove');
                success += 5;
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s between batches
            } catch (e) {}
        }
        
        await ctx.reply(`✅ *Done*\nSuccessfully kicked ${success} inactive members.`);
    }
};