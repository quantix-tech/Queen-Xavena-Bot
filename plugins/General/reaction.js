const REACTIONS = ['😍', '💀', '🔥', '🙏', '😭', '🤡', '💯', '✨', '🥶', '🤝'];

export default {
    command: 'reaction',
    description: 'Get a random reaction emoji',
    category: 'General',
    ownerOnly: false,
    usage: 'reaction',

    async execute(sock, m, args, ctx) {
        const emoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
        await ctx.react(emoji);
    }
};