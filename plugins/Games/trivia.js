import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

// In-memory store for active trivia games
const activeTrivia = new Map();

// Helper to decode HTML entities from the API (e.g., &quot;)
function decodeHtml(html) {
    return html.replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&eacute;/g, 'é');
}

export default {
    command: 'trivia',
    description: 'Start a trivia question',
    category: 'Games',
    ownerOnly: false,
    usage: 'trivia',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        // Check if someone is trying to answer an active question
        const activeGame = activeTrivia.get(chatId);
        if (activeGame && args.length > 0) {
            const userAnswer = args.join(' ').toLowerCase();
            const correctAnswer = activeGame.correct.toLowerCase();
            const shortAnswer = activeGame.correct.split(' ')[0].toLowerCase(); // e.g., if answer is "Lion", short is "lion"

            if (userAnswer === correctAnswer || userAnswer === shortAnswer) {
                activeTrivia.delete(chatId);
                return ctx.reply(`✅ *Correct!* @${sender.split('@')[0]} got it right!\n\n*Answer:* ${activeGame.correct}`, { mentions: [sender] });
            } else {
                return ctx.reply(`❌ *Wrong Answer!* Try again.`);
            }
        }

        // Start a new trivia
        await ctx.reply(`🧠 *Fetching a trivia question...*`);

        try {
            const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 10000 });
            const data = res.data.results[0];

            const question = decodeHtml(data.question);
            const correctAnswer = decodeHtml(data.correct_answer);
            const incorrectAnswers = data.incorrect_answers.map(decodeHtml);
            
            // Combine and shuffle
            const options = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5);

            activeTrivia.set(chatId, {
                correct: correctAnswer,
                startTime: Date.now()
            });

            let text = `🧠 *Trivia Quiz*\n\n*Category:* ${data.category}\n*Difficulty:* ${data.difficulty}\n\n*Question:*\n${question}\n\n`;
            options.forEach((opt, index) => {
                text += `${index + 1}. ${opt}\n`;
            });
            text += `\n_Type your answer to win!_`;

            await ctx.reply(text);

        } catch (err) {
            console.error('Trivia error:', err.message);
            await ctx.reply('❌ Failed to fetch a trivia question. Try again later.');
        }
    }
};