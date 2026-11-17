import axios from 'axios';


const PRIMARY_API = 'https://queen-xavena-api.vercel.app/api/v1/ai/ch?q=';
const FALLBACK_API = 'https://queen-xavena-api.vercel.app/api/v1/ai/aiwriter-chat?prompt=';


async function fetchFromCustomAPI(url, prompt) {
    try {
        const res = await axios.get(`${url}${encodeURIComponent(prompt)}`, { 
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const data = res.data;
        
        // Robust extraction (checks all common response formats)
        const text = data.result || data.data || data.response || data.message || data.answer || data.text;
        
        if (!text) {
            throw new Error('No text found in API response');
        }
        
        return text;
    } catch (err) {
        console.error(`[AI API Error] ${url.split('/').pop().split('?')[0]}:`, err.message);
        return null;
    }
}

// Helper to handle Primary -> Fallback logic
async function generateWithFallback(systemPrompt) {
    // 1. Try Primary API
    console.log('[AI] Trying Primary Custom API...');
    let response = await fetchFromCustomAPI(PRIMARY_API, systemPrompt);
    if (response) return response;

    // 2. Try Fallback API
    console.log('[AI] Primary failed. Trying Fallback Custom API...');
    response = await fetchFromCustomAPI(FALLBACK_API, systemPrompt);
    if (response) return response;

    throw new Error('All Custom AI APIs failed.');
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

        return await generateWithFallback(systemPrompt);
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
The user might type the bot's name "Xavena" in any casing (e.g., xavena, XAVENA, Xavena). Ignore the bot's name completely.
If no command matches their intent, return null for the command.

Output ONLY a valid JSON object. Do NOT wrap it in markdown code blocks (like \`\`\`json). Just output the raw JSON string.
Format:
{ "command": "command_name", "args": ["arg1", "arg2"] }`;

        let response = await generateWithFallback(systemPrompt);
        
        // ─── CLEANUP: Strip markdown and extract JSON ───
        // Sometimes AI models add ```json ... ``` despite instructions
        response = response.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Extract the JSON object if there's extra conversational text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            response = jsonMatch[0];
        }

        return JSON.parse(response);
    } catch (err) {
        console.error('AI NLP Error:', err.message);
        return null;
    }
}