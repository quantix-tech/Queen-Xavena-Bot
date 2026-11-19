import { getGroupRules, setGroupRules } from '../../handlers/rules.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'rules',
    description: 'View or set the group rules',
    category: 'Group',
    ownerOnly: false,
    usage: 'rules OR rules set <text>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        const action = args[0]?.toLowerCase();

        if (action === 'set') {
            const text = args.slice(1).join(' ');
            if (!text) return ctx.reply('❌ Provide the rules text.');

            try {
                const metadata = await getGroupMetadata(sock, m.key.remoteJid);
                const senderIsAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
                if (!senderIsAdmin) return ctx.reply('❌ Only admins can set rules.');

                setGroupRules(m.key.remoteJid, text);
                await ctx.reply('✅ *Rules Saved!*');
            } catch (err) {
                await ctx.reply(`❌ Error: ${err.message}`);
            }
        } else {
            const rules = getGroupRules(m.key.remoteJid);
            if (!rules) return ctx.reply(`📜 *Group Rules*\n\nNo rules set yet.\nAdmins can use \`${getPrefix()}rules set <text>\` to add them.`);
            await ctx.reply(`📜 *Group Rules*\n\n${rules}`);
        }
    }
};