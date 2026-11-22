export default {
    command: 'spoiler', description: 'Hide text as a spoiler', category: 'Tools', ownerOnly: false, usage: 'spoiler <text>',
    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        if (!text) return ctx.reply('❌ Provide text.');
        await ctx.reply(`||${text}||`);
    }
};