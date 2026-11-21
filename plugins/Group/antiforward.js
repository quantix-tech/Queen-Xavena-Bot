import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'antiforward', description: 'Block forwarded messages', category: 'Group', ownerOnly: false, usage: 'antiforward <on/off>',
    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ Group only.');
        const metadata = await getGroupMetadata(sock, m.key.remoteJid);
        if (!(await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata))) return ctx.reply('❌ Admin only.');
        
        const action = args[0]?.toLowerCase();
        if (action === 'on') { setGroupFeature(m.key.remoteJid, 'antiforward', true); return ctx.reply('✅ *Anti-Forward Enabled*'); }
        if (action === 'off') { setGroupFeature(m.key.remoteJid, 'antiforward', false); return ctx.reply('❌ *Anti-Forward Disabled*'); }
        const status = getGroupFeature(m.key.remoteJid, 'antiforward');
        return ctx.reply(`🛡️ *Anti-Forward*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: \`${getPrefix()}antiforward on\``);
    }
};