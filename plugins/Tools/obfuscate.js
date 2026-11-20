import JavaScriptObfuscator from 'javascript-obfuscator';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'obfuscate',
    aliases: ['obf', 'encryptjs'],
    description: 'Obfuscate JavaScript code and send as a file',
    category: 'Tools',
    ownerOnly: false,
    usage: 'obfuscate <javascript_code>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const code = args.join(' ');

        if (!code) {
            return ctx.reply(`🛡️ *JS Obfuscator*\n\nUsage: \`${prefix}obfuscate <code>\`\nExample: \`${prefix}obfuscate console.log("Hello");\``);
        }

        await ctx.reply('⏳ _Obfuscating code..._');

        try {
            const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                debugProtection: false,
                disableConsoleOutput: false,
                identifierNamesGenerator: 'hexadecimal',
                selfDefending: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75
            });

            const obfuscatedCode = obfuscationResult.getObfuscatedCode();

            // Create a buffer from the obfuscated string
            const buffer = Buffer.from(obfuscatedCode, 'utf-8');
            
            // Generate a random file name
            const fileName = `obfuscated_${Date.now()}.js`;

            // Send as a document
            await sock.sendMessage(m.key.remoteJid, {
                document: buffer,
                fileName: fileName,
                mimetype: 'application/javascript',
                caption: `🛡️ *Obfuscated JavaScript*\n\n📦 *Size:* ${(buffer.length / 1024).toFixed(2)} KB\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (err) {
            console.error('Obfuscate error:', err);
            await ctx.reply(`❌ *Error:* Failed to obfuscate the code.\n_Note: Make sure the JavaScript syntax is correct._`);
        }
    }
};