import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STICKER_FILE = path.join(__dirname, '..', 'database', 'stickers.json');

function loadStickers() {
    try {
        if (!fs.existsSync(STICKER_FILE)) {
            fs.writeFileSync(STICKER_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(STICKER_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveStickers(data) {
    fs.writeFileSync(STICKER_FILE, JSON.stringify(data, null, 2));
}

export function getStickerHash(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
}

export function bindSticker(hash, command) {
    const data = loadStickers();
    data[hash] = command.toLowerCase();
    saveStickers(data);
}

export function getBoundCommand(hash) {
    return loadStickers()[hash] || null;
}

export function unbindSticker(hash) {
    const data = loadStickers();
    if (!data[hash]) return false;
    delete data[hash];
    saveStickers(data);
    return true;
}

export function unbindByCommand(command) {
    const data = loadStickers();
    const cmd = command.toLowerCase();
    let removed = false;
    for (const hash in data) {
        if (data[hash] === cmd) {
            delete data[hash];
            removed = true;
        }
    }
    if (removed) saveStickers(data);
    return removed;
}

export function listStickers() {
    return loadStickers();
}