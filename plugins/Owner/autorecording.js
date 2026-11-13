import { getGlobalFeature, setGlobalFeature } from '../../handlers/features.js';

export default {
    command: 'autorecording',
    description: 'Show recording presence when reading messages',
    category: 'Owner',
    ownerOnly: true,
    usage: '.autorecording <on/off>',

    async execute(sock, m, args, ctx) {
        const action = args[0]?.toLowerCase();
        if (action === 'on') {
            setGlobalFeature('autorecording', true);
            return ctx.reply('✅ *Auto-Recording Enabled*');
        }
        if (action === 'off') {
            setGlobalFeature('autorecording', false);
            return ctx.reply('❌ *Auto-Recording Disabled*');
        }
        const status = getGlobalFeature('autorecording');
        ctx.reply(`*Auto-Recording*\nStatus: ${status ? 'ON' : 'OFF'}\nUsage: .autorecording on/off`);
    }
};