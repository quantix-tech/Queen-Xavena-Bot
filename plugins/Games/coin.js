export default {
    command: 'coin',
    aliases: ['flip'],
    description: 'Flip a coin',
    category: 'Games',
    ownerOnly: false,
    usage: 'coin',

    async execute(sock, m, args, ctx) {
        const result = Math.random() < 0.5 ? '🪙 *Heads!*' : '🪙 *Tails!*';
        await ctx.reply(result);
    }
};