import { getPrefix } from '../../lib/config.js';
import { isBotAdmin, isSenderAdmin } from '../../lib/utils.js';

// Meta AI's known internal JID
const META_AI_JID = '13135550002@c.us';

export default {
    command: 'metaai',
    aliases: ['meta'],
    description: 'Add (mention) or kick Meta AI in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'metaai <add|kick>',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        const prefix = getPrefix();

        if (!jid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        const action = args[0]?.toLowerCase();

        if (!action) {
            return ctx.reply(`🤖 *Meta AI Control*\n\n*Usage:*\n\`${prefix}metaai add\` — Mention Meta AI in the chat\n\`${prefix}metaai kick\` — Remove Meta AI from the group`);
        }

        // Check if sender is admin (only admins should manage this)
        const isAdmin = await isSenderAdmin(sock, jid, m.key.participant);
        if (!isAdmin) {
            return ctx.reply('❌ Admin only.');
        }

        if (action === 'add') {
            try {
                // We can't force-add via API, but we can mention it.
                // This is how you "summon" Meta AI in a group.
                await sock.sendMessage(jid, {
                    text: '@Meta AI',
                    mentions: [META_AI_JID]
                }, { quoted: m });
                await ctx.react('✅');
            } catch (err) {
                console.error('MetaAI add error:', err);
                await ctx.reply('❌ Failed to mention Meta AI.');
            }
            return;
        }

        if (action === 'kick') {
            try {
                // Ensure the bot is admin before trying to kick
                const isBot = await isBotAdmin(sock, jid);
                if (!isBot) {
                    return ctx.reply('❌ I need to be an admin to kick Meta AI.');
                }

                await sock.groupParticipantsUpdate(jid, [META_AI_JID], 'remove');
                await ctx.reply('✅ *Meta AI Kicked*\n\nMeta AI has been removed from the group.');
            } catch (err) {
                console.error('MetaAI kick error:', err);
                await ctx.reply(`❌ Failed to kick Meta AI.\n_Error: ${err.message}_\n\n*Note:* Meta AI might not actually be a member, or WhatsApp blocked the action.`);
            }
            return;
        }

        return ctx.reply(`❌ Invalid option. Use \`${prefix}metaai add\` or \`${prefix}metaai kick\`.`);
    }
};