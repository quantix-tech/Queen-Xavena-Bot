import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

export default {
    command: 'antibadword',
    description: 'Block bad words in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'antibadword <warn/kick/off>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            
            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const action = args[0]?.toLowerCase();
            const currentMode = getGroupFeature(m.key.remoteJid, 'antibadword') || 'off';

            if (!action) {
                return ctx.reply(`🤬 *Anti-Badword*\n\n*Status:* ${currentMode.toUpperCase()}\n\n*Usage:*\n.antibadword warn\n.antibadword kick\n.antibadword off`);
            }

            if (['warn', 'kick', 'off'].includes(action)) {
                setGroupFeature(m.key.remoteJid, 'antibadword', action);
                await ctx.reply(`✅ *Anti-Badword Updated*\n\nMode set to: *${action.toUpperCase()}*`);
            } else {
                await ctx.reply('❌ Invalid option. Use: warn, kick, or off.');
            }
        } catch (err) {
            console.error('Antibadword error:', err);
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};