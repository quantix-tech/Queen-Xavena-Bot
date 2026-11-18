import 'dotenv/config';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import {
    makeWASocket, useMultiFileAuthState, Browsers, 
    DisconnectReason, fetchLatestBaileysVersion, delay
} from '@itsliaaa/baileys';

import { 
    getPrefix, getBotName, getAiTag, getChatbotMode, getNlpMode, 
    load as loadConfig, getMode 
} from './lib/config.js';
import { getChatbotResponse, parseCommandIntent } from './lib/ai.js';
import { buildContext } from './lib/message.js';
import { canUse, getRealJid, extractRawId, isOwner, isSudo } from './lib/utils.js';
import { loadPlugins } from './lib/loader.js';
import { loadSession, SESSION_DIR } from './lib/session-loader.js';
import { isBanned } from './handlers/bans.js';
import { getStickerHash, getBoundCommand } from './handlers/stickers.js';
import { isShadowbanned } from './handlers/shadowban.js';
import { addToCache } from './handlers/cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_DIR = path.join(__dirname, 'handlers', 'events');

const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });

let sock = null;
let pluginMap = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_BACKOFF_MS = 5000;
const MAX_BACKOFF_MS  = 30000;
const sentMessageIds = new Set();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const log = (msg) => console.log(msg);
const success = (msg) => console.log(chalk.green(`  ✔ `) + chalk.gray(msg));
const info = (msg) => console.log(chalk.blue(`  ℹ `) + chalk.gray(msg));
const error = (msg) => console.log(chalk.red(`  ✖ `) + chalk.white(msg));

async function start() {
    log(chalk.cyan(`
  ██████  ██    ██ ███████ ███████ ███    ██ 
 ██    ██ ██    ██ ██      ██      ████   ██ 
 ██    ██ ██    ██ █████   █████   ██ ██  ██ 
 ██ ▄▄ ██ ██    ██ ██      ██      ██  ██ ██ 
  ██████   ██████  ███████ ███████ ██   ████ 
     ▀▀        X A V E N A  B O T
    `));
    
    log(chalk.gray(`  ─────────────────────────────────────────────\n`));

    info('Checking session...');
    await sleep(500);
    await loadSession(); 
    success('Session ID confirmed & loaded.');
    await sleep(500);

    info('Loading configuration...');
    await sleep(300);
    loadConfig();
    
    // ─── UPDATE FLAG CHECK ───
    const restartFlag = path.join(__dirname, 'restart.txt');
    if (fs.existsSync(restartFlag)) {
        try {
            const chatJid = fs.readFileSync(restartFlag, 'utf-8').trim();
            if (chatJid) {
                setTimeout(async () => {
                    try {
                        await sock.sendMessage(chatJid, { 
                            text: '✅ *Update Successful!*\n\nThe bot has successfully rebooted with the latest code from GitHub.\n\n> Powered by Queen Xavena' 
                        });
                        console.log('[update] Success message sent.');
                    } catch (e) {
                        console.error('[update] Failed to send success message:', e.message);
                    }
                }, 15000);
            }
            fs.unlinkSync(restartFlag); 
        } catch (e) {}
    }
    // ─── END UPDATE FLAG CHECK ───

    success('Configuration loaded.');
    await sleep(300);

    info('Installing plugins...');
    await sleep(300);
    const { map } = await loadPlugins();
    pluginMap = map;

    if (pluginMap.size === 0) {
        error('No plugins loaded. Exiting...');
        process.exit(1);
    }
    success(`Loaded ${pluginMap.size} commands successfully.`);
    await sleep(500);

    log(chalk.gray(`  ─────────────────────────────────────────────\n`));
    info('Connecting to WhatsApp...\n');
    
    await connect();
}

async function connect() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const { version } = await fetchLatestBaileysVersion().catch(() => ({
        version: [2, 3000, 1023223821]
    }));

    sock = makeWASocket({
        version,
        auth: state,
        logger,
        browser: Browsers.macOS('Chrome'),
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        defaultQueryTimeoutMs: 60000,
        getMessage: async () => ({ conversation: getBotName() })
    });

    const originalSend = sock.sendMessage;
    sock.sendMessage = async function (...argsSend) {
        try {
            let [targetJid, content, options = {}] = argsSend;
            const isPrivateChat = targetJid && (targetJid.endsWith('@s.whatsapp.net') || targetJid.endsWith('@lid'));

            if (getAiTag() && isPrivateChat && content && typeof content === 'object') {
                const keys = Object.keys(content);
                const skipTypes = ['react', 'sticker', 'delete', 'protocolMessage', 'poll', 'ptv', 'audio'];
                const shouldSkip = keys.some(k => skipTypes.includes(k));
                if (!shouldSkip) content.ai = true;
            }

            const result = await originalSend.call(this, targetJid, content, options);
            if (result?.key?.id) {
                sentMessageIds.add(result.key.id);
                setTimeout(() => sentMessageIds.delete(result.key.id), 60000);
            }
            return result;
        } catch (err) { throw err; }
    };

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', handleConnectionUpdate);
    sock.ev.on('messages.upsert', handleMessagesUpsert);
    
    if (fs.existsSync(EVENTS_DIR)) {
        const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const mod = await import(`file://${path.join(EVENTS_DIR, file)}`);
            if (mod.default && typeof mod.default === 'function') mod.default(sock);
        }
    }
}

