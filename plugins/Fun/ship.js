import { getPrefix } from '../../lib/config.js';
import { getRealJid, getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'ship',
    description: 'Calculate the love compatibility between two users',
    category: 'Fun',
    ownerOnly: false,
    usage: 'ship @user1 @user2 OR ship @user',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const isGroup = m.key.remoteJid.endsWith('@g.us');
        
        let user1 = m.pushName || 'User 1';
        let user2 = 'User 2';
        let mentions = [];

        // Try to get mentioned users
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentioned.length >= 2) {
            // Shipped two people
            user1 = await getRealJid(mentioned[0], sock);
            user2 = await getRealJid(mentioned[1], sock);
            mentions = [mentioned[0], mentioned[1]];
        } else if (mentioned.length === 1) {
            // Shipped sender and one person
            user1 = await getRealJid(m.key.participant || m.key.remoteJid, sock);
            user2 = await getRealJid(mentioned[0], sock);
            mentions = [m.key.participant || m.key.remoteJid, mentioned[0]];
        } else if (args.length >= 2) {
            // Shipped two names provided as text
            user1 = args[0];
            user2 = args.slice(1).join(' ');
        } else {
            return ctx.reply(`💖 *Ship*\n\nUsage:\n1. \`${prefix}ship @user1 @user2\`\n2. \`${prefix}ship @user\` (ships you with them)\n3. \`${prefix}ship Name1 + Name2\``);
        }

        // Try to get push names if it's a group
        if (isGroup && mentions.length > 0) {
            try {
                const metadata = await getGroupMetadata(sock, m.key.remoteJid);
                const getPushName = (jid) => {
                    const p = metadata.participants.find(x => x.id === jid || x.phoneNumber === jid);
                    return p?.notify || p?.name || jid.split('@')[0];
                };
                if (mentioned.length >= 2) {
                    user1 = getPushName(mentioned[0]);
                    user2 = getPushName(mentioned[1]);
                } else if (mentioned.length === 1) {
                    user1 = m.pushName || 'You';
                    user2 = getPushName(mentioned[0]);
                }
            } catch (e) {}
        }

        // Calculate random love percentage
        const percent = Math.floor(Math.random() * 101);

        // Create progress bar
        const filled = Math.floor(percent / 10);
        const empty = 10 - filled;
        const bar = '❤️'.repeat(filled) + '🖤'.repeat(empty);

        // Pick verdict
        let verdict = '';
        if (percent >= 90) verdict = 'Soulmates! 💍🔥';
        else if (percent >= 75) verdict = 'Perfect match! 💖';
        else if (percent >= 50) verdict = 'There is potential! 🌹';
        else if (percent >= 30) verdict = 'Just friends. 😐';
        else if (percent >= 10) verdict = 'Friendzone material. 🧊';
        else verdict = 'Run away! 🚩🏃‍♂️';

        const text = `💖 *Love Calculator*\n\n👤 *${user1}*\n❤️ + ❤️\n👤 *${user2}*\n\n[${bar}] *${percent}%*\n\n_${verdict}_`;

        await sock.sendMessage(m.key.remoteJid, { 
            text: text,
            mentions: mentions
        }, { quoted: m });
    }
};