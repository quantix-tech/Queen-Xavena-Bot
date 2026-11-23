// Queen Xavena — view-once message store.
// Keeps the last N incoming messages in memory so .vv / .vv2 / antiviewonce
// can retrieve the original view-once payload AFTER WhatsApp has delivered it.
// If the bot is offline when the view-once arrives, it is gone forever.

const LIMIT = 1500;
const store = new Map(); // id -> { message, jids: Set }

function jidAliases(list) {
    const set = new Set();
    for (const j of list) {
        if (!j) continue;
        const raw = String(j).split('@')[0].split(':')[0];
        if (raw) set.add(raw);
    }
    return set;
}

export function remember(m) {
    const id = m?.key?.id;
    if (!id || !m.message) return;

    const jids = jidAliases([m.key.remoteJid, m.key.remoteJidAlt]);

    // Refresh insertion order (LRU-ish)
    store.delete(id);
    store.set(id, { message: m.message, jids });

    while (store.size > LIMIT) {
        store.delete(store.keys().next().value);
    }
}

export function getStored(key) {
    const id = key?.id;
    if (!id) return undefined;

    const entry = store.get(id);
    if (!entry) return undefined;

    // If both sides have jid info, make sure they overlap
    const requested = jidAliases([key.remoteJid, key.remoteJidAlt]);
    if (requested.size && entry.jids.size &&
        ![...requested].some(j => entry.jids.has(j))) {
        return undefined;
    }

    return entry.message;
}

export function forget(key) {
    const id = key?.id;
    if (id) store.delete(id);
}

export function size() {
    return store.size;
}