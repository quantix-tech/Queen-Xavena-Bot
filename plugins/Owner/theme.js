import { getPrefix } from '../../lib/config.js';
import { installThemePatch, getArgb } from '../../lib/themeHelper.js';

export default {
    command: 'theme',
    aliases: ['chattheme'],
    description: 'Test setting a solid chat theme color',
    category: 'Owner',
    ownerOnly: true,
    usage: 'theme <color> | theme off',

    async execute(sock, m, args, ctx) {
        installThemePatch(); // Ensure it's active
        
        const prefix = getPrefix();
        const jid = m.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (!action) {
            return ctx.reply(`🎨 *Chat Theme Test*\n\nUsage:\n\`${prefix}theme <color>\` (e.g. red, blue, #FF0000)\n\`${prefix}theme off\` to clear`);
        }

        if (action === 'off' || action === 'clear') {
            try {
                await sock.relayMessage(jid, {
                    protocolMessage: {
                        type: 34, // CHAT_THEME_SETTING
                        chatThemeSetting: {
                            clearTheme: true,
                            settingTimestampMs: Date.now()
                        }
                    }
                }, { additionalAttributes: { type: 'media' } }); // The 'media' attribute is crucial
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
            // Send the protocol message with the solid color
            await sock.relayMessage(jid, {
                protocolMessage: {
                    type: 34,
                    chatThemeSetting: {
                        settingTimestampMs: Date.now(),
                        solidColor: {
                            backgroundLightArgb: argb,
                            backgroundDarkArgb: argb,
                            isDoodleEnabled: false
                        }
                    }
                }
            }, { additionalAttributes: { type: 'media' } });
            
            return ctx.reply(`🎨 Theme set to *${action}*! (Note: This might only apply if you are an admin and WhatsApp supports it).`);
        } catch (e) {
            console.error('[theme]', e);
            return ctx.reply(`❌ Failed to send theme: ${e.message}`);
        }
    }
};