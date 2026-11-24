import os from 'os';
import { getMode, getPrefix, getBotName, getMenuImage } from '../../lib/config.js';
import { isOwner, getRealJid, extractRawId } from '../../lib/utils.js';
import { getGroupedPlugins } from '../../lib/loader.js';

// 👇 Only register this listener once per bot run
let listenerAdded = false;

function parseButtonTap(msg) {
    try {
        if (msg?.interactiveResponseMessage) {
            const paramsJson = msg.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
            if (paramsJson) {
                const params = JSON.parse(paramsJson);
                if (params.id) return params.id;
            }
            if (msg.interactiveResponseMessage.body?.text) return msg.interactiveResponseMessage.body.text;
        }
        if (msg?.buttonsResponseMessage?.selectedButtonId) return msg.buttonsResponseMessage.selectedButtonId;
        if (msg?.listResponseMessage?.singleSelectReply?.selectedRowId) return msg.listResponseMessage.singleSelectReply.selectedRowId;
    } catch {}
    return null;
}

export default {
    command: 'menu2',
    aliases: ['help2', 'list2'],
    description: 'Show bot menu with interactive buttons',
    category: 'General',
    ownerOnly: false,
    usage: 'menu2 [category]',

    async execute(sock, m, args, ctx) {
        const mode = getMode();
        const prefix = getPrefix();
        const grouped = getGroupedPlugins(ctx.pluginMap);
        const chatJid = m.key.remoteJid;
        const menuImageUrl = getMenuImage();

        // 👇 FIX IN MENU2 ONLY: Listen for button taps, don't touch utils.js
        if (!listenerAdded) {
            listenerAdded = true;
            sock.ev.on('messages.upsert', async ({ messages }) => {
                for (const msg of messages) {
                    if (!msg.message || msg.key.fromMe) continue;
                    const tap = parseButtonTap(msg.message);
                    if (!tap) continue;

                    // 👇 Get FRESH prefix every tap - works if you change prefix
                    const currentPrefix = getPrefix();
                    let cmdName = '';

                    if (currentPrefix && currentPrefix !== '') {
                        if (!tap.startsWith(currentPrefix)) continue;
                        cmdName = tap.slice(currentPrefix.length).split(' ')[0].toLowerCase();
                    } else {
                        // No prefix mode - tap is just "ping"
                        cmdName = tap.split(' ')[0].toLowerCase();
                    }

                    const plugin = ctx.pluginMap.get(cmdName);
                    if (!plugin) continue;

                    const fakeCtx = {
                        ...ctx,
                        text: tap,
                        args: [],
                        pluginMap: ctx.pluginMap,
                        reply: (t) => sock.sendMessage(msg.key.remoteJid, { text: t }, { quoted: msg }),
                    };
                    try {
                        await plugin.execute(sock, msg, [], fakeCtx);
                    } catch (e) {
                        console.error('Menu2 button exec error:', e);
                    }
                }
            });
        }

        async function sendMenu(text, mentions = []) {
            // 👇 Buttons built fresh with CURRENT prefix every time
            try {
                await sock.sendMessage(chatJid, {
                    image: { url: menuImageUrl },
                    caption: text,
                    footer: 'QX-CORE • Interactive',
                    mentions,
                    optionText: '👉🏻 Select Options',
                    optionTitle: '📄 Select Options',
                    nativeFlow: [{
                        text: '🏓 Ping',
                        id: `${prefix}ping`,
                        icon: 'review'
                    }, {
                        text: '⏱️ Runtime',
                        id: `${prefix}runtime`,
                        icon: 'default'
                    }, {
                        text: '📋 Menu',
                        id: `${prefix}menu`,
                        icon: 'default'
                    }],
                }, { quoted: m });
            } catch (err) {
                console.error('❌ Menu2 interactive failed, sending text fallback:', err.message);
                await sock.sendMessage(chatJid, { text: text, mentions }, { quoted: m });
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
            if (!targetCategory) return ctx.reply(`❌ Category "*${args[0]}*" not found.`);
            let text = `┌─〔 ✞ ${targetCategory.name.toUpperCase()} (${targetCategory.plugins.length}) 〕\n`;
            for (const p of targetCategory.plugins) {
                text += `├◆ *${prefix}${p.command}*\n`;
            }
            text += `└─────────────◆`;
            return await sendMenu(text);
        }

        const ram = (os.totalmem() - os.freemem()) / (1024 * 1024);
        const timeNow = Date.now();
        const msgTime = m.messageTimestamp ? (m.messageTimestamp * 1000) : timeNow;
        const speed = Math.abs(timeNow - msgTime) || 0;
        const senderJid = m.key.participant || m.key.remoteJid;
        const realNumber = extractRawId(senderJid);
        const senderName = m.pushName || realNumber || 'Unknown';
        const userTag = `@${realNumber}`;
        const role = await isOwner(m, sock) ? 'Owner' : 'User';
        const botName = getBotName();

        let text = `┌─〔 👑 ${botName.toUpperCase()} 〕\n`;
        text += `├◆ *User* : ${userTag}\n`;
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

        await sendMenu(text, [senderJid]);
    }
};