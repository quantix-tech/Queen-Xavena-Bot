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
        // ─── ATTEMPT 1: Nekos.best ───
        // Nekos.best uses the same endpoint names as most commands
        // We just need to map "kick" and "kill" to a supported endpoint if they don't exist
        let endpoint = command;
        if (command === 'kick') endpoint = 'kick'; // Nekos.best has kick
        if (command === 'kill') endpoint = 'punch'; // Nekos.best doesn't have "kill", use "punch"

        const res = await axios.get(`https://nekos.best/api/v2/${endpoint}`, { 
            timeout: 10000,
            headers: { 'User-Agent': 'QueenXavenaBot/1.0 (https://github.com/Quantix-tech)' } // Required by Nekos.best
        });
        
        // Extract URL from the results array
        if (res.data && res.data.results && res.data.results.length > 0) {
            gifUrl = res.data.results[0].url;
        } else {
            throw new Error('No results in Nekos.best response');
        }
        
    } catch (err) {
        console.log(`[reactions] Nekos.best failed for ${command}. Trying fallback...`);

        // ─── ATTEMPT 2: PurrBot (Fallback) ───
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

    // ─── DOWNLOAD AND SEND - FIXED FOR PLAYBACK ───
    try {
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
        if (!gifBuffer || gifBuffer.length < 1000) throw new Error('Empty gif buffer');

        // Convert GIF -> MP4, WhatsApp only plays MP4 for gifPlayback
        const tmpDir = os.tmpdir();
        const gifPath = path.join(tmpDir, `reaction_${Date.now()}.gif`);
        const mp4Path = path.join(tmpDir, `reaction_${Date.now()}.mp4`);

        fs.writeFileSync(gifPath, gifBuffer);

        try {
            await execAsync(`ffmpeg -y -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${mp4Path}"`);
        } catch (ffmpegErr) {
            console.log('ffmpeg failed, sending as image gif fallback:', ffmpegErr.message);
            await sock.sendMessage(m.key.remoteJid, {
                image: gifBuffer,
                mimetype: 'image/gif',
                caption: text,
                mentions: mentions
            }, { quoted: m });
            try { fs.unlinkSync(gifPath); } catch {}
            return;
        }

        const mp4Buffer = fs.readFileSync(mp4Path);

        await sock.sendMessage(m.key.remoteJid, {
            video: mp4Buffer,
            gifPlayback: true,
            mimetype: 'video/mp4',
            caption: text,
            mentions: mentions
        }, { quoted: m });

        try { fs.unlinkSync(gifPath); fs.unlinkSync(mp4Path); } catch {}

    } catch (err) {
        console.error(`${command} download error:`, err.message);
        await ctx.reply(`❌ Failed to download the ${command} GIF.`);
    }
}