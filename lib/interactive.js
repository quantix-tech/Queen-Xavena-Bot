import { generateWAMessageFromContent, proto } from '@itsliaaa/baileys';

export async function sendInteractiveHTML(sock, jid, quoted, htmlContent, buttons) {
    const formattedButtons = buttons.map(btn => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            id: btn.id
        })
    }));

    const interactiveMsg = proto.Message.InteractiveMessage.fromObject({
        body: { text: htmlContent },
        footer: { text: 'QUEEN XAVENA · INTERACTIVE GAMES' },
        header: { title: '🎮 NUMBER GUESS', hasMediaAttachment: false },
        nativeFlowMessage: { buttons: formattedButtons, messageParamsJson: '' },
    });

    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
                interactiveMessage: interactiveMsg,
            },
        },
    }, { userJid: sock.user?.id, quoted });

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}