import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

export default {
    command: 'antisticker',
    description: 'Delete stickers automatically',
    category: 'Group',
    ownerOnly: false,
    usage: 'antisticker <on/off>',

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
                setGroupFeature(m.key.remoteJid, 'antisticker', true);
                await ctx.reply('✅ *Anti-Sticker Enabled*');
            } else if (action === 'off') {
                setGroupFeature(m.key.remoteJid, 'antisticker', false);
                await ctx.reply('❌ *Anti-Sticker Disabled*');
            } else {
                const status = getGroupFeature(m.key.remoteJid, 'antisticker');
                ctx.reply(`*Anti-Sticker*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: .antisticker on/off`);
            }
        } catch (err) {
            console.error('Antisticker error:', err);
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};