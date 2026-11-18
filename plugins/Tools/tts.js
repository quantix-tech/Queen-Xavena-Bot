import { getPrefix } from '../../lib/config.js';

export default {
    command: 'tts',
    aliases: ['say'],
    description: 'Convert text to speech',
    category: 'Tools',
    ownerOnly: false,
    usage: 'tts <text>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const text = args.join(' ');

        if (!text) {
            return ctx.reply(`🔊 *Text to Speech*\n\n*Usage:* \`${prefix}tts Hello world\`\n*Example:* \`${prefix}tts I am the Queen\``);
        }

        try {
            // 1. Fetch from Prexzy API
            const response = await fetch(`https://prexzyapis.com/tts/beatrice?text=${encodeURIComponent(text)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            let audioBuffer;
            const contentType = response.headers.get('content-type') || '';

            // 2. Extract Audio (Handles direct Audio, JSON, or Base64)
            if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
                // If the API returns raw audio directly
                audioBuffer = Buffer.from(await response.arrayBuffer());
            } else {
                // If the API returns JSON
                const data = await response.json();
                
                // Look for the audio URL or Base64 in common JSON keys
                const audioUrl = data.result || data.url || data.audio || data.data?.url || data.data;
                
                if (!audioUrl) {
                    throw new Error('Could not find audio URL in API response');
                }

                if (audioUrl.startsWith('http')) {
                    // Download the audio from the URL
                    const audioRes = await fetch(audioUrl);
                    audioBuffer = Buffer.from(await audioRes.arrayBuffer());
                } else {
                    // If it's a Base64 string
                    const base64Data = audioUrl.replace(/^data:audio\/\w+;base64,/, "");
                    audioBuffer = Buffer.from(base64Data, 'base64');
                }
            }

            if (!audioBuffer || audioBuffer.length < 1000) {
                throw new Error('Audio buffer is empty or too small');
            }

            // 3. Send as Voice Note (ptt: true makes it look like a real voice note)
            await sock.sendMessage(m.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: m });
            
        } catch (error) {
            console.error('TTS error:', error);
            await ctx.reply(`❌ *Error*\n\nFailed to generate voice note.\n_Note: API might be down or blocking requests._`);
        }
    }
};