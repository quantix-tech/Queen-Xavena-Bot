import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTES_FILE = path.join(__dirname, '..', 'database', 'notes.json');

function loadNotes() {
    try {
        if (!fs.existsSync(NOTES_FILE)) {
            fs.writeFileSync(NOTES_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf-8'));
    } catch { return {}; }
}

function saveNotes(data) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2));
}

export function getGroupNotes(groupId) {
    return loadNotes()[groupId] || {};
}

export function addNote(groupId, name, text) {
    const data = loadNotes();
    if (!data[groupId]) data[groupId] = {};
    data[groupId][name.toLowerCase()] = text;
    saveNotes(data);
}

export function deleteNote(groupId, name) {
    const data = loadNotes();
    if (data[groupId] && data[groupId][name.toLowerCase()]) {
        delete data[groupId][name.toLowerCase()];
        saveNotes(data);
        return true;
    }
    return false;
}