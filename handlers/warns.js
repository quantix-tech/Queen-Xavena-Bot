import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WARNS_FILE = path.join(__dirname, '..', 'database', 'warns.json');

function loadWarns() {
    try {
        if (!fs.existsSync(WARNS_FILE)) {
            fs.writeFileSync(WARNS_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(WARNS_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveWarns(data) {
    fs.writeFileSync(WARNS_FILE, JSON.stringify(data, null, 2));
}

export function addWarn(groupId, userId) {
    const data = loadWarns();
    if (!data[groupId]) data[groupId] = {};
    if (!data[groupId][userId]) data[groupId][userId] = 0;
    
    data[groupId][userId] += 1;
    saveWarns(data);
    return data[groupId][userId]; // Returns total warns
}

export function resetWarns(groupId, userId) {
    const data = loadWarns();
    if (data[groupId] && data[groupId][userId]) {
        delete data[groupId][userId];
        saveWarns(data);
    }
}
