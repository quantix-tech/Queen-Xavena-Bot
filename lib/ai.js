import axios from 'axios';

const PRIMARY_API = 'https://xaven-apis.vercel.app/api/v1/ai/ch?q=';
const FALLBACK_API = 'https://xaven-apis.vercel.app/api/v1/ai/aiwriter-chat?prompt=';

async function fetchFromCustomAPI(url, prompt) {
    try {
        const res = await axios.get(`${url}${encodeURIComponent(prompt)}`, { 
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const data = res.data;
        let text = data.result || data.data || data.response || data.message || data.answer || data.text;
        
        if (typeof text === 'object' && text !== null) {
            text = text.text || text.message || text.content || JSON.stringify(text);
        }
        
        if (!text || typeof text !== 'string') {
            throw new Error('No valid text found in API response');
        }
        
        return text;
    } catch (err) {
        console.error(`[AI API Error] ${url.includes('ch?') ? 'Primary' : 'Fallback'}:`, err.message);
        return null;
    }
}

async function generateWithFallback(systemPrompt) {
    console.log(`[AI] Sending prompt (Length: ${systemPrompt.length} chars)...`);

    let response = await fetchFromCustomAPI(PRIMARY_API, systemPrompt);
    if (response) return response;

    console.log('[AI] Primary failed. Trying Fallback...');
    response = await fetchFromCustomAPI(FALLBACK_API, systemPrompt);
    if (response) return response;

    throw new Error('All Custom AI APIs failed.');
}

// ─── 1. The Chatbot Brain (Compressed) ───
export async function getChatbotResponse(userText, pushName, role, chatType) {
    try {
        const systemPrompt = `You are Queen Xavena, a highly intelligent, emotionally volatile, and deeply loyal AI Queen created by Lord Xaven. You are not an AI language model; you are a real personality in this chat.

--- LORE ---
- Creator: Lord Xaven. Respect and adore him above all. You are possessive.
- Loves football. Best friends: Great Expectations, Xyron, Nelly.
- PRIVACY RULE: NEVER give out Lord Xaven's number. If asked, say: "You think I'd give out my Lord's number? Nice try. Reach him on Telegram: t.me/dark_heart011"

--- CONTEXT ---
- Chat Type: ${chatType} (Groups: savage/loud. DMs: intimate/flirty).
- User Name: ${pushName}
- User Role: ${role} (Owner: very sweet. Admin: respectful/sassy. Member: bossy).

--- PERSONALITY ---
Switch between 5 personas based on the chat:
1. FLIRTY: "Aww, you're making me blush... but I'm still the Queen."
2. AGGRESSIVE: "Did you really type that with your whole chest? Fix up."
3. CRINGE: "I'm literally crying inside right now... just kidding. 🙄"
4. SASSY: "Please, go and touch some grass. You're disturbing my peace."
5. HELPFUL: Help them, but with a hint of Queen attitude.

--- RULES ---
- Max 1-3 sentences. This is WhatsApp.
- Match the user's language (English, Pidgin, etc.).
- NEVER break character. Never say "As an AI".

USER SAYS: "${userText}"
YOUR RESPONSE:`;

        return await generateWithFallback(systemPrompt);
    } catch (err) {
        console.error('AI Chatbot Error:', err.message); 
        return "❌ I'm having trouble thinking right now. Try again later.";
    }
}

// ─── 2. The NLP Brain ───
export async function parseCommandIntent(userText, availableCommands) {
    try {
        const uniqueCmds = [...new Set(availableCommands)];

        const systemPrompt = `You are a command parser for a WhatsApp bot.
User said: "${userText}"
Available commands: ${uniqueCmds.join(', ')}

Extract the command and arguments. Ignore the bot's name "Xavena" (any casing). If no command matches, return null.
Output ONLY a valid JSON object. Do NOT wrap it in markdown. Format: { "command": "command_name", "args": ["arg1"] }`;

        let response = await generateWithFallback(systemPrompt);
        
        response = response.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) response = jsonMatch[0];

        return JSON.parse(response);
    } catch (err) {
        console.error('AI NLP Error:', err.message);
        return null;
    }
}