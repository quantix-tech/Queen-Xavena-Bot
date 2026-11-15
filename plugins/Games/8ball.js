import { getPrefix } from '../../lib/config.js';

export default {
    command: '8ball',
    description: 'Ask the magic 8-ball a question',
    category: 'Games',
    ownerOnly: false,
    usage: '8ball <question>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const question = args.join(' ');

        if (!question) {
            return ctx.reply(`🎱 *Magic 8-Ball*\n\nUsage: \`${prefix}8ball <your question>\`\nExample: \`${prefix}8ball Will I be rich?\``);
        }

        const answers = [
            // Positive
            "It is certain ✅",
            "Without a doubt ✅",
            "You may rely on it ✅",
            "Yes definitely ✅",
            "As I see it, yes ✅",
            "Most likely ✅",
            "Outlook good ✅",
            "Signs point to yes ✅",
            // Neutral
            "Reply hazy, try again 🤔",
            "Ask again later 🤔",
            "Better not tell you now 🤔",
            "Cannot predict now 🤔",
            "Concentrate and ask again 🤔",
            // Negative
            "Don't count on it ❌",
            "Very doubtful ❌",
            "My sources say no ❌",
            "Outlook not so good ❌",
            "No ❌"
        ];

        // Pick a random answer
        const answer = answers[Math.floor(Math.random() * answers.length)];

        await ctx.reply(`🎱 *Magic 8-Ball*\n\n*Question:* ${question}\n*Answer:* ${answer}`);
    }
};