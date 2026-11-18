import axios from 'axios';

export async function sendReaction(sock, m, ctx, command, pastVerb) {
    const senderName = m.pushName || 'Someone';
    const senderId = m.key.participant || m.key.remoteJid;
    const mentions = [senderId];

    let targetName = null;
    let targetId = null;

    // Check if they tagged someone or replied to someone
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        targetName = `@${targetId.split('@')[0]}`;
    } else if (ctx.quoted) {
        targetId = ctx.quoted.sender || ctx.quoted.key.participant;
        targetName = `@${targetId.split('@')[0]}`;
    }

    if (targetId) mentions.push(targetId);

    // Format the message
    const text = targetId 
        ? `*${senderName}* ${pastVerb} *${targetName}*`
        : `*${senderName}* did a ${command}`;

    let gifUrl = null;

    try {
        // ─── ATTEMPT 1: waifu.pics ───
        // Map kick/kill to bonk since waifu.pics doesn't have them
        const apiEndpoint = (command === 'kick' || command === 'kill') ? 'bonk' : command;
        
        const res = await axios.get(`https://api.waifu.pics/sfw/${apiEndpoint}`, { 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } // 👈 Fixes the block
        });
        
        gifUrl = res.data.url;
        
    } catch (err) {
        console.log(`[reactions] waifu.pics failed for ${command}. Trying fallback...`);
        
        // ─── ATTEMPT 2: purrbot.site (Fallback) ───
        try {
            const fallbackEndpoint = (command === 'kick' || command === 'kill') ? 'bonk' : command;
            const res = await axios.get(`https://purrbot.site/api/img/sfw/${fallbackEndpoint}/gif`, { 
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            
            gifUrl = res.data.link;
        } catch (fallbackErr) {
            console.error(`[reactions] Both APIs failed for ${command}:`, fallbackErr.message);
            return ctx.reply(`❌ Failed to fetch the ${command} GIF. All APIs are currently down.`);
        }
    }

    // ─── DOWNLOAD AND SEND ───
    try {
        const gifBuffer = await axios.get(gifUrl, { 
            responseType: 'arraybuffer', 
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }).then(r => r.data);

        await sock.sendMessage(m.key.remoteJid, {
            video: Buffer.from(gifBuffer),
            gifPlayback: true,
            caption: text,
            mentions: mentions
        }, { quoted: m });

    } catch (err) {
        console.error(`${command} download error:`, err.message);
        await ctx.reply(`❌ Failed to download the ${command} GIF.`);
    }
}