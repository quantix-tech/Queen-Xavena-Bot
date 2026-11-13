import { getBotName } from '../../lib/config.js';

export default {
    command: 'owner',
    description: 'Get the bot owner contact',
    category: 'General',
    ownerOnly: false,
    usage: '.owner',

    async execute(sock, m, args, ctx) {
        // Hardcoded owner number
        const ownerNumber = '2349120298288';
        
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:Lord Xaven\nTEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\nEND:VCARD`;

        // Send contact card
        await sock.sendMessage(m.key.remoteJid, {
            contacts: {
                displayName: `👑 ${getBotName} Owner`,
                contacts: [{ vcard }]
            }
        }, { quoted: m });

    }
};