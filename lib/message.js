import { reply, react, getRealJid } from './utils.js';
import { resolveMedia } from './media.js';

const WRAPPERS = [
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'documentWithCaptionMessage'
];

export function unwrap(msg) {
    if (!msg) return null;
    let cur = msg;
    for (let i = 0; i < 5; i++) {
        const wrapper = WRAPPERS.find((w) => cur[w]?.message);
        if (!wrapper) break;
        cur = cur[wrapper].message;
    }
    return cur;
}

export function getType(msg) {
    if (!msg) return null;
    return Object.keys(msg)[0] || null;
}

export function extractText(msg) {
    if (!msg) return '';
    if (typeof msg.conversation === 'string') return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    const type = getType(msg);
    const inner = type ? msg[type] : null;
    if (inner?.caption) return inner.caption;
    return '';
}

export async function extractQuoted(msg, sock) {
    if (!msg) return null;
    const type = getType(msg);
    if (!type) return null;

    const contextInfo = msg[type]?.contextInfo;
    if (!contextInfo?.quotedMessage) return null;

    const quotedRaw = unwrap(contextInfo.quotedMessage);
    if (!quotedRaw) return null;

    return {
        message: quotedRaw,
        type: getType(quotedRaw),
        text: extractText(quotedRaw),
        // Fallback to remoteJid if participant is missing (happens in some DMs)
        sender: await getRealJid(contextInfo.participant || contextInfo.remoteJid, sock),
        key: {
            remoteJid: contextInfo.remoteJid || msg.key?.remoteJid,
            id: contextInfo.stanzaId,
            participant: contextInfo.participant
        }
    };
}

export async function buildContext(sock, m) {
    if (!m?.message || !m.key?.remoteJid) return null;

    const raw = unwrap(m.message);
    if (!raw) return null;

    const type = getType(raw);
    const text = extractText(raw);
    const quoted = await extractQuoted(raw, sock);

    // 👇 FIX: Resolve the actual sender, not the chat partner
    const senderJid = m.key.participant || (m.key.fromMe ? sock.user.id : m.key.remoteJid);

    return {
        text,
        type,
        raw,
        quoted,
        chat:    m.key.remoteJid,
        sender:  await getRealJid(senderJid, sock),
        isGroup: m.key.remoteJid.endsWith('@g.us'),
        isFromMe: m.key.fromMe === true,
        reply:    (t) => reply(sock, m, t),
        react:    (e) => react(sock, m, e),
        getMedia: () => resolveMedia(sock, raw, quoted?.message ?? null)
    };
}