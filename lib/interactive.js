import { generateWAMessageFromContent, generateWAMessageContent, proto } from '@itsliaaa/baileys';

export async function sendGameCanvas({ sock, jid, quoted, title, imageBuffer, buttons }) {
    const formattedButtons = buttons.map(btn => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id }),
    }));

    // 1. Upload the image to WhatsApp servers (Exact Ban Checker logic)
    if (typeof sock.waUploadToServer !== 'function') throw new Error('Image upload is not available for rich cards');
    const media = await generateWAMessageContent({ image: imageBuffer }, { upload: sock.waUploadToServer });
    if (!media?.imageMessage) throw new Error('Baileys did not return an image header');

    // 2. Wrap it in the InteractiveMessage (Exact Ban Checker logic)
    const wrapped = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    body: { text: `The game is on!` },
                    footer: { text: 'QUEEN XAVENA · INTERACTIVE GAMES' },
                    header: { title: title, hasMediaAttachment: true, imageMessage: media.imageMessage },
                    nativeFlowMessage: { buttons: formattedButtons, messageParamsJson: '' },
                }),
            },
        },
    }, { userJid: sock.user?.id, ...(quoted ? { quoted } : {}) });

    // 3. Relay the message
    await sock.relayMessage(jid, wrapped.message, { messageId: wrapped.key.id });
    return wrapped;
}