import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ACTIVITY_FILE = path.join(__dirname, '..', 'database', 'activity.json');

function loadActivity() {
    try {
        if (!fs.existsSync(ACTIVITY_FILE)) {
            fs.writeFileSync(ACTIVITY_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf-8'));
    } catch { return {}; }
}

function saveActivity(data) {
    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(data, null, 2));
}

export function trackMessage(groupId, userId) {
    const data = loadActivity();
    if (!data[groupId]) data[groupId] = {};
    if (!data[groupId][userId]) data[groupId][userId] = { count: 0, lastSeen: 0 };
    
    data[groupId][userId].count += 1;
    data[groupId][userId].lastSeen = Date.now();
    
    // Save periodically or immediately (immediate is safer here)
    saveActivity(data);
}

export function getGroupActivity(groupId) {
    return loadActivity()[groupId] || {};
}