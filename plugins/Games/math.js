import { getPrefix } from '../../lib/config.js';

const activeGames = new Map();

export default {
    command: 'math',
    description: 'Solve a quick math equation',
    category: 'Games',
    ownerOnly: false,
    usage: 'math <answer> OR math start',

    async execute(sock, m, args, ctx) {
        const chatId = m.key.remoteJid;
        const action = args[0]?.toLowerCase();
        const prefix = getPrefix();

        // Start a new game
        if (action === 'start' || !activeGames.has(chatId)) {
            if (action && action !== 'start') {
                return ctx.reply(`🧮 No active math quiz. Start one with \`${prefix}math start\`.`);
            }

            // Generate random math (1 to 50)
            const a = Math.floor(Math.random() * 50) + 1;
            const b = Math.floor(Math.random() * 50) + 1;
            const answer = a + b;

            activeGames.set(chatId, { answer });
            
            return ctx.reply(`🧮 *Math Quiz*\n\n*Question:* ${a} + ${b} = ?\n\nType \`${prefix}math <answer>\` to submit!`);
        }

        // Handle answer
        const game = activeGames.get(chatId);
        const userAnswer = parseInt(action);

        if (isNaN(userAnswer)) {
            return ctx.reply(`❌ Please enter a valid number.`);
        }

        if (userAnswer === game.answer) {
            activeGames.delete(chatId);
            return ctx.reply(`✅ *Correct!*\n\nThe answer is indeed *${game.answer}*.`);
        } else {
            return ctx.reply(`❌ *Wrong!* Try again.`);
      }
   }
};