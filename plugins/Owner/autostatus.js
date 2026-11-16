import { getPrefix } from '../../lib/config.js';
import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';

export default {
    command: 'autostatus',
    description: 'Toggle auto view and like for contact statuses',
    category: 'Owner',
    ownerOnly: true,
    usage: 'autostatus <on/off>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();

        // We use 'global' to store this setting for the whole bot
        if (action === 'on') {
            setGroupFeature('global', 'autostatusview', true);
            setGroupFeature('global', 'autostatuslike', true);
            return ctx.reply('👁️ *AutoStatus Enabled*\n\nI will now automatically view and react to all new status updates from your contacts.');
        }
        if (action === 'off') {
            setGroupFeature('global', 'autostatusview', false);
            setGroupFeature('global', 'autostatuslike', false);
            return ctx.reply('❌ *AutoStatus Disabled*');
        }

        const viewStatus = getGroupFeature('global', 'autostatusview') ? '✅ ON' : '❌ OFF';
        const likeStatus = getGroupFeature('global', 'autostatuslike') ? '✅ ON' : '❌ OFF';

        return ctx.reply(`👁️ *AutoStatus Settings*\n\n*View:* ${viewStatus}\n*Like:* ${likeStatus}\n\n*Usage:*\n\`${prefix}autostatus on\`\n\`${prefix}autostatus off\``);
    }
};