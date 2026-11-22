export default {
    command: 'removeemoji',
    description: 'Remove emojis from text',
    category: 'Tools',
    ownerOnly: false,
    usage: 'removeemoji <text>',
    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        if (!text) return ctx.reply('❌ Provide text.');
        const result = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/\s+/g, ' ').trim();
        await ctx.reply(result || '(No text left)');
    }
};