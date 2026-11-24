import { sendInteractiveHTML } from '../../lib/interactive.js';

const activeGames = new Map();

function buildGameHTML(attempts, feedbackText) {
    // Exact same HTML structure from your screenshot
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        *{box-sizing:border-box} html,body{margin:0;background:transparent;font-family:Arial,sans-serif}
        body{padding:6px;background:radial-gradient(circle at 50% 5%,#174936,#061812 72%)}
        .card{padding:14px;border:2px solid #b9954d;border-radius:16px;background:linear-gradient(145deg,#0a2e22,#123e2f 55%,#061812);color:#e3dfbb;box-shadow:inset 0 0 0 3px #163f31,0 7px 18px #000b}
        .title{text-align:center;color:#f1e3a2;font:bold 17px Arial Black,sans-serif;letter-spacing:.7px}
        .rule{height:2px;margin:9px 0;background:linear-gradient(90deg,transparent,#b9954d,transparent)}
        .body{white-space:pre-wrap;overflow-wrap:anywhere;color:#e8f4e5;font:13px/1.45 monospace}
        .footer{margin-top:11px;text-align:center;color:#8fbea0;font:10px monospace}
    </style></head><body>
        <div class="card">
            <div class="title">🎯 NUMBER GUESS</div>
            <div class="rule"></div>
            <div class="body">Attempts: ${attempts}\n\n${feedbackText}</div>
            <div class="footer">QUEEN XAVENA · INTERACTIVE</div>
        </div>
    </body></html>`;
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

        const html = buildGameHTML(0, 'Make your first guess!');
        
        const buttons = [
            { text: 'Guess 10', id: 'ng_10' },
            { text: 'Guess 25', id: 'ng_25' },
            { text: 'Guess 40', id: 'ng_40' }
        ];

        await sendInteractiveHTML(sock, chatId, m, html, buttons);
    }
};