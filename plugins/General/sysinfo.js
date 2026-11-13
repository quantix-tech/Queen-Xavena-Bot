import os from 'os';
import { getBotName } from '../../lib/config.js';

export default {
    command: 'sysinfo',
    description: 'Show detailed system and server statistics',
    category: 'General',
    ownerOnly: false,
    usage: 'sysinfo',

    async execute(sock, message, args, ctx) {
        // Get CPU info
        const cpus = os.cpus();
        const cpuModel = cpus[0]?.model || 'Unknown CPU';
        const cpuCores = cpus.length;

        // Get RAM info
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        const formatMB = (bytes) => (bytes / 1024 / 1024).toFixed(1);
        const formatGB = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);

        // Get Uptime
        const uptime = process.uptime();
        const hrs = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const secs = Math.floor(uptime % 60);

        // Get Bot Name dynamically
        const botName = getBotName();

        let text = `┌─〔 💻 SYSTEM INFO 〕\n`;
        text += `├◆ *Bot Name* : ${botName}\n`;
        text += `├◆ *Node.js* : ${process.version}\n`;
        text += `├◆ *Platform* : ${os.platform()} (${os.arch()})\n`;
        text += `├◆ *Hostname* : ${os.hostname()}\n`;
        text += `└─────────────◆\n\n`;

        text += `┌─〔 ⚙️ HARDWARE 〕\n`;
        text += `├◆ *CPU* : ${cpuModel}\n`;
        text += `├◆ *Cores* : ${cpuCores}\n`;
        text += `├◆ *RAM Usage* : ${formatMB(usedMem)} MB / ${formatMB(totalMem)} MB\n`;
        text += `├◆ *Total RAM* : ${formatGB(totalMem)} GB\n`;
        text += `└─────────────◆\n\n`;

        text += `┌─〔 ⏱️ RUNTIME 〕\n`;
        text += `├◆ *Uptime* : ${hrs}h ${mins}m ${secs}s\n`;
        text += `└─────────────◆`;

        await ctx.reply(text);
    }
};