import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AFK_FILE = path.join(__dirname, '..', 'database', 'afk.json');

function loadAFK() {
    try {
        if (!fs.existsSync(AFK_FILE)) {
            fs.writeFileSync(AFK_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(AFK_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveAFK(data) {
    fs.writeFileSync(AFK_FILE, JSON.stringify(data, null, 2));
}

export function setAFK(userId, reason) {
    const data = loadAFK();
    data[userId] = { reason, timestamp: Date.now() };
    saveAFK(data);
}

export function removeAFK(userId) {
    const data = loadAFK();
    if (data[userId]) {
        delete data[userId];
        saveAFK(data);
        return true;
    }
    return false;
}

export function getAFK(userId) {
    const data = loadAFK();
    return data[userId] || null;
}

export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}