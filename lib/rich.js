import { generateWAMessageFromContent, proto } from '@itsliaaa/baileys';
import crypto from 'crypto';

export function richContext(quoted) {
    if (!quoted?.key) return {
        forwardingScore: 1,
        isForwarded: true,
        forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
        forwardOrigin: 4,
    };
    return {
        forwardingScore: 1,
        isForwarded: true,
        forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
        forwardOrigin: 4,
        stanzaId: quoted.key.id,
        participant: quoted.key.participant || quoted.participant || quoted.key.remoteJid,
        ...(quoted.message ? { quotedMessage: quoted.message } : {}),
    };
}

export function buildRichContent(html, quoted, { title = '', url = '', trustedSources = [] } = {}) {
    const data = Buffer.from(JSON.stringify({
        __typename: 'GenAIUnifiedResponse',
        response_id: crypto.randomUUID(),
        ...(title ? { title: String(title) } : {}),
        sections: [{
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: {
                    __typename: 'FOAHtmlPrimitiveDemoDONOTUSE',
                    ...(title ? { title: String(title) } : {}),
                    trusted_sources: Array.isArray(trustedSources) ? trustedSources : [],
                    ...(url ? { url: String(url) } : {}),
                    payload: String(html),
                },
            },
        }],
    })).toString('base64');

    return proto.Message.fromObject({
        messageContextInfo: {
            threadId: [],
            deviceListMetadata: {
                senderKeyIndexes: [],
                recipientKeyIndexes: [],
                recipientKeyHash: '',
                recipientTimestamp: Math.floor(Date.now() / 1000),
            },
            deviceListMetadataVersion: 2,
            messageSecret: crypto.randomBytes(32),
        },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [],
                    unifiedResponse: { data },
                    contextInfo: richContext(quoted),
                },
            },
        },
    });
}

export async function sendRichHtml({ sock, jid, quoted, html }) {
    const content = buildRichContent(html, quoted);
    const safeQuoted = quoted?.message ? quoted : undefined;
    const wrapped = generateWAMessageFromContent(jid, content, { userJid: sock.user?.id, quoted: safeQuoted });
    await sock.relayMessage(jid, wrapped.message, { messageId: wrapped.key.id });
    return wrapped;
}