import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

const activeGames = new Map();

export default {
    command: 'wcg',
    aliases: ['wordchain'],
    description: 'Play Word Chain Game',
    category: 'Games',
    ownerOnly: false,
    usage: 'wcg start / join / begin / <word> / end / skip',

    async execute(sock, m, args, ctx) {
        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const senderName = m.pushName || 'Player';
        const action = args[0]?.toLowerCase();
        const prefix = getPrefix();

        let game = activeGames.get(chatId);

        // ─── START GAME ───
        if (action === 'start') {
            if (game) return ctx.reply('❌ A game is already running in this chat. Type `.wcg end` to stop it.');
            
            // Generate a random starting letter (A-Z)
            const startLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            
            game = {
                players: [{ id: senderId, name: senderName }],
                turn: 0,
                lastLetter: startLetter.toLowerCase(),
                usedWords: [],
                started: false
            };
            activeGames.set(chatId, game);
            
            return ctx.reply(`🔠 *Word Chain Started!*\n\n*Host:* ${senderName}\n*Starting Letter:* *${startLetter}*\n\nType \`${prefix}wcg join\` to join!\nType \`${prefix}wcg begin\` to start playing.`);
        }

        // ─── JOIN GAME ───
        if (action === 'join') {
            if (!game) return ctx.reply(`❌ No active game. Start one with \`${prefix}wcg start\`.`);
            if (game.started) return ctx.reply(`❌ The game has already started.`);
            if (game.players.some(p => p.id === senderId)) return ctx.reply('❌ You are already in the game.');
            
            game.players.push({ id: senderId, name: senderName });
            return ctx.reply(`✅ *${senderName}* joined the game! (${game.players.length} players)\n\nWaiting for the host to begin...`);
        }

        // ─── BEGIN GAME ───
        if (action === 'begin') {
            if (!game) return ctx.reply(`❌ No active game.`);
            if (game.started) return ctx.reply(`❌ Game already started.`);
            if (game.players.length < 2) return ctx.reply(`❌ Need at least 2 players to start. Invite someone with \`${prefix}wcg join\`.`);

            game.started = true;
            game.turn = 0;
            const currentPlayer = game.players[game.turn];

            return ctx.reply(`🎮 *Game Started!*\n\n*Players:* ${game.players.map(p => p.name).join(', ')}\n\n*Turn:* ${currentPlayer.name}\n*First Word must start with:* *${game.lastLetter.toUpperCase()}*\n\nType \`${prefix}wcg <word>\` to play!`, {
                mentions: [currentPlayer.id]
            });
        }

        // ─── END GAME ───
        if (action === 'end') {
            if (!game) return ctx.reply(`❌ No active game.`);
            if (!game.players.some(p => p.id === senderId)) return ctx.reply(`❌ Only players can end the game.`);
            activeGames.delete(chatId);
            return ctx.reply(`🛑 *Word Chain Ended*`);
        }

        // ─── SKIP TURN (If someone is AFK) ───
        if (action === 'skip') {
            if (!game || !game.started) return ctx.reply(`❌ No active game.`);
            const currentPlayer = game.players[game.turn];
            
            // Only the current player or the host (player 0) can skip
            if (senderId !== currentPlayer.id && senderId !== game.players[0].id) {
                return ctx.reply(`❌ Only the current player or the host can skip.`);
            }

            game.turn = (game.turn + 1) % game.players.length;
            const nextPlayer = game.players[game.turn];
            
            return ctx.reply(`⏭️ *Turn Skipped!*\n\n*Next Turn:* ${nextPlayer.name}\n*Letter:* *${game.lastLetter.toUpperCase()}*\n\nType \`${prefix}wcg <word>\` to play!`, {
                mentions: [nextPlayer.id]
            });
        }

        // ─── PLAY A WORD ───
        if (!game) return ctx.reply(`❌ No active game. Start one with \`${prefix}wcg start\`.`);
        if (!game.started) return ctx.reply(`⏳ Waiting for host to begin. Type \`${prefix}wcg begin\`.`);
        if (!action) return ctx.reply(`❌ Please provide a word.`);

        const currentPlayer = game.players[game.turn];
        if (senderId !== currentPlayer.id) {
            return ctx.reply(`⏳ It's not your turn. Waiting for *${currentPlayer.name}* to play.`, {
                mentions: [currentPlayer.id]
            });
        }

        const word = action;

        // 1. Check if the word starts with the correct letter
        if (!word.startsWith(game.lastLetter)) {
            return ctx.reply(`❌ *Invalid Word!*\n\nYour word must start with the letter *${game.lastLetter.toUpperCase()}*.`);
        }

        // 2. Check if word was already used
        if (game.usedWords.includes(word)) {
            return ctx.reply(`❌ *Already Used!*\n\n*${word}* has already been played in this game.`);
        }

        // 3. Validate the word using a free Dictionary API
        try {
            await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, { timeout: 8000 });
        } catch (err) {
            // If the API returns 404, the word doesn't exist
            return ctx.reply(`❌ *Not a valid English word!*\n\n*${word}* was not found in the dictionary. Try another one.`);
        }

        // ─── SUCCESSFUL PLAY ───
        game.usedWords.push(word);
        const lastLetter = word.charAt(word.length - 1).toLowerCase();
        game.lastLetter = lastLetter;
        
        // Move to the next player
        game.turn = (game.turn + 1) % game.players.length;
        const nextPlayer = game.players[game.turn];

        return ctx.reply(`✅ *${currentPlayer.name}* played: *${word}*\n\n*Next Turn:* ${nextPlayer.name}\n*Next Letter:* *${lastLetter.toUpperCase()}*\n\nType \`${prefix}wcg <word>\` to play!`, {
            mentions: [nextPlayer.id]
        });
    }
};