import { extractRawId } from '../../lib/utils.js';
export default {
    command: 'block',
    description: 'Block a user',
    category: 'Owner',
    ownerOnly: true,
    usage: '.block @user / reply',
    async execute(sock, m, args, ctx) {
        let target = m.message?.extendedTextMessage?.contextInfo?.participant 
                  || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                  || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        
        if (!target) return ctx.reply('❌ Tag a user, reply to them, or provide a number.');
        if (!target.includes('@')) target += '@s.whatsapp.net';

        try {
            await sock.updateBlockStatus(target, 'block');
            await ctx.reply(`✅ *Blocked*\n\n+${target.split('@')[0]} is now blocked.`);
        } catch (err) {
            await ctx.reply(`❌ Failed to block: ${err.message}`);
        }
    }
};