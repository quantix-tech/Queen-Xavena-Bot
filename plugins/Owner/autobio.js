import { getGlobalFeature, setGlobalFeature } from '../../handlers/features.js';

export default {
    command: 'autobio',
    description: 'Automatically update the bot bio',
    category: 'Owner',
    ownerOnly: true,
    usage: '.autobio <on/off>',

    async execute(sock, m, args, ctx) {
        const action = args[0]?.toLowerCase();
        if (action === 'on') {
            setGlobalFeature('autobio', true);
            return ctx.reply('✅ *Auto-Bio Enabled*');
        }
        if (action === 'off') {
            setGlobalFeature('autobio', false);
            return ctx.reply('❌ *Auto-Bio Disabled*');
        }
        const status = getGlobalFeature('autobio');
        ctx.reply(`*Auto-Bio*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: .autobio on/off`);
    }
};