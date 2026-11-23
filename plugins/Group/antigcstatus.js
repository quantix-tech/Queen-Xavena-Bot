import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'antigcstatus',
    description: 'Delete or kick users posting group statuses',
    category: 'Group',
    ownerOnly: false,
    usage: 'antigcstatus <off|delete|kick>',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        const prefix = getPrefix();

        if (!jid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        const metadata = await getGroupMetadata(sock, jid);
        if (!(await isSenderAdmin(sock, jid, m.key.participant, metadata))) {
            return ctx.reply('❌ Admin only.');
        }

        const action = args[0]?.toLowerCase();
        const current = getGroupFeature(jid, 'antigcstatus') || 'off';

        if (!action) {
            return ctx.reply(
                `📵 *Anti-GC Status*\n\n` +
                `*Current:* ${current.toUpperCase()}\n\n` +
                `*Usage:*\n` +
                `\`${prefix}antigcstatus off\` — disabled\n` +
                `\`${prefix}antigcstatus delete\` — delete status messages\n` +
                `\`${prefix}antigcstatus kick\` — delete + kick the sender`
            );
        }

        if (action === 'off') {
            setGroupFeature(jid, 'antigcstatus', 'off');
            return ctx.reply('❌ *Anti-GC Status Disabled*\n\nGroup statuses are now allowed.');
        }

        if (action === 'delete') {
            setGroupFeature(jid, 'antigcstatus', 'delete');
            return ctx.reply('🗑️ *Anti-GC Status: DELETE*\n\nGroup statuses will be deleted automatically.');
        }

        if (action === 'kick') {
            setGroupFeature(jid, 'antigcstatus', 'kick');
            return ctx.reply('🚫 *Anti-GC Status: KICK*\n\nGroup statuses will be deleted and the sender removed.');
        }

        return ctx.reply(`❌ Invalid option. Use \`${prefix}antigcstatus off|delete|kick\``);
    }
};