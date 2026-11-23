import { getGlobalFeature, setGlobalFeature } from '../../handlers/features.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'antiviewonce',
    aliases: ['antivo'],
    description: 'Automatically save view-once messages to bot DM (global)',
    category: 'Owner',
    ownerOnly: true,
    get usage() {
        return `${getPrefix()}antiviewonce <on/off>`;
    },

    async execute(sock, m, args, ctx) {
        const action = args[0]?.toLowerCase();
        const prefix = getPrefix();

        if (action === 'on') {
            setGlobalFeature('antiviewonce', true);
            return ctx.reply('✅ *Anti-ViewOnce Enabled*\n\nAll view-once media (DMs + groups) will now be saved to the bot\'s DM.');
        }

        if (action === 'off') {
            setGlobalFeature('antiviewonce', false);
            return ctx.reply('❌ *Anti-ViewOnce Disabled*');
        }

        const status = getGlobalFeature('antiviewonce');
        return ctx.reply(`👁️ *Anti-ViewOnce*\n\nStatus: ${status ? '✅ ON' : '❌ OFF'}\nUsage: \`${prefix}antiviewonce on\` / \`${prefix}antiviewonce off\``);
    }
};