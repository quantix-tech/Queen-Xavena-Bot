import { delay } from '@itsliaaa/baileys';

export default {
    command: 'leave',
    description: 'Make the bot leave the current group',
    category: 'Owner',
    ownerOnly: true,
    usage: 'leave',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;

        // 1. Ensure it's a group
        if (!jid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        // 2. Send the goodbye message
        await ctx.reply('👋 *Goodbye!*\n\nI have been instructed to leave this group.');

        // 3. Wait for the message to send, then leave
        await delay(1500);

        try {
            // 4. Use the correct group JID to leave
            await sock.groupLeave(jid);
        } catch (err) {
            console.error('Failed to leave group:', err);
            // If it fails, we send an error message to the chat (though the bot will still be in the group)
            await ctx.reply(`❌ *Error:* Failed to leave the group.\n_${err.message}_`);
        }
    }
};