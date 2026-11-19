import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_FILE = path.join(__dirname, '..', 'database', 'rules.json');

function loadRules() {
    try {
        if (!fs.existsSync(RULES_FILE)) {
            fs.writeFileSync(RULES_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(RULES_FILE, 'utf-8'));
    } catch { return {}; }
}

function saveRules(data) {
    fs.writeFileSync(RULES_FILE, JSON.stringify(data, null, 2));
}

export function getGroupRules(groupId) {
    return loadRules()[groupId] || null;
}

export function setGroupRules(groupId, text) {
    const data = loadRules();
    data[groupId] = text;
    saveRules(data);
}