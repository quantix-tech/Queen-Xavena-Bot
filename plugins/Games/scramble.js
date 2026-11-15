import { getPrefix } from '../../lib/config.js';

const activeGames = new Map();
const WORDS = ['developer', 'whatsapp', 'facebook', 'instagram', 'snapchat', 'youtube', 'twitter', 'linkedin', 'discord', 'telegram', 'spotify', 'netflix', 'amazon', 'google', 'microsoft'];

function shuffle(word) {
    let shuffled = word.split('').sort(() => 0.5 - Math.random()).join('');
    // Ensure the shuffled word is not the same as the original
    return shuffled === word ? shuffle(word) : shuffled;
}

export default {
    command: 'scramble',
    description: 'Unscramble a scrambled word',
    category: 'Games',
    ownerOnly: false,
    usage: 'scramble start OR scramble <answer>',

    async execute(sock, m, args, ctx) {
        const chatId = m.key.remoteJid;
        const action = args[0]?.toLowerCase();
        const prefix = getPrefix();

        if (action === 'start' || !activeGames.has(chatId)) {
            if (action && action !== 'start') {
                return ctx.reply(`🎮 No active game. Start one with \`${prefix}scramble start\`.`);
            }

            const word = WORDS[Math.floor(Math.random() * WORDS.length)];
            const scrambled = shuffle(word);
            activeGames.set(chatId, { word });

            return ctx.reply(`🔠 *Word Scramble*\n\nUnscramble this word:\n\n*${scrambled.toUpperCase()}*\n\nType \`${prefix}scramble <answer>\` to submit!`);
        }

        const game = activeGames.get(chatId);

        if (action === game.word) {
            activeGames.delete(chatId);
            return ctx.reply(`🎉 *Correct!*\n\nThe word was indeed *${game.word}*.`);
        } else {
            return ctx.reply(`❌ *Wrong!* Try again.`);
        }
    }
};