import axios from 'axios';
import { execFile } from 'node:child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// 👇 Added standard browser headers to bypass 403 blocks
const AXIOS_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/*,video/*,*/*;q=0.8',
    'Referer': 'https://nekos.best/'
};

export async function sendReaction(sock, m, ctx, command, pastVerb) {
    const senderId = m.key.participant || m.key.remoteJid;
    const mentions = [senderId];
    const senderTag = `@${senderId.split('@')[0]}`;

    let targetId = null;
    let targetTag = null;

    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        targetTag = `@${targetId.split('@')[0]}`;
    } else if (ctx.quoted) {
        targetId = ctx.quoted.sender || ctx.quoted.key.participant;
        targetTag = `@${targetId.split('@')[0]}`;
    }

    if (targetId) mentions.push(targetId);

    const text = targetId 
        ? `*${senderTag}* ${pastVerb} *${targetTag}*`
        : `*${senderTag}* did a ${command}`;

    let gifUrl = null;

    try {
        let endpoint = command;
        if (command === 'kick') endpoint = 'kick';
        if (command === 'kill') endpoint = 'punch';

        const res = await axios.get(`https://nekos.best/api/v2/${endpoint}`, { 
            timeout: 10000,
            headers: AXIOS_HEADERS // 👈 Applied headers
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
                headers: AXIOS_HEADERS // 👈 Applied headers
            });
            gifUrl = res.data.link;
        } catch (fallbackErr) {
            console.error(`[reactions] Both APIs failed for ${command}:`, fallbackErr.message);
            return ctx.reply(`❌ Failed to fetch the ${command} GIF. All APIs are currently down.`);
        }
    }

    const tmpDir = os.tmpdir();
    const gifPath = path.join(tmpDir, `reaction_${Date.now()}.gif`);
    const mp4Path = path.join(tmpDir, `reaction_${Date.now()}.mp4`);

    try {
        const gifRes = await axios.get(gifUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: AXIOS_HEADERS // 👈 Applied headers for the download too
        });

        const gifBuffer = Buffer.from(gifRes.data);
        if (!gifBuffer || gifBuffer.length < 1000) throw new Error('Empty gif buffer');

        fs.writeFileSync(gifPath, gifBuffer);

        await execFileAsync('ffmpeg', [
            '-y',
            '-i', gifPath,
            '-movflags', 'faststart',
            '-pix_fmt', 'yuv420p',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            mp4Path
        ], { timeout: 20000 });
        
        const mp4Buffer = fs.readFileSync(mp4Path);
        if (!mp4Buffer || mp4Buffer.length < 1000) throw new Error('Empty mp4 buffer');

        await sock.sendMessage(m.key.remoteJid, {
            video: mp4Buffer,
            gifPlayback: true,
            mimetype: 'video/mp4',
            caption: text,
            mentions: mentions
        }, { quoted: m });

        console.log(`[reactions] ${command} sent successfully`);

    } catch (err) {
        console.error(`[reactions] ${command} failed:`, err.message);
        await ctx.reply(`❌ Failed to send the ${command} GIF.`);
    } finally {
        try { if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath); } catch {}
        try { if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path); } catch {}
    }
}