import { getBotName, setBotName, getPrefix } from '../../lib/config.js';

export default {
    command: 'setbotname',
    description: 'Change the bot name globally',
    category: 'Owner',
    ownerOnly: true,
    usage: '.setbotname <new name>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const currentName = getBotName();

        if (!args[0]) {
            return ctx.reply(`⚙️ *Set Bot Name*\n\nCurrent Name: *${currentName}*\n\nUsage: \`${prefix}setbotname <new name>\`\nExample: \`${prefix}setbotname Xavena AI\``);
        }

        // Join all args in case the name has spaces (e.g., "Queen Xavena Bot")
        const newName = args.join(' ');

        if (newName.length > 30) {
            return ctx.reply(`❌ *Error*\n\nName is too long (max 30 characters).`);
        }

        if (newName === currentName) {
            return ctx.reply(`ℹ️ The bot name is already *${newName}*.`);
        }

        // Save to config
        setBotName(newName);

        return ctx.reply(`✅ *Bot Name Updated*\n\nOld: *${currentName}*\nNew: *${newName}*`);
    }
};