import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'antivideo', description: 'Block video messages', category: 'Group', ownerOnly: false, usage: 'antivideo <on/off>',
    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ Group only.');
        const metadata = await getGroupMetadata(sock, m.key.remoteJid);
        if (!(await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata))) return ctx.reply('❌ Admin only.');
        
        const action = args[0]?.toLowerCase();
        if (action === 'on') { setGroupFeature(m.key.remoteJid, 'antivideo', true); return ctx.reply('✅ *Anti-Video Enabled*'); }
        if (action === 'off') { setGroupFeature(m.key.remoteJid, 'antivideo', false); return ctx.reply('❌ *Anti-Video Disabled*'); }
        const status = getGroupFeature(m.key.remoteJid, 'antivideo');
        return ctx.reply(`🛡️ *Anti-Video*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: \`${getPrefix()}antivideo on\``);
    }
};