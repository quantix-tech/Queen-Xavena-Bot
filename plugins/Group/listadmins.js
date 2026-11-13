import { getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'listadmins',
    description: 'List all admins in the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'listadmins',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        await ctx.react('⏳');

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants || [];

            const admins = participants.filter(
                p => p.admin === 'admin' || p.admin === 'superadmin'
            );

            if (admins.length === 0) {
                await ctx.react('❌');
                return ctx.reply('ℹ️ This group has no admins.');
            }

            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

            let text = `┌─〔 🛡️ GROUP ADMINS 〕\n`;
            text += `├◆ *Group* : ${metadata.subject}\n`;
            text += `├◆ *Total* : ${admins.length}\n`;
            text += `└─────────────◆\n\n`;

            const mentions = [];

            admins.forEach((admin) => {
                // 👇 FIX: Use Push Name instead of raw number
                const displayName = admin.notify || admin.name || admin.id.split('@')[0];
                const isBot = admin.id === botJid;
                const isSuperAdmin = admin.admin === 'superadmin';
                
                const crown = isSuperAdmin ? '👑' : '🛡️';
                const tag = isBot ? ' (Bot)' : '';

                text += `├◆ ${crown} @${displayName}${tag}\n`;
                mentions.push(admin.id);
            });

            text += `└─────────────◆`;

            await sock.sendMessage(m.key.remoteJid, {
                text: text,
                mentions: mentions
            }, { quoted: m });

            await ctx.react('✅');

        } catch (err) {
            console.error('ListAdmins error:', err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to fetch admin list.\n_Error: ${err.message}_`);
        }
    }
};