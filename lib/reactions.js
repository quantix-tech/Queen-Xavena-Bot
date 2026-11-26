import axios from 'axios';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export async function sendReaction(sock, m, ctx, action, verb) {
    const chatId = m.key.remoteJid;

    // Get target from reply, mention, or args
    let target = null;
    let targetName = null;

    const contextInfo = m.message?.extendedTextMessage?.contextInfo;
    if (contextInfo?.participant) {
        target = contextInfo.participant;
    } else if (contextInfo?.mentionedJid?.length) {
        target = contextInfo.mentionedJid[0];
    } else if (args.length > 0) {
        targetName = args.join(' ');
    }

    if (!target && !targetName) {
        return await sock.sendMessage(chatId, {
            text: `Please mention someone or reply to their message.\nExample: *${ctx.prefix}slap @user*`
        }, { quoted: m });
    }

    try {
        const { data } = await axios.get(`https://waifu.pics/api/sfw/${action}`);
        const res = await axios.get(data.url, { responseType: 'arraybuffer' });

        const sticker = new Sticker(Buffer.from(res.data), {
            pack: 'Queen Xavena',
            author: 'Lord Xaven',
            type: StickerTypes.FULL,
            quality: 70,
        });

        const sender = m.pushName || 'Someone';
        const targetDisplay = target ? `@${target.split('@')[0]}` : targetName;
        const mentions = target ? [target, m.key.participant || m.key.remoteJid] : [];

        await sock.sendMessage(chatId, {
            text: `${sender} ${verb} ${targetDisplay}`,
            mentions
        }, { quoted: m });

        await sock.sendMessage(chatId, {
            sticker: await sticker.toBuffer()
        }, { quoted: m });

    } catch (e) {
        console.error(`[${action}]`, e.message);
        await sock.sendMessage(chatId, { text: "Action failed, please try again." }, { quoted: m });
    }
}