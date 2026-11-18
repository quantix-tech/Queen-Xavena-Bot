import axios from 'axios';
import sharp from 'sharp'; // 👈 Added for WebP to GIF conversion

export async function sendReaction(sock, m, ctx, command, pastVerb) {
    const senderName = m.pushName || 'Someone';
    const senderId = m.key.participant || m.key.remoteJid;
    const mentions = [senderId];

    let targetName = null;
    let targetId = null;

    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        targetName = `@${targetId.split('@')[0]}`;
    } else if (ctx.quoted) {
        targetId = ctx.quoted.sender || ctx.quoted.key.participant;
        targetName = `@${targetId.split('@')[0]}`;
    }

    if (targetId) mentions.push(targetId);

    const text = targetId 
        ? `*${senderName}* ${pastVerb} *${targetName}*`
        : `*${senderName}* did a ${command}`;

    let mediaBuffer = null;
    let mimetype = 'video/mp4'; // Default for GIFs
    let isGif = true;

    // ─── ATTEMPT 1: PurrBot (Reliable GIFs) ───
    try {
        const endpoint = (command === 'kick' || command === 'kill') ? 'bonk' : command;
        const res = await axios.get(`https://purrbot.site/api/img/sfw/${endpoint}/gif`, { 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' } 
        });
        
        const gifUrl = res.data.link;
        mediaBuffer = await axios.get(gifUrl, { responseType: 'arraybuffer' }).then(r => r.data);
        
    } catch (err) {
        console.log(`[reactions] PurrBot failed for ${command}. Trying Waifu.pics fallback...`);

        // ─── ATTEMPT 2: Waifu.pics (with WebP check) ───
        try {
            const endpoint = (command === 'kick' || command === 'kill') ? 'bonk' : command;
            const res = await axios.get(`https://api.waifu.pics/sfw/${endpoint}`, { 
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            const imgUrl = res.data.url;
            const originalBuffer = await axios.get(imgUrl, { responseType: 'arraybuffer' }).then(r => r.data);

            // Check if the returned file is a WebP sticker
            if (imgUrl.endsWith('.webp')) {
                console.log('[reactions] Received WebP. Converting to animated GIF...');
                // Convert animated WebP to GIF using sharp
                mediaBuffer = await sharp(originalBuffer, { animated: true }).gif().toBuffer();
                mimetype = 'image/gif';
                isGif = false; // We are sending as a document/image, not video
            } else {
                mediaBuffer = originalBuffer;
                mimetype = 'video/mp4';
                isGif = true;
            }
        } catch (fallbackErr) {
            console.error(`[reactions] Both APIs failed for ${command}:`, fallbackErr.message);
            return ctx.reply(`❌ Failed to fetch the ${command} GIF. All APIs are currently down.`);
        }
    }

    // ─── SEND THE MEDIA ───
    try {
        if (isGif) {
            // Send as GIF (video with gifPlayback)
            await sock.sendMessage(m.key.remoteJid, {
                video: Buffer.from(mediaBuffer),
                gifPlayback: true,
                caption: text,
                mentions: mentions
            }, { quoted: m });
        } else {
            // Send as converted GIF (image format) if we had to convert WebP
            await sock.sendMessage(m.key.remoteJid, {
                image: Buffer.from(mediaBuffer),
                caption: text,
                mentions: mentions
            }, { quoted: m });
        }
    } catch (err) {
        console.error(`${command} send error:`, err.message);
        await ctx.reply(`❌ Failed to send the ${command} reaction.`);
    }
}