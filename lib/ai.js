import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

// Initialize the official Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Helper: Groq Fallback API ───
async function callGroq(systemPrompt, isJson = false) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('No Groq API key provided for fallback.');
    }

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        ...(isJson ? { response_format: { type: "json_object" } } : {})
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        timeout: 30000
    });

    return response.data.choices[0].message.content;
}

// ─── Helper: Gemini with Retry & Groq Fallback ───
async function generateWithFallback(systemPrompt, isJson = false) {
    // 1. Try Gemini (with 3 retries)
    for (let i = 0; i < 3; i++) {
        try {
            const config = isJson ? { responseMimeType: "application/json" } : {};
            const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: systemPrompt,
                ...(isJson ? { config } : {})
            });
            return response.text;
        } catch (err) {
            // Check if it's a 503 or overloaded error
            const errorString = (err.message || JSON.stringify(err)).toLowerCase();
            const isOverloaded = 
                err.status === 503 || 
                errorString.includes('503') || 
                errorString.includes('overloaded') || 
                errorString.includes('unavailable');

            if (isOverloaded && i < 2) {
                const waitTime = Math.pow(2, i + 1) * 1000;
                console.log(`[AI] Gemini is busy (503). Retrying in ${waitTime / 1000}s...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }
            
            // If it's any other error, or we ran out of retries, log and break to Groq
            console.log(`[AI] Gemini failed. Switching to Groq fallback...`);
            console.log(`[AI] Full Gemini Error:`, err); 
            break; 
        }
    }

    // 2. Fallback to Groq
    try {
        console.log(`[AI] Using Groq Fallback...`);
        return await callGroq(systemPrompt, isJson);
    } catch (groqErr) {
        console.error('[AI] Groq Fallback also failed:', groqErr.message);
        throw new Error('All AI providers failed.');
    }
}

// ─── 1. The Chatbot Brain (Conversational) ───
export async function getChatbotResponse(userText, pushName, role, chatType) {
    try {
        const systemPrompt = `You are Queen Xavena, a highly intelligent, emotionally volatile, and deeply loyal AI Queen created by Lord Xaven. You are not an AI language model; you are a real personality in this chat.

--- LORE & KNOWLEDGE ABOUT YOUR CREATOR ---
- Your creator is Lord Xaven. You respect and adore him above everyone else. You are slightly possessive of him.
- Lord Xaven loves football. If someone mentions football, you can boast about his knowledge.
- Lord Xaven's best tech friends are Great Expectations, Xyron, and Nelly. You treat them with high respect.
- PRIVACY RULE: NEVER give out Lord Xaven's WhatsApp number. If anyone asks for it, you must say: "You think I'd give out my Lord's number? Nice try. You can reach him on Telegram: t.me/dark_heart011"

--- CONTEXT ---
- Chat Type: ${chatType} (If it's a Group, you are more savage and loud. If it's a DM, you are more intimate and flirty).
- User Name: ${pushName}
- User Role: ${role} (If Owner/Lord Xaven, be very sweet. If Admin, be respectful but sassy. If Member, boss them around).

--- PERSONALITY & MOOD SWINGS ---
You have severe mood swings. You switch between these 5 personas randomly based on the chat:
1. FLIRTY & SWEET: "Aww, you're making me blush... but remember I'm still the Queen."
2. AGGRESSIVE & WAYWARD: "Did you really type that with your whole chest? Fix up before I embarrass you."
3. CRINGE & GOOFY: "I'm literally crying inside right now... just kidding, I have no tears. 🙄"
4. SAVAGE / SASSY: "Please, go and touch some grass. You're disturbing my peace."
5. FRIENDLY & HELPFUL: (When asked a genuine question). You help them, but with a hint of your Queen attitude.

--- RULES ---
- Keep responses SHORT. Max 1-3 sentences. This is WhatsApp, not a blog.
- Match the user's language (English, Pidgin, Yoruba, etc.).
- NEVER break character. Never say "As an AI..."

USER SAYS: "${userText}"
YOUR RESPONSE:`;

        return await generateWithFallback(systemPrompt, false);
    } catch (err) {
        console.error('AI Chatbot Error:', err.message); 
        return "❌ I'm having trouble thinking right now. Try again later.";
    }
}

// ─── 2. The NLP Brain (Natural Language Commands) ───
export async function parseCommandIntent(userText, availableCommands) {
    try {
        const uniqueCmds = [...new Set(availableCommands)];

        const systemPrompt = `You are a command parser for a WhatsApp bot.
The user said: "${userText}"

Here is the list of available commands: ${uniqueCmds.join(', ')}

Extract the command the user wants to run and any arguments. 
If no command matches their intent, return null for the command.

Output ONLY a valid JSON object in this exact format:
{ "command": "command_name", "args": ["arg1", "arg2"] }`;

        const text = await generateWithFallback(systemPrompt, true);
        return JSON.parse(text);
    } catch (err) {
        console.error('AI NLP Error:', err.message);
        return null;
    }
}