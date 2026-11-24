import os from 'os';
import { getMode, getPrefix, getBotName, getMenuImage } from '../../lib/config.js';
import { isOwner, getRealJid, extractRawId } from '../../lib/utils.js';
import { getGroupedPlugins } from '../../lib/loader.js';

let listenerAdded = false;

function unwrapMsg(msg) {
    if (!msg) return null;
    let cur = msg;
    for (let i = 0; i < 5; i++) {
        if (cur.ephemeralMessage?.message) cur = cur.ephemeralMessage.message;
        else if (cur.viewOnceMessage?.message) cur = cur.viewOnceMessage.message;
        else if (cur.viewOnceMessageV2?.message) cur = cur.viewOnceMessageV2.message;
        else if (cur.viewOnceMessageV2Extension?.message) cur = cur.viewOnceMessageV2Extension.message;
        else if (cur.documentWithCaptionMessage?.message) cur = cur.documentWithCaptionMessage.message;
        else break;
    }
    return cur;
}

function parseButtonTap(msg) {
    const raw = unwrapMsg(msg);
    if (!raw) return null;
    try {
        if (raw.interactiveResponseMessage) {
            const paramsJson = raw.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
            if (paramsJson) {
                const params = JSON.parse(paramsJson);
                if (params.id) return params.id;
            }
            if (raw.interactiveResponseMessage.body?.text) return raw.interactiveResponseMessage.body.text;
        }
        if (raw.buttonsResponseMessage?.selectedButtonId) return raw.buttonsResponseMessage.selectedButtonId;
        if (raw.listResponseMessage?.singleSelectReply?.selectedRowId) return raw.listResponseMessage.singleSelectReply.selectedRowId;
        if (raw.templateButtonReplyMessage?.selectedId) return raw.templateButtonReplyMessage.selectedId;
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

        if (!listenerAdded) {
            listenerAdded = true;
            sock.ev.on('messages.upsert', async ({ messages }) => {
                for (const msg of messages) {
                    if (!msg.message || msg.key.fromMe) continue;
                    const raw = unwrapMsg(msg.message);
                    // 👇 DEBUG - check your terminal after tapping a button
                    console.log('[MENU2 TAP] type:', Object.keys(raw || {}), 'tap:', parseButtonTap(msg.message));

                    const tap = parseButtonTap(msg.message);
                    if (!tap) continue;

                    const currentPrefix = getPrefix();
                    let cmdName = '';
                    if (currentPrefix && currentPrefix !== '') {
                        if (!tap.startsWith(currentPrefix)) continue;
                        cmdName = tap.slice(currentPrefix.length).split(' ')[0].toLowerCase();
                    } else {
                        cmdName = tap.split(' ')[0].toLowerCase();
                    }

                    console.log('[MENU2 TAP] running command:', cmdName);
                    const plugin = ctx.pluginMap.get(cmdName);
                    if (!plugin) {
                        console.log('[MENU2 TAP] plugin NOT FOUND for:', cmdName, 'available:', [...ctx.pluginMap.keys()].slice(0,10));
                        continue;
                    }

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
            try {
                await sock.sendMessage(chatJid, {
                    image: { url: menuImageUrl },
                    caption: text,
                    footer: 'QX-CORE • Interactive',
                    mentions,
                    buttons: [
                        { buttonId: `${prefix}ping`, buttonText: { displayText: '🏓 Ping' }, type: 1 },
                        { buttonId: `${prefix}runtime`, buttonText: { displayText: '⏱️ Runtime' }, type: 1 },
                        { buttonId: `${prefix}menu`, buttonText: { displayText: '📋 Menu' }, type: 1 },
                    ],
                    headerType: 4,
                }, { quoted: m });
            } catch (err) {
                console.error('❌ Menu2 buttons failed:', err.message);
                await sock.sendMessage(chatJid, { text: text + `\n\nTap: ${prefix}ping | ${prefix}runtime | ${prefix}menu`, mentions }, { quoted: m });
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