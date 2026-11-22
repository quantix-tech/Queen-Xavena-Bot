export default {
    command: '8ball',
    description: 'Ask the magic 8-ball a question',
    category: 'Fun',
    ownerOnly: false,
    usage: '8ball <question>',
    async execute(sock, m, args, ctx) {
        const question = args.join(' ');
        if (!question) return ctx.reply('🎱 Usage: `.8ball <question>`');

        const answers = [
            "It is certain ✅", "Without a doubt ✅", "Yes definitely ✅", "Most likely ✅",
            "Reply hazy, try again 🤔", "Ask again later 🤔", "Cannot predict now 🤔",
            "Don't count on it ❌", "Very doubtful ❌", "My sources say no ❌"
        ];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        await ctx.reply(`🎱 *Magic 8-Ball*\n\n*Question:* ${question}\n*Answer:* ${answer}`);
    }
};