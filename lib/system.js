import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// Folders commonly responsible for massive bloat
const DIRS_TO_CLEAN = [
    path.join(ROOT_DIR, 'tmp'),
    path.join(ROOT_DIR, 'temp'),
    path.join(ROOT_DIR, 'downloads'),
    path.join(ROOT_DIR, 'node_modules', '.cache')
];

export function getDirectorySize(dirPath) {
    let size = 0;
    if (!fs.existsSync(dirPath)) return 0;
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            size += stats.size;
        } else if (stats.isDirectory()) {
            size += getDirectorySize(filePath);
        }
    }
    return size;
}

export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function cleanTempFolders() {
    let clearedBytes = 0;
    let clearedCount = 0;

    for (const dir of DIRS_TO_CLEAN) {
        if (!fs.existsSync(dir)) continue;
        
        clearedBytes += getDirectorySize(dir);
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            try {
                fs.rmSync(path.join(dir, file), { recursive: true, force: true });
                clearedCount++;
            } catch (e) {
                // Ignore locked files
            }
        }
    }
    return { clearedBytes, clearedCount };
}