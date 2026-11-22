export default {
    command: 'extracturls', description: 'Extract URLs from text', category: 'General', ownerOnly: false, usage: 'extracturls <text>',
    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        const urls = text.match(/https?:\/\/[^\s]+/g) || [];
        if (urls.length === 0) return ctx.reply('❌ No URLs found.');
        await ctx.reply(`🔗 *URLs Found (${urls.length})*\n\n${urls.map(u => `• ${u}`).join('\n')}`);
    }
};