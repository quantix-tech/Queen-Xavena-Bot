import { getStealthMode, setStealthMode, getPrefix } from '../../lib/config.js';

export default {
    command: 'stealth',
    aliases: ['ghost'],
    description: 'Toggle stealth mode (deletes bot commands and replies after 5s)',
    category: 'Owner',
    ownerOnly: true,
    usage: 'stealth <on/off>',

    async execute(sock, m, args, ctx) {
        const action = args[0]?.toLowerCase();
        const prefix = getPrefix();

        if (action === 'on') {
            setStealthMode(true);
            return ctx.reply('👻 *Stealth Mode Enabled*\n\nAll bot commands and replies will now be deleted after 5 seconds.');
        }
        if (action === 'off') {
            setStealthMode(false);
            return ctx.reply('👻 *Stealth Mode Disabled*\n\nBot replies will stay in the chat.');
        }

        const current = getStealthMode() ? 'ON' : 'OFF';
        return ctx.reply(`👻 *Stealth Mode*\n\nStatus: *${current}*\n\nUsage:\n\`${prefix}stealth on\`\n\`${prefix}stealth off\``);
    }
};