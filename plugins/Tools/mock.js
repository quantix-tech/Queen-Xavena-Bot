export default {
    command: 'mock', description: 'Mocking SpongeBob text', category: 'Tools', ownerOnly: false, usage: 'mock <text>',
    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        if (!text) return ctx.reply('❌ Provide text.');
        const result = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
        await ctx.reply(result);
    }
};