import { generateWAMessageFromContent, proto } from '@itsliaaa/baileys';

/**
 * Sends an interactive message with clickable buttons.
 * @param {object} sock - Baileys socket
 * @param {string} jid - Chat ID
 * @param {object} quoted - Message object to quote
 * @param {string} bodyText - Main text
 * @param {Array} buttons - Array of { text, id }
 * @param {object} media - Optional { image: Buffer, caption: string }
 */
export async function sendInteractive(sock, jid, quoted, bodyText, buttons, media = null) {
    const formattedButtons = buttons.map(btn => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            id: btn.id
        })
    }));

    const messageContent = {
        body: { text: bodyText },
        footer: { text: 'QUEEN XAVENA · INTERACTIVE GAMES' },
        nativeFlowMessage: { buttons: formattedButtons, messageParamsJson: '' },
    };

    // If an image is passed, attach it to the header
    if (media?.image) {
        messageContent.header = {
            title: 'TIC-TAC-TOE',
            hasMediaAttachment: true,
            imageMessage: { url: `data:image/jpeg;base64,${media.image.toString('base64')}` }
        };
    } else {
        messageContent.header = { title: 'QUEEN XAVENA', hasMediaAttachment: false };
    }

    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject(messageContent),
            },
        },
    }, { userJid: sock.user?.id, quoted });

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}