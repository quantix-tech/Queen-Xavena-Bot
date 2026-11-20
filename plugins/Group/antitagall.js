import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'antitagall',
    description: 'Block mass mentions (tagall) in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'antitagall <on/off>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const isAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            if (!isAdmin) return ctx.reply('❌ Only group admins can use this.');

            const action = args[0]?.toLowerCase();
            const current = getGroupFeature(m.key.remoteJid, 'antitagall') || false;

            if (action === 'on') {
                setGroupFeature(m.key.remoteJid, 'antitagall', true);
                return ctx.reply('✅ *Anti-TagAll Enabled*');
            }
            if (action === 'off') {
                setGroupFeature(m.key.remoteJid, 'antitagall', false);
                return ctx.reply('❌ *Anti-TagAll Disabled*');
            }
            return ctx.reply(`🛡️ *Anti-TagAll*\n*Status:* ${current ? 'ON' : 'OFF'}\n*Usage:* \`${getPrefix()}antitagall on\``);
        } catch (err) { return ctx.reply(`❌ Error: ${err.message}`); }
    }
};