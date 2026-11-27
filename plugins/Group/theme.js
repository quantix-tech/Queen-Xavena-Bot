import { getPrefix } from '../../lib/config.js';
import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

function darken(hex, amount = 0.85) {
    const r = Math.floor(parseInt(hex.slice(0, 2), 16) * (1 - amount));
    const g = Math.floor(parseInt(hex.slice(2, 4), 16) * (1 - amount));
    const b = Math.floor(parseInt(hex.slice(4, 6), 16) * (1 - amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

function hexToArgb(hex) {
    return parseInt('FF' + hex.replace('#', ''), 16);
}

function makeTheme(name, mainHex, doodleHex = mainHex) {
    const bgHex = darken(mainHex.replace('#', ''), 0.88);
    return {
        colorSchemeId: `Default-${name}@Minimal`,
        solidColor: {
            background: hexToArgb(bgHex),
            isDoodleEnabled: true,
            doodleLightArgb: hexToArgb(doodleHex),
            doodleDarkArgb: hexToArgb(darken(doodleHex.replace('#', ''), 0.4)),
        }
    };
}

function parseHex(input) {
    const m = input?.match(/^#?([0-9a-f]{6})$/i);
    return m ? '#' + m[1].toUpperCase() : null;
}

function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const COLORS = {
    blue: '#3B82F6', darkblue: '#1E40AF', lightblue: '#60A5FA',
    skyblue: '#38BDF8', navy: '#0A1628', royalblue: '#2563EB',
    red: '#EF4444', darkred: '#991B1B', lightred: '#FCA5A5', crimson: '#DC143C',
    green: '#22C55E', darkgreen: '#166534', lightgreen: '#86EFAC',
    lime: '#A3E635', mint: '#6EE7B7', teal: '#14B8A6',
    purple: '#A855F7', darkpurple: '#6B21A8', lightpurple: '#C084FC',
    lavender: '#C4B5FD', violet: '#8B5CF6',
    pink: '#EC4899', darkpink: '#BE185D', lightpink: '#F9A8D4', hotpink: '#FF1493',
    orange: '#F97316', darkorange: '#C2410C', yellow: '#EAB308', gold: '#FACC15',
    cyan: '#06B6D4', brown: '#92400E', grey: '#64748B', gray: '#64748B',
    black: '#1E293B', white: '#E2E8F0',
};

export default {
    command: 'theme',
    description: 'Set group chat theme',
    category: 'Group',
    ownerOnly: false,
    usage: 'theme <color|#hex> [doodle <color|#hex>] / theme doodle <color> / theme off',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        const prefix = getPrefix();
        const raw = args.map(a => a.toLowerCase().trim()).filter(Boolean);

        if (!raw.length) {
            return ctx.reply(
                `🎨 *Chat Theme*\n\n` +
                `• \`${prefix}theme blue\` — Blue theme\n` +
                `• \`${prefix}theme darkblue\` — Dark blue theme\n` +
                `• \`${prefix}theme blue doodle red\` — Blue theme, red doodles\n` +
                `• \`${prefix}theme doodle red\` — Red doodles\n` +
                `• \`${prefix}theme #FF00FF\` — Custom hex\n` +
                `• \`${prefix}theme off\` — Remove theme\n` +
                `• \`${prefix}theme list\` — All colors`
            );
        }

        if (raw[0] === 'list') {
            return ctx.reply(`🎨 *All Colors*\n\n${Object.keys(COLORS).join(', ')}\n\n+ any hex like \`#FF00FF\``);
        }

        try {
            // Admin checks — same as kick
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const senderIsAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const botIsAdmin = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!senderIsAdmin) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!botIsAdmin) {
                return ctx.reply('❌ I need to be an admin to change the theme.');
            }

            if (raw[0] === 'off' || raw[0] === 'none' || raw[0] === 'default') {
                await sock.chatModify({ theme: null }, m.key.remoteJid);
                return ctx.reply('✅ Theme removed. Back to default.');
            }

            let mainHex = null;
            let mainName = null;
            let doodleHex = null;

            if (raw[0] === 'doodle') {
                doodleHex = COLORS[raw[1]] || parseHex(raw[1]);
                if (!doodleHex) return ctx.reply(`❌ Unknown doodle color \`${raw[1]}\`. Try \`${prefix}theme list\``);
                mainHex = doodleHex;
                mainName = 'Custom';
            } else {
                mainHex = COLORS[raw[0]] || parseHex(raw[0]);
                if (!mainHex) return ctx.reply(`❌ Unknown color \`${raw[0]}\`.\n\nTry \`${prefix}theme list\` or a hex like \`#FF00FF\`.`);
                mainName = COLORS[raw[0]] ? cap(raw[0]) : 'Custom';

                if (raw[1] === 'doodle' && raw[2]) {
                    doodleHex = COLORS[raw[2]] || parseHex(raw[2]);
                    if (!doodleHex) return ctx.reply(`❌ Unknown doodle color \`${raw[2]}\`.`);
                } else if (raw[1]) {
                    doodleHex = COLORS[raw[1]] || parseHex(raw[1]);
                    if (!doodleHex) return ctx.reply(`❌ Unknown doodle color \`${raw[1]}\`.`);
                }
            }

            const theme = makeTheme(mainName, mainHex, doodleHex || mainHex);
            await sock.chatModify({ theme }, m.key.remoteJid);

            return ctx.reply(`✅ *Theme Applied*\n\n🎨 Theme: \`${mainHex}\`\n✨ Doodle: \`${doodleHex || mainHex}\`\n📦 Scheme: \`${theme.colorSchemeId}\``);
        } catch (err) {
            console.error('Theme error:', err);
            if (err.message?.includes('theme') || err.message?.includes('not a function')) {
                return ctx.reply(`❌ Your Baileys version doesn't support \`chatModify.theme\` yet.\n\nUpdate it:\n\`npm i @itsliaaa/baileys@latest\``);
            }
            return ctx.reply(`❌ Failed to set theme.\n_Error: ${err.message}_`);
        }
    }
};