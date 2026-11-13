import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR  = path.join(__dirname, '..', 'database');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
export const OWNER_FILE  = path.join(CONFIG_DIR, 'owner.json');

const DEFAULTS = Object.freeze({ 
    mode: 'private', 
    sudos: [], 
    prefix: '.', 
    botName: 'Queen Xavena',
    menuImage: 'https://cdn.tmp.malvryx.dev/files/mxv_q33IIlzy0.jpeg',
    aiTag: false,
    chatbotMode: false, // 👈 Turns on AI chat replies
    nlpMode: false      // 👈 Turns on Natural Language Command Execution
});

let cache = null;

export function load() {
    if (cache) return cache;
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        cache = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
        cache = { ...DEFAULTS };
    }
    return cache;
}

function save() {
    if (!cache) return;
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cache, null, 2));
}

// ─── Bot Name ───
export function getBotName() { return load().botName; }
export function setBotName(name) { load().botName = name; save(); }

// ─── Menu Image ───
export function getMenuImage() { return load().menuImage; }
export function setMenuImage(url) { load().menuImage = url; save(); }

// ─── AI Tag ───
export function getAiTag() { 
    const val = load().aiTag;
    return val === true || val === 'true' || val === 1 || val === '1';
}
export function setAiTag(enabled) { 
    load().aiTag = Boolean(enabled); 
    save(); 
}

// ─── AI Chatbot & NLP Toggles ───
export function getChatbotMode() { return load().chatbotMode; }
export function setChatbotMode(enabled) { 
    load().chatbotMode = Boolean(enabled); 
    save(); 
}

export function getNlpMode() { return load().nlpMode; }
export function setNlpMode(enabled) { 
    load().nlpMode = Boolean(enabled); 
    save(); 
}

// ─── Mode ───
export function getMode() { return load().mode; }
export function setMode(mode) {
    const mapped = String(mode).toLowerCase().trim() === 'self' ? 'private' : String(mode).toLowerCase().trim();
    if (mapped !== 'private' && mapped !== 'public') return { ok: false, reason: 'Invalid mode' };
    if (load().mode === mapped) return { ok: false, reason: 'Already in this mode' };
    load().mode = mapped;
    save();
    return { ok: true, mode: mapped };
}

// ─── Prefix ───
export function getPrefix() { return load().prefix; }
export function setPrefix(newPrefix) { load().prefix = newPrefix; save(); }

// ─── Sudos ───
export function getSudos() { return [...load().sudos]; }
export function isSudoNumber(num) { return load().sudos.includes(num); }
export function addSudo(num) {
    const clean = String(num).replace(/[^0-9]/g, '');
    if (!clean || load().sudos.includes(clean)) return false;
    load().sudos.push(clean); save(); return true;
}
export function removeSudo(num) {
    const clean = String(num).replace(/[^0-9]/g, '');
    const idx = load().sudos.indexOf(clean);
    if (idx === -1) return false;
    load().sudos.splice(idx, 1); save(); return true;
}