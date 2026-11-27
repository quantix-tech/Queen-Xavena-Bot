import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

const META_AI_JIDS = [
    '867051314767696@bot',
    '11111111111@bot',
    '13135550002@c.us',
    '13135550002@s.whatsapp.net'
];
const META_AI_USER_IDS = new Set([
    '867051314767696',
    '11111111111',
    '13135550002'
]);

export default {
    command: 'metaai',
    description: 'Adds or removes Meta AI from the group',
    category: 'Group',
    ownerOnly: false,
    usage: 'metaai add / kick',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        const prefix = getPrefix();
        const sub = (args[0] || '').toLowerCase();

        if (sub !== 'add' && sub !== 'kick') {
            return ctx.reply(`❌ *Meta AI*\n\nUsage:\n${prefix}metaai add\n${prefix}metaai kick`);
        }

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const participants = metadata.participants;

            const senderIsAdmin = await isSenderAdmin(sock, m.key.remoteJid, m.key.participant, metadata);
            const botIsAdmin = await isBotAdmin(sock, m.key.remoteJid, metadata);

            if (!senderIsAdmin) {
                return ctx.reply('❌ Only group admins can use this command.');
            }
            if (!botIsAdmin) {
                return ctx.reply('❌ I need to be an admin to add / remove Meta AI.');
            }

            const presentInfo = await findMetaAiInGroup(sock, m.key.remoteJid, metadata);

            if (sub === 'add') {
                if (presentInfo.present) {
                    return ctx.reply('Meta AI is already in this group.');
                }

                const add = await tryAddMetaAi(sock, m.key.remoteJid);
                if (!add.ok) {
                    console.error('MetaAI add failed:', add.status, add.error);
                    return ctx.reply('❌ Failed to add Meta AI.');
                }

                await new Promise((r) => setTimeout(r, 1200));
                return ctx.reply('✅ Meta AI has been added to this group.');
            }

            // kick
            const remove = await tryRemoveMetaAi(sock, m.key.remoteJid, presentInfo);
            if (!remove.ok) {
                console.error('MetaAI remove failed:', remove.status, remove.error, remove.attempts);
                return ctx.reply('❌ Failed to remove Meta AI.');
            }

            await new Promise((r) => setTimeout(r, 800));
            return ctx.reply('✅ Meta AI has been removed from this group.');

        } catch (err) {
            console.error('MetaAI error:', err);
            await ctx.reply(`❌ Failed to run Meta AI command.\n_Error: ${err.message}_`);
        }
    }
};

function participantIds(p) {
    if (!p || typeof p !== 'object') return [];
    return [p.id, p.jid, p.phoneNumber, p.lid, p.username]
        .filter((v) => typeof v === 'string' && v.length > 0);
}

function isMetaAiParticipant(p) {
    const ids = participantIds(p);
    for (const id of ids) {
        const lower = id.toLowerCase();
        if (id.endsWith('@bot')) return true;
        if (lower.includes('meta ai') || lower === 'metaai' || lower.includes('meta_ai')) return true;
        const user = id.split('@')[0].split(':')[0];
        if (META_AI_USER_IDS.has(user)) return true;
    }
    return false;
}

async function findMetaAiInGroup(sock, groupJid, cachedMetadata) {
    const metadata = cachedMetadata || await getGroupMetadata(sock, groupJid);
    const participants = metadata.participants || [];
    const hits = participants.filter(isMetaAiParticipant);
    return {
        present: hits.length > 0,
        participants: hits,
        participant: hits[0] || null,
        allIds: participants.flatMap(participantIds),
        metadata
    };
}

async function tryAddMetaAi(sock, groupJid) {
    let lastStatus = null;
    let lastResult = null;
    let lastError = null;

    for (const jid of META_AI_JIDS) {
        try {
            const result = await sock.groupParticipantsUpdate(groupJid, [jid], 'add');
            lastResult = result;
            const status = result?.[0]?.status != null ? String(result[0].status) : null;
            lastStatus = status;
            if (!status || status === '200') {
                return { ok: true, jid, status: status || '200', result };
            }
        } catch (err) {
            lastError = err;
        }
    }

    return { ok: false, status: lastStatus, result: lastResult, error: lastError };
}

async function tryRemoveMetaAi(sock, groupJid, presentInfo) {
    const candidates = [];
    const seen = new Set();

    const push = (jid) => {
        if (!jid || typeof jid !== 'string') return;
        if (seen.has(jid)) return;
        seen.add(jid);
        candidates.push(jid);
    };

    for (const p of presentInfo.participants || []) {
        for (const id of participantIds(p)) push(id);
    }
    for (const jid of META_AI_JIDS) push(jid);

    let lastStatus = null;
    let lastResult = null;
    let lastError = null;
    const attempts = [];

    for (const jid of candidates) {
        try {
            const result = await sock.groupParticipantsUpdate(groupJid, [jid], 'remove');
            lastResult = result;
            const status = result?.[0]?.status != null ? String(result[0].status) : null;
            lastStatus = status;
            attempts.push({ jid, status });
            if (!status || status === '200') {
                return { ok: true, jid, status: status || '200', result, attempts };
            }
        } catch (err) {
            lastError = err;
            attempts.push({ jid, error: err.message });
        }
    }

    return { ok: false, status: lastStatus, result: lastResult, error: lastError, attempts };
}