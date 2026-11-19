import { getGroupFeature, setGroupFeature } from '../../handlers/features.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'stickerreact',
    description: 'Toggle sticker reactions on messages',
    category: 'Owner',
    ownerOnly: true,
    usage: 'stickerreact <on/off/owner/global>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();

        const isEnabled = getGroupFeature('global', 'stickerreact_enabled');
        const currentMode = getGroupFeature('global', 'stickerreact_mode') || 'owner';

        if (action === 'on') {
            setGroupFeature('global', 'stickerreact_enabled', true);
            return ctx.reply(`✅ *StickerReact Enabled*\n\nMode: *${currentMode}*`);
        }
        if (action === 'off') {
            setGroupFeature('global', 'stickerreact_enabled', false);
            return ctx.reply('❌ *StickerReact Disabled*');
        }
        if (action === 'owner') {
            setGroupFeature('global', 'stickerreact_mode', 'owner');
            return ctx.reply('✅ *StickerReact Mode:* Owner only');
        }
        if (action === 'global') {
            setGroupFeature('global', 'stickerreact_mode', 'global');
            return ctx.reply('✅ *StickerReact Mode:* Global (everyone)');
        }

        return ctx.reply(`🎭 *StickerReact Settings*\n\n*Status:* ${isEnabled ? '✅ ON' : '❌ OFF'}\n*Mode:* ${currentMode.toUpperCase()}\n\n*Usage:*\n\`${prefix}stickerreact on\`\n\`${prefix}stickerreact off\`\n\`${prefix}stickerreact owner\`\n\`${prefix}stickerreact global\``);
    }
};