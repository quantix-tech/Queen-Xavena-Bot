import { getPrefix } from '../../lib/config.js';
import { initThemePatches, themeArgbPair } from '../../lib/themePatch.js';
import { isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'theme',
    aliases: ['chattheme', 'wallcolor'],
    description: 'Set a chat theme color for everyone',
    category: 'Owner',
    ownerOnly: true,
    usage: 'theme <color> | theme off',

    async execute(sock, m, args, ctx) {
        const patchState = initThemePatches();

        const prefix = getPrefix();
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const action = args[0]?.toLowerCase();

        if (!action) {
            return ctx.reply(`🎨 *Chat Theme*\n\nUsage:\n\`${prefix}theme <color>\` (e.g. red, blue)\n\`${prefix}theme off\` to clear\n\nPatch Status: getMediaType=${patchState.getMediaType}, proto=${patchState.protoEncodePatched}`);
        }

        if (action === 'off' || action === 'clear') {
            try {
                await sock.relayMessage(jid, {
                    protocolMessage: {
                        type: 34,
                        chatThemeSetting: { clearTheme: true, settingTimestampMs: Date.now() }
                    }
                }, { additionalAttributes: { type: 'media' } });
                return ctx.reply('🧹 Theme cleared!');
            } catch (e) {
                return ctx.reply(`❌ Failed to clear: ${e.message}`);
            }
        }

        const pair = themeArgbPair(action);
        if (!pair) {
            return ctx.reply(`❌ Unknown color "${action}". Try red, blue, green, or a hex code.`);
        }

        if (isGroup) {
            try {
                const admin = await isBotAdmin(sock, jid);
                if (!admin) {
                    return ctx.reply(`❌ *Admin Required*\n\nWhatsApp requires the bot to be an admin to change the theme, OR a group admin must set "Edit group info" to "All participants".`);
                }
            } catch (e) {
                console.warn('[theme] Admin check failed:', e.message);
            }
        }

        try {
            // Injected exactly like 3rd file: preset scheme + preset bg/doodle, else no scheme + doodle = light/dark
            const setting = {
                settingTimestampMs: Date.now(),
                solidColor: {
                    backgroundLightArgb: pair.light,
                    backgroundDarkArgb: pair.dark,
                    isDoodleEnabled: true,
                    doodleLightArgb: pair.doodleLight,
                    doodleDarkArgb: pair.doodleDark
                }
            };
            if (pair.scheme) setting.colorSchemeId = pair.scheme;

            await sock.relayMessage(jid, {
                protocolMessage: {
                    type: 34,
                    chatThemeSetting: setting
                }
            }, { additionalAttributes: { type: 'media' } });

            return ctx.reply(`🎨 Theme set to *${action}*!`);
        } catch (e) {
            console.error('[theme]', e);
            return ctx.reply(`❌ Failed to send theme: ${e.message}`);
        }
    }
};