import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

export default {
    command: 'antigcstatus',
    description: 'Delete group status updates automatically',
    category: 'Group',
    ownerOnly: false,
    usage: 'antigcstatus <on/off>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ Group only.');
        
        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const isSender = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            
            if (!isSender) {
                return ctx.reply('❌ Admins only.');
            }

            const action = args[0]?.toLowerCase();
            if (action === 'on') {
                setGroupFeature(m.key.remoteJid, 'antigcstatus', true);
                await ctx.reply('✅ *Anti-GC Status Enabled*');
            } else if (action === 'off') {
                setGroupFeature(m.key.remoteJid, 'antigcstatus', false);
                await ctx.reply('❌ *Anti-GC Status Disabled*');
            } else {
                const status = getGroupFeature(m.key.remoteJid, 'antigcstatus');
                ctx.reply(`*Anti-GC Status*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: .antigcstatus on/off`);
            }
        } catch (err) {
            console.error('Antigcstatus error:', err);
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};