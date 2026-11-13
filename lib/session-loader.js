import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DIR  = path.join(__dirname, '..', 'session');
const SESSION_FILE = path.join(__dirname, '..', 'session_id.txt');
const CREDS_FILE   = path.join(SESSION_DIR, 'creds.json');
const OWNER_FILE   = path.join(__dirname, '..', 'database', 'owner.json');

const PREFIX = 'QueenXavena~';

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function stripPrefix(raw) {
    const trimmed = raw.trim();
    return trimmed.startsWith(PREFIX) ? trimmed.slice(PREFIX.length) : trimmed;
}

async function decodeAndExtract(raw, source) {
    const cleaned = stripPrefix(raw);
    if (!cleaned) throw new Error(`${source} is empty`);
    
    try {
        let zipBuffer;

        if (cleaned.startsWith('http')) {
            console.log(`[session] downloading zip from ${cleaned}...`);
            const res = await axios.get(cleaned, { responseType: 'arraybuffer', timeout: 60000 });
            zipBuffer = Buffer.from(res.data);
        } else {
            console.log(`[session] decoding base64 zip...`);
            zipBuffer = Buffer.from(cleaned, 'base64');
        }

        const zip = new AdmZip(zipBuffer);
        zip.extractAllTo(SESSION_DIR, true); // Extract to session/ and overwrite
        console.log(`[session] extracted zip from ${source} -> session/`);
    } catch (err) {
        throw new Error(`${source} is not a valid URL or zip/base64 string: ${err.message}`);
    }
}

function extractAndSaveOwner(credsPath) {
    try {
        if (!fs.existsSync(credsPath)) return;
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
        
        const me = creds.me?.id || creds.me?.lid;
        if (!me) return;

        const cleanId = me.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        if (!cleanId || cleanId.length < 5) return;

        ensureDir(path.join(__dirname, '..', 'database'));
        
        let owners = [];
        if (fs.existsSync(OWNER_FILE)) {
            owners = JSON.parse(fs.readFileSync(OWNER_FILE, 'utf-8'));
        }

        if (!owners.includes(cleanId)) {
            owners.push(cleanId);
            fs.writeFileSync(OWNER_FILE, JSON.stringify(owners, null, 2));
            console.log(`[session] Auto-registered Bot's Owner ID: ${cleanId}`);
        }
    } catch (err) {
        console.error('[session] Failed to extract owner from creds:', err.message);
    }
}

// 👇 Note: loadSession is now async
export async function loadSession() {
    ensureDir(SESSION_DIR);

    // 1. Env var
    if (process.env.SESSION_ID) {
        await decodeAndExtract(process.env.SESSION_ID, 'SESSION_ID env var');
        extractAndSaveOwner(CREDS_FILE);
        return CREDS_FILE;
    }

    // 2. Existing creds.json
    if (fs.existsSync(CREDS_FILE)) {
        console.log('[session] using existing session/creds.json');
        extractAndSaveOwner(CREDS_FILE);
        return CREDS_FILE;
    }

    // 3. session_id.txt
    if (fs.existsSync(SESSION_FILE)) {
        const raw = fs.readFileSync(SESSION_FILE, 'utf-8');
        const cleaned = raw
            .split('\n')
            .filter(line => line.trim() && !line.trim().startsWith('#'))
            .join('\n')
            .trim();
            
        if (cleaned) {
            await decodeAndExtract(cleaned, 'session_id.txt');
            extractAndSaveOwner(CREDS_FILE);
            return CREDS_FILE;
        }
    }

    console.error(`\nNo session found.\nProvide a session ID via:\n1. SESSION_ID env var\n2. session_id.txt\n`);
    process.exit(1);
}

export { CREDS_FILE, SESSION_DIR };