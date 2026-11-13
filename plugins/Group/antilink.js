import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

export default {
    command: 'antilink',
    description: 'Block links in the group (warn, kick, or delete)',
    category: 'Group',
    ownerOnly: false,
    usage: 'antilink <warn/kick/off>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            
            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const action = args[0]?.toLowerCase();
            const currentMode = getGroupFeature(m.key.remoteJid, 'antilink') || 'off';

            if (!action) {
                return ctx.reply(`🔗 *Anti-Link*\n\n*Status:* ${currentMode.toUpperCase()}\n\n*Usage:*\n.antilink warn\n.antilink kick\n.antilink off`);
            }

            if (['warn', 'kick', 'off'].includes(action)) {
                setGroupFeature(m.key.remoteJid, 'antilink', action);
                await ctx.reply(`✅ *Anti-Link Updated*\n\nMode set to: *${action.toUpperCase()}*`);
            } else {
                await ctx.reply('❌ Invalid option. Use: warn, kick, or off.');
            }
        } catch (err) {
            console.error('Antilink error:', err);
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};