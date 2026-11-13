import { getGlobalFeature, setGlobalFeature } from '../../handlers/features.js';

export default {
    command: 'autotyping',
    description: 'Show typing presence when reading messages',
    category: 'Owner',
    ownerOnly: true,
    usage: '.autotyping <on/off>',

    async execute(sock, m, args, ctx) {
        const action = args[0]?.toLowerCase();
        if (action === 'on') {
            setGlobalFeature('autotyping', true);
            return ctx.reply('✅ *Auto-Typing Enabled*');
        }
        if (action === 'off') {
            setGlobalFeature('autotyping', false);
            return ctx.reply('❌ *Auto-Typing Disabled*');
        }
        const status = getGlobalFeature('autotyping');
        ctx.reply(`*Auto-Typing*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: .autotyping on/off`);
    }
};