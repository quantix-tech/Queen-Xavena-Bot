import { addBan } from '../../handlers/bans.js';
import { getRealJid } from '../../lib/utils.js';

export default {
    command: 'ban',
    description: 'Ban a user from using the bot',
    category: 'Owner',
    ownerOnly: true,
    usage: '.ban @user / reply',

    async execute(sock, m, args, ctx) {
        let targetJid = null;

        // 1. Check if they mentioned someone
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // 2. Check if they replied to someone (Works in Groups and DMs)
        else if (ctx.quoted && ctx.quoted.sender) {
            // ctx.quoted.sender is ALREADY resolved to the real phone number!
            targetJid = ctx.quoted.sender;
        } 
        // 3. Check if they typed a number
        else if (args[0]) {
            targetJid = args[0].replace(/[^0-9]/g, '');
        }

        if (!targetJid) {
            return ctx.reply('❌ *Ban*\n\nTag a user, reply to their message, or provide a number.');
        }

        // Resolve target's real number (if it's already a number, it stays the same)
        const realNumber = await getRealJid(targetJid, sock);
        
        if (!realNumber) {
            return ctx.reply('❌ Could not resolve the user\'s phone number.');
        }

        // Get YOUR real number
        const senderNumber = ctx.sender; 

        // Prevent self-ban
        if (realNumber === senderNumber) {
            return ctx.reply('❌ You cannot ban yourself.');
        }

        // Add to ban list
        const success = addBan(realNumber);

        if (success) {
            await ctx.reply(`⛔ *Banned*\n\n+${realNumber} has been banned from using the bot.`);
        } else {
            await ctx.reply(`ℹ️ *Notice*\n\n+${realNumber} is already banned.`);
        }
    }
};