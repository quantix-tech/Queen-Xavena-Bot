import { getPrefix } from '../../lib/config.js';
import { installThemePatch, getArgb } from '../../lib/themeHelper.js';

export default {
    command: 'theme',
    aliases: ['chattheme'],
    description: 'Set a chat theme color for everyone',
    category: 'Owner',
    ownerOnly: true,
    usage: 'theme <color> | theme off',

    async execute(sock, m, args, ctx) {
        installThemePatch();
        
        const prefix = getPrefix();
        const jid = m.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (!action) {
            return ctx.reply(`🎨 *Chat Theme*\n\nUsage:\n\`${prefix}theme <color>\` (e.g. red, blue)\n\`${prefix}theme off\` to clear`);
        }

        if (action === 'off' || action === 'clear') {
            try {
                await sock.relayMessage(jid, {
                    protocolMessage: {
                        type: 34,
                        chatThemeSetting: {
                            clearTheme: true,
                            settingTimestampMs: Date.now()
                        }
                    }
                }, { additionalAttributes: { type: 'media' } });
                return ctx.reply('🧹 Theme cleared!');
            } catch (e) {
                return ctx.reply(`❌ Failed to clear: ${e.message}`);
            }
        }

        const argb = getArgb(action);
        if (argb === null) {
            return ctx.reply(`❌ Unknown color "${action}". Try red, blue, green, or a hex code.`);
        }

        try {
            // 👇 EXACT STRUCTURE FROM YOUR FRIEND'S WORKING CODE
            await sock.relayMessage(jid, {
                protocolMessage: {
                    type: 34,
                    chatThemeSetting: {
                        settingTimestampMs: Date.now(),
                        colorSchemeId: 'Default-Blue@Minimal', // Required for WhatsApp to accept the theme
                        solidColor: {
                            backgroundLightArgb: argb,
                            backgroundDarkArgb: argb,
                            isDoodleEnabled: true, // Enable the pattern
                            // Generate a blue-tinted doodle based on the background
                            doodleLightArgb: (argb & 0x00FFFFFF) | 0x33000000, // Semi-transparent tint
                            doodleDarkArgb: (argb & 0x00FFFFFF) | 0x55000000
                        }
                    }
                }
            }, { additionalAttributes: { type: 'media' } });
            
            return ctx.reply(`🎨 Theme set to *${action}*!\n\n_Note: In groups, the bot must be an admin for WhatsApp to apply this._`);
        } catch (e) {
            console.error('[theme]', e);
            return ctx.reply(`❌ Failed to send theme: ${e.message}`);
        }
    }
};