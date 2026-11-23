export default function (sock) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const m of messages) {
            if (!m.message || m.key.fromMe) continue;
            
            console.log(`\n========================================`);
            console.log(`[RAW-LOG] New Message Received`);
            console.log(`[RAW-LOG] Chat: ${m.key.remoteJid}`);
            console.log(`[RAW-LOG] Message Keys:`, Object.keys(m.message));
            
            // Unwrap to see inside
            let cur = m.message;
            for (let i = 0; i < 4; i++) {
                const next = cur.ephemeralMessage?.message || cur.viewOnceMessage?.message || cur.viewOnceMessageV2?.message || cur.viewOnceMessageV2Extension?.message;
                if (next) {
                    cur = next;
                    console.log(`[RAW-LOG] Unwrapped layer:`, Object.keys(cur));
                } else {
                    break;
                }
            }
            console.log(`========================================\n`);
        }
    });
}