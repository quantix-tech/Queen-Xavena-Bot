import { sendInteractive } from '../../lib/interactive.js';

export default {
    command: 'mathbtn',
    description: 'Test interactive buttons with a quick math game',
    category: 'Interactive-Games',
    ownerOnly: false,
    usage: 'mathbtn',

    async execute(sock, m, args, ctx) {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const answer = a + b;

        // Generate 3 wrong answers
        const options = new Set([answer]);
        while (options.size < 4) {
            options.add(answer + Math.floor(Math.random() * 10) - 5);
        }
        
        const shuffled = Array.from(options).sort(() => Math.random() - 0.5);

        const buttons = shuffled.map((num, index) => ({
            text: `${num}`,
            id: `mathbtn_${num}`
        }));

        await sendInteractive(
            sock, 
            m.key.remoteJid, 
            m, 
            `🧮 *Quick Math*\n\nWhat is *${a} + ${b}*?\n\nTap the correct answer below!`, 
            buttons
        );
    }
};