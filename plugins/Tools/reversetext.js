export default {
    command: 'reversetext',
    description: 'Reverse text',
    category: 'Tools',
    ownerOnly: false,
    usage: 'reverse <text>',
    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        if (!text) return ctx.reply('❌ Provide text.');
        await ctx.reply(text.split('').reverse().join(''));
    }
};