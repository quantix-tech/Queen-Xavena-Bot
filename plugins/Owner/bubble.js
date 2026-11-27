import { getPrefix } from '../../lib/config.js';
import { initThemePatches, BUBBLE_SCHEMES } from '../../lib/themePatch.js';
import { isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'bubble',
    aliases: ['bubbles', 'bubblescheme'],
    description: 'Set bubble scheme only — does not affect theme',
    category: 'Owner',
    ownerOnly: true,
    usage: 'bubble <name> | bubble list | bubble off',

    async execute(sock, m, args, ctx) {
        initThemePatches();
        const prefix = getPrefix();
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const name = args[0]?.toLowerCase();

        if (!name) {
            return ctx.reply(`🫧 *Bubble*\n\nUsage:\n\`${prefix}bubble <name>\` — bubble only\n\`${prefix}bubble list\` — show all\n\`${prefix}bubble off\` — clear bubble\n\nTheme is separate: \`${prefix}theme red\``);
        }

        if (name === 'list') {
            return ctx.reply(`🫧 *Bubble Schemes*\n\n${Object.entries(BUBBLE_SCHEMES).map(([k, v]) => `• \`${k}\` → ${v}`).join('\n')}`);
        }

        if (name === 'off' || name === 'clear') {
            try {
                await sock.relayMessage(jid, {
                    protocolMessage: { type: 34, chatThemeSetting: { clearTheme: true, settingTimestampMs: Date.now() } }
                }, { additionalAttributes: { type: 'media' } });
                return ctx.reply('🧹 Bubble cleared!');
            } catch (e) {
                return ctx.reply(`❌ Failed: ${e.message}`);
            }
        }

        const key = name.replace(/[\s_-]+/g, '');
        const scheme = BUBBLE_SCHEMES[key];
        if (!scheme) return ctx.reply(`❌ Unknown bubble "${name}". Try: ${Object.keys(BUBBLE_SCHEMES).join(', ')}`);

        if (isGroup) {
            try {
                const admin = await isBotAdmin(sock, jid);
                if (!admin) return ctx.reply(`❌ *Admin Required*`);
            } catch (e) {}
        }

        try {
            // ONLY colorSchemeId — no solidColor, so theme is untouched
            await sock.relayMessage(jid, {
                protocolMessage: {
                    type: 34,
                    chatThemeSetting: {
                        settingTimestampMs: Date.now(),
                        colorSchemeId: scheme
                    }
                }
            }, { additionalAttributes: { type: 'media' } });
            return ctx.reply(`🫧 Bubble set to *${name}* (${scheme}) — theme untouched`);
        } catch (e) {
            return ctx.reply(`❌ Failed: ${e.message}`);
        }
    }
};