import { getPrefix, setPrefix } from '../../lib/config.js';

export default {
    command: 'setprefix',
    description: 'Change the bot command prefix',
    category: 'Owner',
    ownerOnly: true,
    usage: '.setprefix <new_prefix>',

    async execute(sock, m, args, ctx) {
        const currentPrefix = getPrefix();
        const displayCurrent = currentPrefix === '' ? '_(none)_' : `*${currentPrefix}*`;

        if (!args[0]) {
            return ctx.reply(`⚙️ *Set Prefix*\n\nCurrent prefix: ${displayCurrent}\n\nUsage:\n\`${currentPrefix || '.'}setprefix <new>\`\n\`${currentPrefix || '.'}setprefix none\`\n\n_Note: You cannot use spaces._`);
        }

        let newPrefix = args[0];

        // Handle removing the prefix completely
        if (newPrefix.toLowerCase() === 'none') {
            newPrefix = '';
        }

        if (newPrefix.length > 2) {
            return ctx.reply(`❌ *Error*\n\nPrefix must be 1 or 2 characters long.`);
        }

        if (newPrefix === currentPrefix) {
            return ctx.reply(`ℹ️ The prefix is already ${displayCurrent}`);
        }

        setPrefix(newPrefix);

        const displayNew = newPrefix === '' ? '_(none)_' : `*${newPrefix}*`;
        const exampleCmd = newPrefix === '' ? 'ping' : `${newPrefix}ping`;

        return ctx.reply(`✅ *Prefix Updated*\n\nOld: ${displayCurrent}\nNew: ${displayNew}\n\nTry it out: \`${exampleCmd}\``);
    }
};