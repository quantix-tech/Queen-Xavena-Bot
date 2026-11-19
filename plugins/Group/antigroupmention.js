import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'antigroupmention',
    description: 'Block status updates that mention the whole group',
    category: 'Group',
    ownerOnly: false,
    usage: 'antigroupmention <on/off>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const senderIsAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            if (!senderIsAdmin) return ctx.reply('❌ Only group admins can use this.');

            const action = args[0]?.toLowerCase();
            const currentStatus = getGroupFeature(m.key.remoteJid, 'antigroupmention') || false;

            if (action === 'on') {
                setGroupFeature(m.key.remoteJid, 'antigroupmention', true);
                return ctx.reply('✅ *Anti-Group Mention Enabled*\n\nStatuses that mention the whole group will be deleted.');
            }
            if (action === 'off') {
                setGroupFeature(m.key.remoteJid, 'antigroupmention', false);
                return ctx.reply('❌ *Anti-Group Mention Disabled*');
            }

            return ctx.reply(`🛡️ *Anti-Group Mention*\n\n*Status:* ${currentStatus ? '✅ ON' : '❌ OFF'}\n*Usage:* \`.antigroupmention on\``);
        } catch (err) {
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};