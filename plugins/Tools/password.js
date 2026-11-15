import crypto from 'crypto';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'password',
    aliases: ['genpass'],
    description: 'Generate a strong random password',
    category: 'Tools',
    ownerOnly: false,
    usage: 'password <length>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const length = parseInt(args[0]) || 16;

        if (length < 6 || length > 50) {
            return ctx.reply(`🔐 *Password Generator*\n\nUsage: \`${prefix}password <length>\`\n_Note: Length must be between 6 and 50._`);
        }

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
        let password = '';
        
        // Use crypto for cryptographically secure randomness
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            password += chars[bytes[i] % chars.length];
        }

        await ctx.reply(`🔐 *Generated Password*\n\n\`\`\`\n${password}\n\`\`\`\n\n_Length: ${length} characters_`);
    }
};