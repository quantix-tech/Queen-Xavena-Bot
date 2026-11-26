// lib/awaits.js
export const awaitingReplies = new Map();

/**
 * Tell the bot to wait for the next message from this user in this chat.
 * @param {string} jid - The chat ID
 * @param {string} userId - The sender's ID
 * @param {string} command - The command that is waiting (e.g. 'saudio')
 * @param {object} data - Any data to pass back to the plugin (e.g. { stickerBuffer })
 */
export function setAwait(jid, userId, command, data = {}) {
    const key = `${jid}_${userId}`;
    awaitingReplies.set(key, {
        command,
        data,
        expires: Date.now() + (5 * 60 * 1000) // Auto-expire in 5 mins
    });
}

/**
 * Check if the user has a pending await in this chat.
 * Returns the await data if valid, otherwise null.
 */
export function getAwait(jid, userId) {
    const key = `${jid}_${userId}`;
    const awaitData = awaitingReplies.get(key);
    
    if (!awaitData) return null;
    
    if (Date.now() > awaitData.expires) {
        awaitingReplies.delete(key);
        return null;
    }
    
    return awaitData;
}

/**
 * Clear the await state.
 */
export function clearAwait(jid, userId) {
    const key = `${jid}_${userId}`;
    awaitingReplies.delete(key);
}