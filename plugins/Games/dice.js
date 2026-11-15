export default {
    command: 'dice',
    aliases: ['roll'],
    description: 'Roll a dice',
    category: 'Games',
    ownerOnly: false,
    usage: 'dice',

    async execute(sock, m, args, ctx) {
        const result = Math.floor(Math.random() * 6) + 1;
        await ctx.reply(`🎲 *Dice Roll*\n\nYou rolled a *${result}*!`);
    }
};