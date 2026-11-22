export default {
    command: 'reaction',
    description: 'React with a random emoji',
    category: 'Fun',
    ownerOnly: false,
    usage: 'reaction',
    async execute(sock, m, args, ctx) {
        const emojis = ['😍', '💀', '🔥', '🙏', '😭', '🤡', '💯', '✨', '🥶', '🤝', '🤔', '👑', '💖'];
        await ctx.react(emojis[Math.floor(Math.random() * emojis.length)]);
    }
};