import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHADOWBAN_FILE = path.join(__dirname, '..', 'database', 'shadowban.json');

function loadShadowban() {
    try {
        if (!fs.existsSync(SHADOWBAN_FILE)) {
            fs.writeFileSync(SHADOWBAN_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(SHADOWBAN_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveShadowban(data) {
    fs.writeFileSync(SHADOWBAN_FILE, JSON.stringify(data, null, 2));
}

// Check if a user is shadowbanned in a specific group
export function isShadowbanned(groupId, userId) {
    const data = loadShadowban();
    const list = data[groupId] || [];
    return list.includes(userId);
}

// Add user to shadowban list
export function addShadowban(groupId, userId) {
    const data = loadShadowban();
    if (!data[groupId]) data[groupId] = [];
    if (!data[groupId].includes(userId)) {
        data[groupId].push(userId);
        saveShadowban(data);
        return true;
    }
    return false;
}

// Remove user from shadowban list
export function removeShadowban(groupId, userId) {
    const data = loadShadowban();
    if (!data[groupId]) return false;
    const idx = data[groupId].indexOf(userId);
    if (idx === -1) return false;
    data[groupId].splice(idx, 1);
    if (data[groupId].length === 0) delete data[groupId];
    saveShadowban(data);
    return true;
}

// Get all shadowbanned users in a group
export function getShadowbanList(groupId) {
    const data = loadShadowban();
    return data[groupId] || [];
}