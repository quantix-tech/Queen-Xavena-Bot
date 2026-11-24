import { generateWAMessageFromContent, proto } from '@itsliaaa/baileys';
import crypto from 'crypto';

export async function sendInteractiveHTML(sock, jid, quoted, htmlContent, buttons) {
    // 1. Format the native buttons
    const formattedButtons = buttons.map(btn => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            id: btn.id
        })
    }));

    // 2. Build the Rich HTML payload (from your pasted code)
    const richData = Buffer.from(JSON.stringify({
        __typename: 'GenAIUnifiedResponse',
        response_id: crypto.randomUUID(),
        sections: [{
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: {
                    __typename: 'FOAHtmlPrimitiveDemoDONOTUSE',
                    payload: String(htmlContent),
                },
            },
        }],
    })).toString('base64');

    // 3. Create the interactive message
    const interactiveMsg = proto.Message.InteractiveMessage.fromObject({
        // 👇 THIS is where the magic happens. We put the rich HTML in the header.
        header: {
            title: '🎮 INTERACTIVE GAME',
            hasMediaAttachment: false,
            // We use the unifiedResponse here to trick WhatsApp into rendering the HTML
            imageMessage: { url: 'data:image/jpeg;base64,' + Buffer.from('').toString('base64') }, // Dummy image to force layout
        },
        body: { 
            text: ' ' // Empty body, the HTML is in the header
        },
        footer: { text: 'QUEEN XAVENA · INTERACTIVE GAMES' },
        nativeFlowMessage: { buttons: formattedButtons, messageParamsJson: '' },
    });

    // Note: WhatsApp's rendering engine is weird. To get the HTML to render AND have buttons,
    // we actually send it as a botForwardedMessage but wrap it in a viewOnce interactive wrapper.
    
    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    body: { text: ' ' }, // Empty
                    footer: { text: 'QUEEN XAVENA · INTERACTIVE GAMES' },
                    header: {
                        title: 'NUMBER GUESS',
                        hasMediaAttachment: false,
                    },
                    nativeFlowMessage: { buttons: formattedButtons, messageParamsJson: '' },
                    // Injecting the Rich HTML payload directly
                    botForwardedMessage: {
                        message: {
                            richResponseMessage: {
                                messageType: 1,
                                submessages: [],
                                unifiedResponse: { data: richData },
                                contextInfo: {
                                    forwardingScore: 1,
                                    isForwarded: true,
                                    forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
                                    forwardOrigin: 4,
                                },
                            },
                        },
                    }
                }),
            },
        },
    }, { userJid: sock.user?.id, quoted });

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}