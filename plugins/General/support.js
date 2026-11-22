export default {
    command: 'support', description: 'Get support group link', category: 'General', ownerOnly: false, usage: 'support',
    async execute(sock, m, args, ctx) {
        await ctx.reply(`🛠️ *Support*\n\nJoin the support channel for updates and help:\n\n🔗 https://whatsapp.com/channel/0029VbESEmyBfxo3GOIYV11V`);
    }
};