async function handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) log(chalk.yellow(`\n  ⚠ Please scan the QR code above to connect.\n`));

    if (connection === 'open') {
        reconnectAttempts = 0;
        await sleep(1000);
        log(chalk.green(`
  ┌───────────────────────────────────────────┐
  │   👑  QUEEN XAVENA CONNECTED SUCCESSFULLY │
  │   User    : ${sock.user?.name || 'Unknown'}                  
  │   Number  : ${sock.user?.id.split(':')[0]}                  
  │   Prefix  : ${getPrefix()}                               
  │   Plugins : ${pluginMap.size}                               
  │   Mode    : ${getMode()}                            
  └───────────────────────────────────────────┘
        `));
        return;
    }

    if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
            error('Session invalid. Please regenerate a new session ID.');
            process.exit(1);
        }
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            error('Max reconnects reached. Exiting...');
            process.exit(1);
        }
        reconnectAttempts++;
        const backoff = Math.min(BASE_BACKOFF_MS * reconnectAttempts, MAX_BACKOFF_MS);
        log(chalk.yellow(`\n  ⚠ Connection closed. Reconnecting in ${backoff / 1000}s...\n`));
        await delay(backoff);
        connect().catch(() => process.exit(1));
    }
}

async function handleMessagesUpsert({ messages, type }) {
    if (type !== 'notify') return;
    for (const m of messages) {
        try { await handleMessage(m); } catch (err) { error(`Handler error: ${err.message}`); }
    }
}

