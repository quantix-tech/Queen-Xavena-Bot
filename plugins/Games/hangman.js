import { getPrefix } from '../../lib/config.js';

const activeGames = new Map();
const WORDS = ['javascript', 'whatsapp', 'telegram', 'computer', 'keyboard', 'monitor', 'internet', 'wifi', 'bot', 'python', 'coding', 'linux', 'android', 'apple', 'google'];

export default {
    command: 'hangman',
    description: 'Play a game of Hangman',
    category: 'Games',
    ownerOnly: false,
    usage: 'hangman start OR hangman <letter>',

    async execute(sock, m, args, ctx) {
        const chatId = m.key.remoteJid;
        const action = args[0]?.toLowerCase();
        const prefix = getPrefix();

        if (action === 'start' || !activeGames.has(chatId)) {
            if (action && action !== 'start') {
                return ctx.reply(`🎮 No active game. Start one with \`${prefix}hangman start\`.`);
            }

            const word = WORDS[Math.floor(Math.random() * WORDS.length)];
            activeGames.set(chatId, { word, guessed: [], lives: 6 });
            
            const display = word.split('').map(() => '_').join(' ');
            return ctx.reply(`🪢 *Hangman*\n\n*Word:* ${display}\n*Lives:* ❤️❤️❤️❤️❤️❤️\n\nGuess a letter: \`${prefix}hangman <letter>\``);
        }

        const game = activeGames.get(chatId);
        
        if (!action || action.length !== 1 || !/[a-z]/i.test(action)) {
            return ctx.reply(`❌ Please guess a single letter (a-z).`);
        }

        if (game.guessed.includes(action)) {
            return ctx.reply(`⚠️ You already guessed "${action}".`);
        }

        game.guessed.push(action);
        const isCorrect = game.word.includes(action);

        if (!isCorrect) {
            game.lives--;
        }

        const display = game.word.split('').map(char => game.guessed.includes(char) || char === ' ' ? char : '_').join(' ');
        const hearts = '❤️'.repeat(game.lives) + '🖤'.repeat(6 - game.lives);

        // Check Win
        if (!display.includes('_')) {
            activeGames.delete(chatId);
            return ctx.reply(`🎉 *You Won!*\n\nThe word was *${game.word}*.`);
        }

        // Check Loss
        if (game.lives <= 0) {
            activeGames.delete(chatId);
            return ctx.reply(`💀 *Game Over!*\n\nYou ran out of lives. The word was *${game.word}*.`);
        }

        await ctx.reply(`🪢 *Hangman*\n\n*Word:* ${display}\n*Lives:* ${hearts}\n\n*Guessed:* ${game.guessed.join(', ')}\n\nGuess a letter: \`${prefix}hangman <letter>\``);
    }
};