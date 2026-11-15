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

    try {
        // Map commands that don't exist on waifu.pics to the closest alternative
        let apiEndpoint = command;
        if (command === 'kick' || command === 'kill') apiEndpoint = 'bonk'; 

        const res = await axios.get(`https://api.waifu.pics/sfw/${apiEndpoint}`, { timeout: 10000 });
        const gifUrl = res.data.url;

        const gifBuffer = await axios.get(gifUrl, { responseType: 'arraybuffer', timeout: 15000 }).then(r => r.data);

        await sock.sendMessage(m.key.remoteJid, {
            video: Buffer.from(gifBuffer),
            gifPlayback: true,
            caption: text,
            mentions: mentions
        }, { quoted: m });

    } catch (err) {
        console.error(`${command} error:`, err.message);
        await ctx.reply(`❌ Failed to fetch the ${command} GIF. Try again later.`);
    }
}