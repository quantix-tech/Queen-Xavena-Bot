import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'antiviewonce',
    aliases: ['antivo'],
    description: 'Automatically save view-once messages to bot DM',
    category: 'Group',
    ownerOnly: false,
    usage: 'antiviewonce <on/off>',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        
        // If it's a group, only admins can toggle
        if (isGroup) {
            const metadata = await getGroupMetadata(sock, jid);
            if (!(await isSenderAdmin(sock, jid, m.key.participant, metadata))) return ctx.reply('❌ Admin only.');
        }

        const action = args[0]?.toLowerCase();
        const featureKey = isGroup ? 'antiviewonce' : 'antiviewonce_dm';

        if (action === 'on') { 
            setGroupFeature(jid, featureKey, true); 
            return ctx.reply(`✅ *Anti-ViewOnce Enabled* for this ${isGroup ? 'group' : 'DM'}`); 
        }
        if (action === 'off') { 
            setGroupFeature(jid, featureKey, false); 
            return ctx.reply(`❌ *Anti-ViewOnce Disabled*`); 
        }
        
        const status = getGroupFeature(jid, featureKey);
        return ctx.reply(`👁️ *Anti-ViewOnce*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: \`${getPrefix()}antiviewonce on\``);
    }
};