import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WELCOME_FILE = path.join(__dirname, '..', 'database', 'welcome.json');

function loadData() {
    try {
        if (!fs.existsSync(WELCOME_FILE)) {
            fs.writeFileSync(WELCOME_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(WELCOME_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(WELCOME_FILE, JSON.stringify(data, null, 2));
}

export function getWelcomeConfig(groupId) {
    const data = loadData();
    return data[groupId] || {
        welcome: { enabled: false, text: '👋 Welcome {mention} to *{group}*!\n\nYou are member *#{count}*.\nEnjoy your stay! 💜' },
        goodbye: { enabled: false, text: '👋 Goodbye {mention}.\n\n_We\'ll miss you in {group}!_ 💔' }
    };
}

export function setWelcomeConfig(groupId, config) {
    const data = loadData();
    data[groupId] = config;
    saveData(data);
}