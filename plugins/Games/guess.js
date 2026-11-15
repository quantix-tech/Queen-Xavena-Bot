import { getPrefix } from '../../lib/config.js';

const activeGames = new Map();
const MAX_ATTEMPTS = 7;

export default {
    command: 'guess',
    description: 'Guess the number between 1 and 100',
    category: 'Games',
    ownerOnly: false,
    usage: 'guess <number> OR guess start',

    async execute(sock, m, args, ctx) {
        const chatId = m.key.remoteJid;
        const action = args[0]?.toLowerCase();
        const prefix = getPrefix();

        // Start a new game
        if (action === 'start' || !activeGames.has(chatId)) {
            if (action && action !== 'start') {
                return ctx.reply(`🎮 No active game. Start one with \`${prefix}guess start\`.`);
            }
            
            const target = Math.floor(Math.random() * 100) + 1;
            activeGames.set(chatId, { target, attempts: 0 });
            
            return ctx.reply(`🔢 *Guess the Number*\n\nI have picked a number between *1 and 100*.\nYou have *${MAX_ATTEMPTS} attempts*.\n\nType \`${prefix}guess <number>\` to play!`);
        }

        // Handle a guess
        const game = activeGames.get(chatId);
        const guess = parseInt(action);

        if (isNaN(guess) || guess < 1 || guess > 100) {
            return ctx.reply(`❌ Please enter a valid number between 1 and 100.`);
        }

        game.attempts++;

        if (guess === game.target) {
            activeGames.delete(chatId);
            return ctx.reply(`🎉 *Correct!*\n\nThe number was *${game.target}*.\nYou guessed it in *${game.attempts}* attempts!`);
        }

        if (game.attempts >= MAX_ATTEMPTS) {
            activeGames.delete(chatId);
            return ctx.reply(`💀 *Game Over!*\n\nYou ran out of attempts. The number was *${game.target}*.`);
        }

        const hint = guess > game.target ? '📉 *Too high!*' : '📈 *Too low!*';
        const remaining = MAX_ATTEMPTS - game.attempts;

        await ctx.reply(`${hint}\n\n*Attempts left:* ${remaining}\nKeep guessing!`);
    }
};