import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

export default {
    command: 'antibot',
    description: 'Block other bots from sending commands in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'antibot <on/off>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            
            if (!isSender) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const action = args[0]?.toLowerCase();
            const currentStatus = getGroupFeature(m.key.remoteJid, 'antibot') || false;

            if (!action) {
                return ctx.reply(`🤖 *Anti-Bot*\n\n*Status:* ${currentStatus ? 'ON' : 'OFF'}\n\n*Usage:*\n.antibot on\n.antibot off`);
            }

            if (action === 'on') {
                setGroupFeature(m.key.remoteJid, 'antibot', true);
                await ctx.reply('✅ *Anti-Bot Enabled*');
            } else if (action === 'off') {
                setGroupFeature(m.key.remoteJid, 'antibot', false);
                await ctx.reply('❌ *Anti-Bot Disabled*');
            } else {
                await ctx.reply('❌ Invalid option. Use: on or off.');
            }
        } catch (err) {
            console.error('Antibot error:', err);
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};