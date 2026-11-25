import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDirectorySize, formatBytes, cleanTempFolders } from '../../lib/system.js';
import { getPrefix } from '../../lib/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    command: 'disk',
    aliases: ['storage', 'space', 'df'],
    description: 'Check server disk space and clean temp files',
    category: 'Owner',
    ownerOnly: true,
    usage: 'disk [clean]',

    async execute(sock, m, args, ctx) {
        const action = args[0]?.toLowerCase();
        const prefix = getPrefix();

        // ─── CLEAN ACTION ───
        if (action === 'clean') {
            await ctx.react('🧹');
            const { clearedBytes, clearedCount } = cleanTempFolders();
            
            return ctx.reply(`🧹 *Cleanup Complete*\n\n` +
                `Deleted: *${clearedCount}* files/folders\n` +
                `Freed: *${formatBytes(clearedBytes)}*\n\n` +
                `_Note: If you are still out of space, check your session folder or logs._`);
        }

        // ─── INFO ACTION ───
        // Note: Node doesn't have a built-in way to get actual disk total/free.
        // We can only measure the size of specific folders.
        
        const sessionSize = getDirectorySize(path.join(__dirname, '..', '..', 'session'));
        const dbSize = getDirectorySize(path.join(__dirname, '..', '..', 'database'));
        const tmpSize = getDirectorySize(path.join(__dirname, '..', '..', 'tmp'));
        const pluginsSize = getDirectorySize(path.join(__dirname, '..', '..', 'plugins'));

        let text = `💾 *Server Storage Info*\n\n`;
        
        text += `📂 *Folder Sizes:*\n`;
        text += `├◆ Session: ${formatBytes(sessionSize)}\n`;
        text += `├◆ Database: ${formatBytes(dbSize)}\n`;
        text += `├◆ Plugins: ${formatBytes(pluginsSize)}\n`;
        text += `├◆ Temp/Cache: ${formatBytes(tmpSize)}\n`;
        text += `└─────────────◆\n\n`;

        text += `🧠 *System Memory:*\n`;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        text += `├◆ Total: ${formatBytes(totalMem)}\n`;
        text += `├◆ Free: ${formatBytes(freeMem)}\n`;
        text += `└─────────────◆\n\n`;

        text += `💡 *Tip:* Use \`${prefix}disk clean\` to free up space from temp files.`;

        await ctx.reply(text);
    }
};