async function handleMessage(m) {
    if (!m?.message || !m.key?.remoteJid) return;

    // Cache message for Antidelete
    if (m.key.id) {
        addToCache(m.key.id, m);
    }

    const jid = m.key.remoteJid;
    if (jid === 'status@broadcast' || jid.endsWith('@broadcast')) return;
    if (m.message?.reactionMessage) return;

    // ─── SHADOWBAN ───
    if (jid.endsWith('@g.us') && m.key.participant) {
        if (isShadowbanned(jid, m.key.participant)) {
            try {
                await sock.sendMessage(jid, { delete: { remoteJid: jid, fromMe: false, id: m.key.id, participant: m.key.participant } });
            } catch (err) {}
            return; 
        }
    }

    const currentPrefix = getPrefix();
    const rawText = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
    
    // ─── AI ROUTING (No Prefix) ───
    if (!rawText.startsWith(currentPrefix) && rawText.trim()) {
        
        if (m.key.fromMe) return; 

        const isOwn = await isOwner(m, sock);
        const isSud = await isSudo(m, sock);
        let role = 'Regular Member';
        if (isOwn) role = 'Lord Xaven (Your Creator / Supreme Owner)';
        else if (isSud) role = 'Sudo Admin';
        const chatType = jid.endsWith('@g.us') ? 'Group Chat' : 'Private DM';
        const pushName = m.pushName || 'User';

        // ─── NLP TRIGGER ───
        const isNlpTrigger = /\bxavena\b/i.test(rawText); 
        
        if (getNlpMode() && isNlpTrigger) {
            const cleanText = rawText.replace(/\bxavena\b/gi, '').replace(/^[,.\s]+|[,.\s]+$/g, '').trim();
            
            if (cleanText) {
                if (getMode() === 'private') {
                    const allowed = isOwn || isSud;
                    if (!allowed) return;
                }

                const availableCmds = Array.from(pluginMap.keys());
                const intent = await parseCommandIntent(cleanText, availableCmds);
                
                if (intent && intent.command && pluginMap.has(intent.command)) {
                    const plugin = pluginMap.get(intent.command);
                    
                    const ctx = await buildContext(sock, m);
                    if (ctx) {
                        const intentArgs = Array.isArray(intent.args) ? intent.args.join(' ') : '';
                        ctx.text = `${currentPrefix}${intent.command} ${intentArgs}`.trim();
                        
                        const [cmdRaw, ...args] = ctx.text.slice(currentPrefix.length).trim().split(/\s+/);
                        
                        const check = await canUse(m, plugin, sock);
                        if (check.ok) {
                            ctx.pluginMap = pluginMap;
                            await plugin.execute(sock, m, args, ctx);
                            
                            // NLP CONFIRMATION REPLY
                            const confirmPrompt = `You are Queen Xavena. The user told you: "${rawText}". You just successfully executed the "${intent.command}" command for them. Give a very short, natural confirmation in your persona (e.g., "Done, I've handled that.", "As you wish, it's taken care of.").`;
                            const aiReply = await getChatbotResponse(confirmPrompt, pushName, role, chatType);
                            if (aiReply) {
                                await sock.sendMessage(jid, { text: aiReply }, { quoted: m });
                            }
                            return;
                        }
                    }
                }
            }
        }

        // ─── CHATBOT TRIGGER ───
        if (getChatbotMode()) {
            if (getMode() === 'private' && !isOwn && !isSud) return; 

            if (jid.endsWith('@g.us')) {
                const botNumber = extractRawId(sock.user.id);
                const botLid = sock.user.lid ? extractRawId(sock.user.lid) : null;

                // Dynamically extract contextInfo based on the message type
                const msgType = Object.keys(m.message)[0];
                const contextInfo = m.message[msgType]?.contextInfo;

                const mentions = contextInfo?.mentionedJid || [];

                // 1. Check if bot is mentioned (handles both Phone Number and LID)
                const isMentioned = mentions.some(j => {
                    const raw = extractRawId(j);
                    return raw === botNumber || (botLid && raw === botLid);
                });

                // 2. Check if user is replying to the bot
                let isReplyToBot = false;
                if (contextInfo && contextInfo.participant) {
                    const rawParticipant = extractRawId(contextInfo.participant);
                    isReplyToBot = rawParticipant === botNumber || (botLid && rawParticipant === botLid);
                }

                // 3. Check if name is called
                const isNameCalled = /\bxavena\b/i.test(rawText);

                if (!isMentioned && !isReplyToBot && !isNameCalled) return;
            }

            const aiReply = await getChatbotResponse(rawText, pushName, role, chatType);
            if (aiReply) {
                await sock.sendMessage(jid, { text: aiReply }, { quoted: m });
            }
            return;
        }

        return; 
    }

    if (!rawText.startsWith(currentPrefix)) return;

    // ─── BAN CHECK ───
    const rawSender = m.key.participant || m.key.remoteJid;
    const resolvedSender = await getRealJid(rawSender, sock);
    const rawId = extractRawId(rawSender);

    if (isBanned([resolvedSender, rawId])) {
        await sock.sendMessage(jid, { 
            text: `⛔ *Access Denied*\n\nYou have been banned from using this bot.\nIf you think this is a mistake, contact the owner.` 
        }, { quoted: m });
        return; 
    }

    if (m.key.fromMe) {
        if (sentMessageIds.has(m.key.id)) {
            sentMessageIds.delete(m.key.id);
            return;
        }
    }

    const ctx = await buildContext(sock, m);
    if (!ctx) return;

    if (ctx.type === 'stickerMessage') {
        const media = await ctx.getMedia();
        if (media && media.isSticker) {
            const hash = getStickerHash(media.buffer);
            const boundCmd = getBoundCommand(hash);
            if (boundCmd) ctx.text = `${currentPrefix}${boundCmd}`;
        }
    }

    if (!ctx.text || !ctx.text.startsWith(currentPrefix)) return;

    const body = ctx.text.slice(currentPrefix.length).trim();
    if (!body) return;

    const [cmdRaw, ...args] = body.split(/\s+/);
    const cmd = cmdRaw.toLowerCase();

    const plugin = pluginMap.get(cmd);
    if (!plugin) return;

    // ─── EXPLICIT MODE & ROLE CHECK ───
    const currentMode = getMode();
    const userIsOwner = await isOwner(m, sock);
    const userIsSudo = await isSudo(m, sock);

    if (currentMode === 'private' && !userIsOwner && !userIsSudo) {
        return; 
    }

    if (plugin.ownerOnly && !userIsOwner) {
        await ctx.reply('🔒 Owner only.');
        return;
    }

    ctx.pluginMap = pluginMap;

    try {
        await plugin.execute(sock, m, args, ctx);
    } catch (err) {
        console.error(chalk.red(`[Plugin Error] ${cmd}:`), err);
        try { await ctx.reply(`❌ *Command Error*\n\nAn error occurred while running \`.${cmd}\`.\n_Error: ${err.message}_`); } catch (e) {}
    }
}

process.on('unhandledRejection', (reason) => console.error(chalk.red('\n[ANTI-CRASH] Unhandled Rejection:'), reason));
process.on('uncaughtException', (err) => console.error(chalk.red('\n[ANTI-CRASH] Uncaught Exception:'), err));

async function shutdown(signal) {
    log(chalk.yellow(`\n  ⚠ Received ${signal}. Shutting down gracefully...`));
    if (sock) { try { await sock.end(undefined); } catch {} }
    process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => {
    error(`Fatal Boot Error: ${err.message}`);
    process.exit(1);
});