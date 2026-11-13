import axios from 'axios';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { getPrefix } from '../../lib/config.js';

const execPromise = util.promisify(exec);

export default {
    command: 'update',
    description: 'Download the latest code from GitHub and restart',
    category: 'Owner',
    ownerOnly: true,
    usage: 'update',

    async execute(sock, m, args, ctx) {
        // 👇 REPLACE WITH YOUR ACTUAL GITHUB ZIP URL
        const repoZipUrl = 'https://github.com/quantix-tech/Queen-Xavena-Bot/archive/refs/heads/main.zip'; 

        await ctx.reply(`🔄 *Updating...*\n\nDownloading latest ZIP from GitHub. Please wait...`);

        try {
            // 1. Download the ZIP
            const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
            const zipBuffer = Buffer.from(response.data);
            const zip = new AdmZip(zipBuffer);

            // 2. Extract files
            const extractPath = process.cwd();
            let extractedCount = 0;
            
            zip.getEntries().forEach(entry => {
                const entryPath = entry.entryName.split('/').slice(1).join('/');
                if (entry.isDirectory || !entryPath) return;

                const fullPath = path.join(extractPath, entryPath);
                
                // SAFETY: Don't overwrite database, session, or .env files
                if (fullPath.includes('/database/') || 
                    fullPath.includes('/session/') || 
                    fullPath.endsWith('.env')) {
                    return;
                }

                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, entry.getData());
                extractedCount++;
            });


            // 3. Run npm install to grab any new packages
            try {
                await execPromise('npm install', { cwd: extractPath });
            } catch (npmErr) {
                console.error('NPM Install error:', npmErr);
                // We don't stop the update if npm install fails, just log it
            }

            // 4. Create a restart flag
            const chatJid = m.key.remoteJid;
            fs.writeFileSync(path.join(extractPath, 'restart.txt'), chatJid);

            await ctx.reply(`✅ *Update Complete!*\n\nDependencies installed.\n🔄 *Restarting bot...*`);

            setTimeout(() => {
                process.exit(0); // Pterodactyl will restart the bot
            }, 3000);

        } catch (err) {
            console.error('Update error:', err);
            await ctx.reply(`❌ *Update Failed*\n\nCould not download the ZIP.\n_Error: ${err.message}_`);
        }
    }
};