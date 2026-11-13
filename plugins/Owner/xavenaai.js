import { getNlpMode, setNlpMode, getPrefix, getBotName } from '../../lib/config.js';

export default {
    command: 'xavenaai',
    description: 'Toggle Natural Language command execution',
    category: 'Owner',
    ownerOnly: true,
    usage: 'xavenaai <on/off>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const botName = "xavena";
        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            setNlpMode(true);
            return ctx.reply(`✅ *QUEEN XAVENA NLP Enabled*\n\nUsers can now run commands by mentioning my name.\nExample: "${botName} lock the group"`);
        }

        if (action === 'off') {
            setNlpMode(false);
            return ctx.reply(`❌ *QUEEN XAVENA NLP Disabled*\n\nI will only understand strict commands now.`);
        }

        const status = getNlpMode() ? '✅ ON' : '❌ OFF';
        return ctx.reply(`🧠 *QUEEN XAVENA NLP Mode*\n\n*Status:* ${status}\n\n*Usage:*\n\`${prefix}xavenaai on\`\n\`${prefix}xavenaai off\``);
    }
};