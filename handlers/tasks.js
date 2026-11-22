import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'database');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const NOTES_FILE = path.join(DB_DIR, 'notes_simple.json');
const TODOS_FILE = path.join(DB_DIR, 'todos.json');
const REMINDERS_FILE = path.join(DB_DIR, 'reminders.json');

// Helper to load/save
function loadFile(file, defaultVal = {}) {
    try {
        if (!fs.existsSync(file)) return defaultVal;
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch { return defaultVal; }
}
function saveFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── SIMPLE NOTES ───
export function getNote(userId) {
    const data = loadFile(NOTES_FILE);
    return data[userId] || null;
}
export function saveNote(userId, text) {
    const data = loadFile(NOTES_FILE);
    data[userId] = text;
    saveFile(NOTES_FILE, data);
}
export function deleteNote(userId) {
    const data = loadFile(NOTES_FILE);
    if (data[userId]) {
        delete data[userId];
        saveFile(NOTES_FILE, data);
        return true;
    }
    return false;
}

// ─── TODOS ───
export function getTodos(userId) {
    const data = loadFile(TODOS_FILE);
    return data[userId] || [];
}
export function addTodo(userId, task) {
    const data = loadFile(TODOS_FILE);
    if (!data[userId]) data[userId] = [];
    data[userId].push({ id: Date.now(), task, done: false });
    saveFile(TODOS_FILE, data);
}
export function deleteTodo(userId, index) {
    const data = loadFile(TODOS_FILE);
    if (data[userId] && data[userId][index]) {
        data[userId].splice(index, 1);
        saveFile(TODOS_FILE, data);
        return true;
    }
    return false;
}

// ─── REMINDERS ───
export function getReminders(userId) {
    const data = loadFile(REMINDERS_FILE);
    return data[userId] || [];
}
export function addReminder(userId, text, timestamp) {
    const data = loadFile(REMINDERS_FILE);
    if (!data[userId]) data[userId] = [];
    data[userId].push({ id: Date.now(), text, timestamp });
    saveFile(REMINDERS_FILE, data);
}
export function deleteReminder(userId, index) {
    const data = loadFile(REMINDERS_FILE);
    if (data[userId] && data[userId][index]) {
        data[userId].splice(index, 1);
        saveFile(REMINDERS_FILE, data);
        return true;
    }
    return false;
}