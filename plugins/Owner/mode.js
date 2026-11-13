import { getMode, setMode } from '../../lib/config.js';

export default {
    command: 'mode',
    description: 'Switch bot mode (private | public)',
    category: 'Owner',
    ownerOnly: true,
    usage: '.mode <private|public>',

    async execute(sock, m, args, ctx) {
        // If no argument is provided, show the current mode
        if (!args[0]) {
            const currentMode = getMode();
            return ctx.reply(`🔧 *Bot Mode*\n\nCurrent: *${currentMode}*\n\nUsage:\n\`.mode private\` - Only owner & sudos\n\`.mode public\` - Everyone can use`);
        }

        const newMode = args[0].toLowerCase();

        // Attempt to set the mode
        const result = setMode(newMode);

        if (!result.ok) {
            return ctx.reply(`❌ *Error:* ${result.reason}`);
        }

        // Reply with success
        return ctx.reply(`✅ *Mode Changed*\n\nBot is now in *${result.mode.toUpperCase()}* mode.\n\n${result.mode === 'private' ? '🔒 Only you (and sudos) can use commands.' : '🌍 Everyone can use commands.'}`);
    }
};