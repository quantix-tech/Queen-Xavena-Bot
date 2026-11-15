import { getPrefix } from '../../lib/config.js';

export default {
    command: 'rps',
    description: 'Play Rock, Paper, Scissors against the bot',
    category: 'Games',
    ownerOnly: false,
    usage: 'rps <rock/paper/scissors>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const userChoice = args[0]?.toLowerCase();

        if (!userChoice || !['rock', 'paper', 'scissors'].includes(userChoice)) {
            return ctx.reply(`✂️ *Rock, Paper, Scissors*\n\nUsage: \`${prefix}rps <rock/paper/scissors>\``);
        }

        const choices = ['rock', 'paper', 'scissors'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        let result;
        if (userChoice === botChoice) {
            result = '🤝 *It\'s a tie!*';
        } else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) {
            result = '🎉 *You win!*';
        } else {
            result = '😢 *You lose!*';
        }

        await ctx.reply(`✂️ *RPS*\n\n*You:* ${userChoice}\n*Bot:* ${botChoice}\n\n${result}`);
    }
};