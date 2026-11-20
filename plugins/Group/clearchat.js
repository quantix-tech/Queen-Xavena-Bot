import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';

export default {
    command: 'clearchat',
    aliases: ['clear'],
    description: 'Clear the chat history',
    category: 'Group',
    ownerOnly: false,
    usage: 'clearchat',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');

        if (isGroup) {
            try {
                const metadata = await getGroupMetadata(sock, jid);
                const isSender = await isSenderAdmin(sock, jid, m.key.participant, metadata);
                if (!isSender) return ctx.reply('❌ Only group admins can clear the chat.');
            } catch (err) {
                return ctx.reply(`❌ Error checking permissions: ${err.message}`);
            }
        }

        try {
            // Send the clear protocol to WhatsApp
            await sock.chatModify({ clear: jid }, jid);
            
            // Note: Baileys doesn't provide a confirmation if this works or not because it's a local action.
            // We will just assume it worked if it doesn't throw an error.
            console.log(`[clearchat] Cleared chat for ${jid}`);
            
        } catch (err) {
            console.error('ClearChat error:', err);
            return ctx.reply(`❌ Failed to clear chat.\n_Error: ${err.message}_`);
        }
    }
};