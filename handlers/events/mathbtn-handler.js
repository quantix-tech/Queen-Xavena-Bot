export default function(sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const m of messages) {
            if (!m.message) continue;

            // Catch the button response
            const btnReply = m.message.templateButtonReplyMessage || m.message.interactiveResponseMessage;
            if (!btnReply) continue;

            const selectedId = btnReply.selectedId || btnReply.nativeFlowResponseMessage?.paramsJson;
            if (!selectedId || !selectedId.startsWith('mathbtn_')) continue;

            const chosenAnswer = parseInt(selectedId.replace('mathbtn_', ''));
            
            // Note: Since we didn't store the real answer, we can't validate it easily. 
            // For this test, we just want to see if the button tap triggers this handler.

            await sock.sendMessage(m.key.remoteJid, { 
                text: `✅ You tapped: *${chosenAnswer}*!\n\nThe interactive buttons are working perfectly.` 
            }, { quoted: m });
        }
    });
}