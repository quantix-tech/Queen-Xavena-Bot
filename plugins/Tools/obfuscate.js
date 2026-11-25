import JavaScriptObfuscator from 'javascript-obfuscator';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'obfuscate',
    aliases: ['obf', 'encryptjs'],
    description: 'Obfuscate JavaScript code (supports replying to messages/files)',
    category: 'Tools',
    ownerOnly: false,
    usage: 'obfuscate <code> OR reply to a code file/message',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        let code = args.join(' ');

        // 1. Check if they replied to a message to get the code
        if (ctx.quoted) {
            if (ctx.quoted.text) {
                code = ctx.quoted.text;
            } else if (ctx.quoted.type === 'documentMessage') {
                // If they replied to a .js file, download it
                const media = await ctx.getMedia();
                if (media && media.buffer) {
                    code = media.buffer.toString('utf-8');
                }
            }
        }

        if (!code) {
            return ctx.reply(`🛡️ *JS Obfuscator*\n\nUsage:\n1. \`${prefix}obfuscate <code>\`\n2. Reply to a text message with \`${prefix}obfuscate\`\n3. Reply to a .js/.txt file with \`${prefix}obfuscate\``);
        }

        await ctx.reply('⏳ _Obfuscating code... (This may take a moment for large files)_');

        try {
            // 2. Obfuscate the code
            const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: false,
                disableConsoleOutput: false,
                identifierNamesGenerator: 'hexadecimal',
                selfDefending: false, // Turned off: Causes issues with very large files
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75,
                renameGlobals: false,
                unicodeEscapeSequence: false
            });

            const obfuscatedCode = obfuscationResult.getObfuscatedCode();
            const buffer = Buffer.from(obfuscatedCode, 'utf-8');

            // Generate a random file name based on the current time
            const fileName = `obfuscated_${Date.now()}.js`;

            // 3. Send the file back
            await sock.sendMessage(m.key.remoteJid, {
                document: buffer,
                fileName: fileName,
                mimetype: 'application/javascript',
                caption: `🛡️ *Obfuscated JavaScript*\n\n📦 *Original Size:* ${(Buffer.from(code).length / 1024).toFixed(2)} KB\n📦 *Obfuscated Size:* ${(buffer.length / 1024).toFixed(2)} KB\n\n> Powered by Queen Xavena`
            }, { quoted: m });

        } catch (err) {
            console.error('Obfuscate error:', err);
            
            // Catch common syntax errors
            if (err.message.includes('SyntaxError') || err.name === 'SyntaxError') {
                return ctx.reply(`❌ *Syntax Error:* The JavaScript code has a syntax error and cannot be obfuscated.`);
            }
            
            await ctx.reply(`❌ *Error:* Failed to obfuscate the code.\n_${err.message}_`);
        }
    }
};