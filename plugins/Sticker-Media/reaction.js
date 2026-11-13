import axios from 'axios';

const REACTIONS = [
    'cry', 'kill', 'hug', 'pat', 'lick', 'kiss', 'bite', 'yeet', 'bully', 'bonk',
    'wink', 'poke', 'nom', 'slap', 'smile', 'wave', 'awoo', 'blush', 'smug', 
    'glomp', 'happy', 'dance', 'cringe', 'cuddle', 'highfive', 'shinobu', 'handhold'
];

export default {
    command: 'reactions',
    description: 'Send an anime reaction GIF',
    category: 'Sticker',
    ownerOnly: false,
    usage: 'slap / kiss / hug (etc)',

    async execute(sock, m, args, ctx) {
        const command = ctx.text[0] === '.' ? ctx.text.slice(1).trim().split(/\s+/)[0].toLowerCase() : ctx.text.trim().split(/\s+/)[0].toLowerCase();

        if (!REACTIONS.includes(command)) return;

        await ctx.react('⏳');

        // Get the Sender
        const senderTag = ctx.sender ? `@${ctx.sender}` : 'Someone';
        const mentions = [];
        if (ctx.sender) mentions.push(m.key.participant || m.key.remoteJid);

        // Get the Target (if replied or mentioned)
        let targetTag = '';
        let targetJid = null;

        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            targetTag = `@${targetJid.split('@')[0]}`;
        } else if (ctx.quoted && ctx.quoted.sender) {
            targetJid = ctx.quoted.key.participant || ctx.quoted.key.remoteJid || ctx.quoted.sender;
            targetTag = `@${ctx.quoted.sender}`;
        }

        if (targetJid) mentions.push(targetJid);

        try {
            // Fetch GIF from waifu.pics
            const res = await axios.get(`https://api.waifu.pics/sfw/${command}`, { timeout: 10000 });
            const gifUrl = res.data.url;

            // Download GIF as buffer
            const gifBuffer = await axios.get(gifUrl, { responseType: 'arraybuffer' }).then(r => r.data);

            // Create the action text
            let text = '';
            if (targetTag) {
                text = `*${senderTag}* ${command}ed *${targetTag}*`;
            } else {
                text = `*${senderTag}* used ${command}`;
            }

            // Send as GIF (gifPlayback: true makes it loop automatically like a GIF)
            await sock.sendMessage(m.key.remoteJid, {
                video: Buffer.from(gifBuffer),
                gifPlayback: true,
                caption: text,
                mentions: mentions
            }, { quoted: m });

            await ctx.react('✅');

        } catch (err) {
            console.error(`${command} error:`, err);
            await ctx.react('❌');
            await ctx.reply(`❌ Failed to fetch ${command} GIF.\n_Note: Try again later._`);
        }
    }
};

export { REACTIONS };