import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BAN_FILE = path.join(__dirname, '..', 'database', 'bans.json');

function loadBans() {
    try {
        if (!fs.existsSync(BAN_FILE)) {
            fs.writeFileSync(BAN_FILE, JSON.stringify([]));
            return [];
        }
        return JSON.parse(fs.readFileSync(BAN_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function saveBans(bans) {
    fs.writeFileSync(BAN_FILE, JSON.stringify(bans, null, 2));
}

// Check if ANY of the provided IDs are in the ban list
export function isBanned(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    const bans = loadBans();
    return ids.some(id => id && bans.includes(id));
}

export function addBan(number) {
    if (!number) return false;
    const bans = loadBans();
    if (!bans.includes(number)) {
        bans.push(number);
        saveBans(bans);
        return true;
    }
    return false;
}

export function removeBan(number) {
    if (!number) return false;
    const bans = loadBans();
    const idx = bans.indexOf(number);
    if (idx !== -1) {
        bans.splice(idx, 1);
        saveBans(bans);
        return true;
    }
    return false;
}