import { getPrefix } from '../../lib/config.js';

export default {
    command: 'base64',
    description: 'Encode or decode text in Base64',
    category: 'Tools',
    ownerOnly: false,
    usage: 'base64 <encode/decode> <text>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();
        const text = args.slice(1).join(' ');

        if (!action || !text || !['encode', 'decode'].includes(action)) {
            return ctx.reply(`🔤 *Base64 Tool*\n\nUsage:\n\`${prefix}base64 encode <text>\`\n\`${prefix}base64 decode <base64>\``);
        }

        try {
            let result = '';
            if (action === 'encode') {
                result = Buffer.from(text).toString('base64');
            } else {
                result = Buffer.from(text, 'base64').toString('utf-8');
                // Simple check to see if decoding produced garbage (invalid base64)
                if (result.includes('\uFFFD')) throw new Error('Invalid Base64 string');
            }

            await ctx.reply(`🔤 *Base64 ${action === 'encode' ? 'Encoded' : 'Decoded'}*\n\n*Input:* ${text}\n*Output:*\n\`\`\`\n${result}\n\`\`\``);
        } catch (err) {
            await ctx.reply(`❌ *Error:* Could not ${action} that string.`);
        }
    }
};