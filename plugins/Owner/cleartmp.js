import fs from 'fs';
import path from 'path';

export default {
    command: 'cleartmp',
    description: 'Delete all temporary files',
    category: 'Owner',
    ownerOnly: true,
    usage: '.cleartmp',
    async execute(sock, m, args, ctx) {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) return ctx.reply('📭 *Tmp Folder*\n\nNo temporary folder exists yet.');
        
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
            fs.mkdirSync(tmpDir);
            await ctx.reply('✅ *Tmp Cleared*\n\nAll temporary files have been deleted.');
        } catch (err) {
            await ctx.reply(`❌ *Error:*\n${err.message}`);
        }
    }
};