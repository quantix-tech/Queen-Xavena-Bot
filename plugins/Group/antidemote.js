import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'antidemote', description: 'Block users from demoting admins', category: 'Group', ownerOnly: false, usage: 'antidemote <on/off>',
    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ Group only.');
        const metadata = await getGroupMetadata(sock, m.key.remoteJid);
        if (!(await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata))) return ctx.reply('❌ Admin only.');
        
        const action = args[0]?.toLowerCase();
        if (action === 'on') { setGroupFeature(m.key.remoteJid, 'antidemote', true); return ctx.reply('✅ *Anti-Demote Enabled*'); }
        if (action === 'off') { setGroupFeature(m.key.remoteJid, 'antidemote', false); return ctx.reply('❌ *Anti-Demote Disabled*'); }
        const status = getGroupFeature(m.key.remoteJid, 'antidemote');
        return ctx.reply(`🛡️ *Anti-Demote*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: \`${getPrefix()}antidemote on\``);
    }
};