import os from 'os';
import { getMode, getPrefix, getBotName, getMenuImage } from '../../lib/config.js';
import { isOwner } from '../../lib/utils.js';
import { getGroupedPlugins } from '../../lib/loader.js';

export default {
    command: 'menu',
    description: 'Show bot menu and categories',
    category: 'General',
    ownerOnly: false,
    usage: 'menu [category]',

    async execute(sock, m, args, ctx) {
        const mode = getMode();
        const prefix = getPrefix();
        const grouped = getGroupedPlugins(ctx.pluginMap);
        const chatJid = m.key.remoteJid;
        const menuImageUrl = getMenuImage(); 

        async function sendMenu(text) {
            try {
                await sock.sendMessage(chatJid, {
                    image: { url: menuImageUrl },
                    caption: text
                }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(chatJid, { text: text }, { quoted: m });
            }
        }
        
        if (args[0]) {
            const search = args[0].toUpperCase();
            let targetCategory = null;

            for (const [cat, plugins] of grouped.entries()) {
                if (cat.includes(search)) {
                    targetCategory = { name: cat, plugins };
                    break;
                }
            }

            if (!targetCategory) {
                return ctx.reply(`❌ Category "*${args[0]}*" not found.`);
            }

            let text = `┌─〔 ✞ ${targetCategory.name.toUpperCase()} 〕\n`;
            for (const p of targetCategory.plugins) {
                text += `├◆ *${prefix}${p.command}*\n`;
            }
            text += `└─────────────◆`;
            
            return await sendMenu(text);
        }

        // ─── MAIN MENU ───
        const ram = (os.totalmem() - os.freemem()) / (1024 * 1024);
        const timeNow = Date.now();
        const msgTime = m.messageTimestamp ? (m.messageTimestamp * 1000) : timeNow;
        const speed = Math.abs(timeNow - msgTime) || 0;

        // 👇 FIX: Use pushName if available, fallback to number
        const senderName = m.pushName || ctx.sender || 'Unknown';
        const senderJid = `@${senderName}`;
        
        const role = await isOwner(m, sock) ? 'Owner' : 'User';
        const botName = getBotName();

        let text = `┌─〔 👑 ${botName.toUpperCase()} 〕\n`;
        text += `├◆ *User* : ${senderJid}\n`;
        text += `├◆ *Host* : Panel\n`;
        text += `├◆ *Prefix* : ${prefix === '' ? '_(none)_' : prefix}\n`;
        text += `├◆ *Core* : QX-CORE\n`;
        text += `├◆ *Version* : 1.0.0\n`;
        text += `├◆ *Mode* : ${mode}\n`;
        text += `├◆ *Commands* : ${ctx.pluginMap.size}\n`;
        text += `├◆ *Speed* : ${speed} ms\n`;
        text += `├◆ *RAM* : ${ram.toFixed(1)} MB\n`;
        text += `└─────────────◆\n\n`;

        text += `┌─〔 🔍 CATEGORIES 〕\n`;
        for (const [cat, plugins] of grouped.entries()) {
            text += `├◆ *${cat.toUpperCase()}* - ${plugins.length} Command(s)\n`;
        }
        text += `└─────────────◆\n\n`;
        
        text += `┌─〔 💡 TIP 〕\n`;
        text += `├◆ Use *${prefix}menu <category>* to view commands\n`;
        text += `└─────────────◆\n\n`;

        await sendMenu(text);
    }
};
