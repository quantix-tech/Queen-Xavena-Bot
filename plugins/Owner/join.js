export default {
    command: 'join',
    description: 'Join a group via invite link',
    category: 'Owner',
    ownerOnly: true,
    usage: '.join <link>',
    async execute(sock, m, args, ctx) {
        if (!args[0]) return ctx.reply('❌ Provide a group invite link.');
        
        const link = args[0];
        const match = link.match(/(?:https?:\/\/)?chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
        
        if (!match) return ctx.reply('❌ Invalid WhatsApp group link.');

        try {
            const res = await sock.groupAcceptInvite(match[1]);
            await ctx.reply(`✅ *Joined Group*\n\nSuccessfully joined: ${res ? 'Yes' : 'Unknown'}`);
        } catch (err) {
            await ctx.reply(`❌ Failed to join group: ${err.message}`);
        }
    }
};