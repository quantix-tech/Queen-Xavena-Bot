import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
        let endpoint = command;
        if (command === 'kick') endpoint = 'kick';
        if (command === 'kill') endpoint = 'punch';

        const res = await axios.get(`https://nekos.best/api/v2/${endpoint}`, { 
            timeout: 10000,
            headers: { 'User-Agent': 'QueenXavenaBot/1.0 (https://github.com/Quantix-tech)' }
        });
        
        if (res.data && res.data.results && res.data.results.length > 0) {
            gifUrl = res.data.results[0].url;
        } else {
            throw new Error('No results in Nekos.best response');
        }
        
    } catch (err) {
        console.log(`[reactions] Nekos.best failed for ${command}. Trying fallback...`);

        try {
            const fallbackEndpoint = (command === 'kick' || command === 'kill') ? 'bonk' : command;
            const res = await axios.get(`https://purrbot.site/api/img/sfw/${fallbackEndpoint}/gif`, { 
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            gifUrl = res.data.link;
        } catch (fallbackErr) {
            console.error(`[reactions] Both APIs failed for ${command}:`, fallbackErr.message);
            return ctx.reply(`❌ Failed to fetch the ${command} GIF. All APIs are currently down.`);
        }
    }

    console.log(`[reactions] ${command} gifUrl:`, gifUrl);

    // ─── DOWNLOAD AND SEND - FIXED WITH FALLBACKS ───
    try {
        // FALLBACK 1: Try direct URL send first - Baileys/WhatsApp handles conversion
        // This works for slap even when CDN blocks axios download
        try {
            await sock.sendMessage(m.key.remoteJid, {
                video: { url: gifUrl },
                gifPlayback: true,
                caption: text,
                mentions: mentions
            }, { quoted: m });
            console.log(`[reactions] ${command} sent via URL`);
            return;
        } catch (urlErr) {
            console.log(`[reactions] URL send failed for ${command}:`, urlErr.message, '- trying download + convert');
        }

        // FALLBACK 2: Download + ffmpeg convert to MP4
        const gifRes = await axios.get(gifUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*;q=0.8',
                'Referer': 'https://nekos.best/'
            },
            validateStatus: (status) => status >= 200 && status < 400
        });

        const gifBuffer = Buffer.from(gifRes.data);
        console.log(`[reactions] ${command} downloaded ${gifBuffer.length} bytes`);
        if (!gifBuffer || gifBuffer.length < 1000) throw new Error('Empty gif buffer');

        const tmpDir = os.tmpdir();
        const gifPath = path.join(tmpDir, `reaction_${Date.now()}.gif`);
        const mp4Path = path.join(tmpDir, `reaction_${Date.now()}.mp4`);
        fs.writeFileSync(gifPath, gifBuffer);

        try {
            await execAsync(`ffmpeg -y -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${mp4Path}"`);
            const mp4Buffer = fs.readFileSync(mp4Path);
            await sock.sendMessage(m.key.remoteJid, {
                video: mp4Buffer,
                gifPlayback: true,
                mimetype: 'video/mp4',
                caption: text,
                mentions: mentions
            }, { quoted: m });
            console.log(`[reactions] ${command} sent via MP4`);
            try { fs.unlinkSync(gifPath); fs.unlinkSync(mp4Path); } catch {}
            return;
        } catch (ffmpegErr) {
            console.log(`[reactions] ffmpeg failed for ${command}:`, ffmpegErr.message);
            // FALLBACK 3: Send raw GIF as image
            await sock.sendMessage(m.key.remoteJid, {
                image: gifBuffer,
                mimetype: 'image/gif',
                caption: text,
                mentions: mentions
            }, { quoted: m });
            try { fs.unlinkSync(gifPath); } catch {}
            return;
        }

    } catch (err) {
        console.error(`[reactions] ${command} FINAL error:`, err.message);
        console.error(err.stack);
        await ctx.reply(`❌ Failed to download the ${command} GIF.`);
    }
}