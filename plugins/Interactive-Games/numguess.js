import { sendGameCanvas } from '../../lib/interactive.js';
import sharp from 'sharp';

const activeGames = new Map();

// You can draw the buttons ON the canvas using SVG, 
// but WhatsApp will still put the REAL clickable ones underneath.
function createGameImage(attempts, feedbackText) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050204"/><stop offset=".5" stop-color="#5c0916"/><stop offset="1" stop-color="#180309"/></linearGradient></defs>
      <rect width="1200" height="800" rx="40" fill="url(#bg)"/>
      <rect x="24" y="24" width="1152" height="752" rx="34" fill="none" stroke="#ff3158" stroke-width="6"/>
      <text x="600" y="120" text-anchor="middle" class="title">🎯 NUMBER GUESS</text>
      <path d="M90 170H1110" stroke="#ff3158" stroke-width="3"/>
      <text x="600" y="300" text-anchor="middle" class="stats">ATTEMPTS: ${attempts}</text>
      <rect x="150" y="380" width="900" height="200" rx="20" fill="#100207" stroke="#ff3158" stroke-width="4"/>
      <text x="600" y="490" text-anchor="middle" class="feedback">${feedbackText}</text>
      <style>
        .title{font:900 50px Arial,sans-serif;fill:#fff2f6;letter-spacing:4px}
        .stats{font:700 40px monospace;fill:#ffc6d4;letter-spacing:2px}
        .feedback{font:900 45px Arial,sans-serif;fill:#ffffff}
      </style>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

export default {
    command: 'numguess',
    aliases: ['ng'],
    description: 'Guess the number',
    category: 'Interactive-Games',
    ownerOnly: false,
    usage: 'numguess',

    async execute(sock, m, args, ctx) {
        const chatId = m.key.remoteJid;
        activeGames.set(chatId, { target: Math.floor(Math.random() * 50) + 1, attempts: 0 });

        const image = await createGameImage(0, 'Make your first guess!');
        
        const buttons = [
            { text: 'Guess 10', id: 'ng_10' },
            { text: 'Guess 25', id: 'ng_25' },
            { text: 'Guess 40', id: 'ng_40' }
        ];

        await sendGameCanvas({ sock, jid: chatId, quoted: m, title: 'NUMBER GUESS', imageBuffer: image, buttons });
    }
};