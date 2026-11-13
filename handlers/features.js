import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_FILE = path.join(__dirname, '..', 'database', 'features.json');

function load() {
    try {
        if (!fs.existsSync(FEATURES_FILE)) {
            fs.writeFileSync(FEATURES_FILE, JSON.stringify({ groups: {}, global: {} }));
            return { groups: {}, global: {} };
        }
        return JSON.parse(fs.readFileSync(FEATURES_FILE, 'utf-8'));
    } catch {
        return { groups: {}, global: {} };
    }
}

function save(data) {
    fs.writeFileSync(FEATURES_FILE, JSON.stringify(data, null, 2));
}

// Group Features (Antisticker, Antigcstatus, etc.)
export function getGroupFeature(groupId, feature) {
    const data = load();
    return data.groups[groupId]?.[feature] || false;
}

export function setGroupFeature(groupId, feature, enabled) {
    const data = load();
    if (!data.groups[groupId]) data.groups[groupId] = {};
    data.groups[groupId][feature] = enabled;
    save(data);
}

// Global Features (Autotyping, Autorecording, Autobio)
export function getGlobalFeature(feature) {
    const data = load();
    return data.global[feature] || false;
}

export function setGlobalFeature(feature, enabled) {
    const data = load();
    data.global[feature] = enabled;
    save(data);
}