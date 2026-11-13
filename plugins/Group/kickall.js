import { getGroupMetadata, isBotAdmin, extractRawId } from '../../lib/utils.js';

export default {
    command: 'kickall',
    description: 'Remove all members from the group (Owner only)',
    category: 'Group',
    ownerOnly: true,
    usage: 'kickall confirm',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        if (args[0]?.toLowerCase() !== 'confirm') {
            return ctx.reply(`⚠️ *WARNING: KICK ALL*\n\nThis will remove **every member** from this group (except you and the bot).\n\nAre you absolutely sure?\n\nType: \`.kickall confirm\` to proceed.`);
        }

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants || [];

            const isBot = await isBotAdmin(sock, m.key.remoteJid, metadata);
            if (!isBot) {
                return ctx.reply('❌ I need to be an admin to kick everyone.');
            }

            const botNumber = extractRawId(sock.user.id);
            const senderNumber = extractRawId(m.key.participant);

            // Filter out the bot and the sender
            const targets = participants
                .filter(p => {
                    const pId = extractRawId(p.id);
                    const pPn = extractRawId(p.phoneNumber);
                    return pId !== botNumber && pPn !== botNumber && pId !== senderNumber && pPn !== senderNumber;
                })
                .map(p => p.id);

            if (targets.length === 0) {
                return ctx.reply('ℹ️ There is no one else to kick.');
            }

            await ctx.reply(`⏳ *Kicking ${targets.length} members...*\n\nThis might take a few minutes.`);

            let success = 0;
            let failed = 0;

            for (let i = 0; i < targets.length; i += 5) {
                const batch = targets.slice(i, i + 5);
                try {
                    await sock.groupParticipantsUpdate(m.key.remoteJid, batch, 'remove');
                    success += batch.length;
                } catch (err) {
                    failed += batch.length;
                    console.error('Kickall batch error:', err);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            await ctx.reply(`✅ *Kickall Complete*\n\n*Success:* ${success}\n*Failed:* ${failed}`);
        } catch (err) {
            console.error('Kickall error:', err);
            await ctx.reply(`❌ Failed to kick all.\n_Error: ${err.message}_`);
        }
    }
};