import { getPrefix } from '../../lib/config.js';
import { getRealJid } from '../../lib/utils.js';

// In-memory store for active games
const activeGames = new Map();

function drawBoard(board) {
    return `┌─────┬─────┬─────┐
│  ${board[0]}  │  ${board[1]}  │  ${board[2]}  │
├─────┼─────┼─────┤
│  ${board[3]}  │  ${board[4]}  │  ${board[5]}  │
├─────┼─────┼─────┤
│  ${board[6]}  │  ${board[7]}  │  ${board[8]}  │
└─────┴─────┴─────┘`;
}

function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] === '❌' && board[b] === '❌' && board[c] === '❌') return '❌';
        if (board[a] === '⭕' && board[b] === '⭕' && board[c] === '⭕') return '⭕';
    }

    if (board.every(cell => cell === '❌' || cell === '⭕')) return 'draw';
    return null;
}

export default {
    command: 'tictactoe',
    aliases: ['ttt'],
    description: 'Play Tic-Tac-Toe',
    category: 'Games',
    ownerOnly: false,
    usage: 'tictactoe <1-9> OR tictactoe join',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const chatId = m.key.remoteJid;
        const senderId = await getRealJid(m.key.participant || m.key.remoteJid, sock);
        const senderName = m.pushName || senderId.split('@')[0];
        
        let game = activeGames.get(chatId);
        const action = args[0]?.toLowerCase();

        // ─── START A NEW GAME ───
        if (!game) {
            if (action === 'join') {
                return ctx.reply(`❌ No active game to join. Start one with \`${prefix}tictactoe\`.`);
            }

            // Initialize new game
            game = {
                board: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
                turn: '❌',
                playerX: { id: senderId, name: senderName },
                playerO: null,
                lastMove: Date.now()
            };
            activeGames.set(chatId, game);

            return ctx.reply(`🎮 *Tic-Tac-Toe*\n\n*Game Created by:* ${senderName} (❌)\n\nTo join the game, type:\n\`${prefix}ttt join\`\n\n${drawBoard(game.board)}`);
        }

        // ─── PLAYER O JOINS ───
        if (action === 'join') {
            if (game.playerO) {
                return ctx.reply('❌ This game is already full.');
            }
            if (game.playerX.id === senderId) {
                return ctx.reply('❌ You cannot play against yourself.');
            }

            game.playerO = { id: senderId, name: senderName };
            game.lastMove = Date.now();

            return ctx.reply(`✅ *Game Started!*\n\n❌ @${game.playerX.name}\n⭕ @${game.playerO.name}\n\nIt's ❌'s turn!\n\n${drawBoard(game.board)}`, {
                mentions: [game.playerX.id, game.playerO.id]
            });
        }

        // ─── VALIDATIONS ───
        if (!game.playerO) {
            return ctx.reply(`⏳ Waiting for an opponent to join with \`${prefix}ttt join\`.`);
        }

        if (senderId !== game.playerX.id && senderId !== game.playerO.id) {
            return ctx.reply('❌ You are not part of this game.');
        }

        const currentPlayer = game.turn === '❌' ? game.playerX : game.playerO;
        if (senderId !== currentPlayer.id) {
            return ctx.reply(`⏳ It is not your turn. It's ${currentPlayer.name}'s turn.`);
        }

        // ─── MAKE A MOVE ───
        const position = parseInt(action) - 1;
        if (isNaN(position) || position < 0 || position > 8) {
            return ctx.reply(`❌ Please choose a number between 1 and 9.`);
        }

        if (game.board[position] === '❌' || game.board[position] === '⭕') {
            return ctx.reply(`❌ That spot is already taken!`);
        }

        // Update board
        game.board[position] = game.turn;
        game.lastMove = Date.now();

        // Check for win
        const winner = checkWinner(game.board);
        if (winner) {
            activeGames.delete(chatId);
            if (winner === 'draw') {
                return ctx.reply(`🤝 *It's a Draw!*\n\n${drawBoard(game.board)}`);
            }
            const winnerName = winner === '❌' ? game.playerX.name : game.playerO.name;
            const winnerId = winner === '❌' ? game.playerX.id : game.playerO.id;
            return ctx.reply(`🏆 *${winner} Wins!*\n\nCongratulations @${winnerName}!\n\n${drawBoard(game.board)}`, {
                mentions: [winnerId]
            });
        }

        // Swap turn
        game.turn = game.turn === '❌' ? '⭕' : '❌';
        const nextPlayer = game.turn === '❌' ? game.playerX : game.playerO;

        return ctx.reply(`🎮 *Tic-Tac-Toe*\n\n*Turn:* ${game.turn} (@${nextPlayer.name})\n\n${drawBoard(game.board)}\n\n_Type \`${prefix}ttt <1-9>\` to play._`, {
            mentions: [nextPlayer.id]
        });
    }
};