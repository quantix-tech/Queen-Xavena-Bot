import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

function extractInviteCode(input) {
  const m = String(input || '').match(/whatsapp\.com\/channel\/([\w-]+)/i);
  if (m) return m[1];
  if (/^[\w-]{10,}$/.test(String(input || '').trim())) return String(input).trim();
  return null;
}

function decodeHtmlEntities(str) {
  if (!str) return str;
  return String(str)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ''; }
    })
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCodePoint(parseInt(n, 10)); } catch { return ''; }
    })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanName(name) {
  if (!name) return null;
  let s = decodeHtmlEntities(name);
  s = s.replace(/\s*-\s*WhatsApp channel\s*$/i, '').trim();
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length > 80) s = s.slice(0, 77) + '...';
  return s || null;
}

function pickName(meta) {
  if (!meta || typeof meta !== 'object') return null;
  if (typeof meta.name === 'string' && meta.name.trim()) return cleanName(meta.name);
  if (typeof meta.subject === 'string' && meta.subject.trim()) return cleanName(meta.subject);
  const tm = meta.thread_metadata;
  if (tm && typeof tm === 'object') {
    if (typeof tm.name === 'string' && tm.name.trim()) return cleanName(tm.name);
    if (tm.name && typeof tm.name.text === 'string' && tm.name.text.trim()) return cleanName(tm.name.text);
  }
  return null;
}

function pickSubscribers(meta) {
  if (!meta || typeof meta !== 'object') return null;
  if (meta.subscribers != null && meta.subscribers !== '') return meta.subscribers;
  if (meta.subscriberCount != null && meta.subscriberCount !== '') return meta.subscriberCount;
  const tm = meta.thread_metadata;
  if (tm && tm.subscribers_count != null && tm.subscribers_count !== '') return tm.subscribers_count;
  if (meta._followersFromWeb != null) return meta._followersFromWeb;
  return null;
}

function pickVerification(meta) {
  if (!meta || typeof meta !== 'object') return null;
  if (meta.verification) return meta.verification;
  const tm = meta.thread_metadata;
  if (tm && tm.verification) return tm.verification;
  return null;
}

// FIX: strip binary / control chars that break the JID in Baileys errors
function cleanBinaryText(text) {
  if (!text) return '';
  let s = '';
  if (Buffer.isBuffer(text)) s = text.toString('utf8');
  else if (typeof text === 'object') {
    try { s = JSON.stringify(text); } catch { s = String(text); }
  } else s = String(text);
  // Remove control chars, replacement char, and escaped \u00xx sequences
  return s
    .replace(/\\u00[0-9a-fA-F]{2}/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\uFFFD]/g, '')
    .replace(/\\x[0-9a-fA-F]{2}/g, '');
}

function extractNewsletterJidFromText(text) {
  if (!text) return null;
  const s = cleanBinaryText(text);
  const full = s.match(/(120363\d{6,})@newsletter/);
  if (full) return full[1] + '@newsletter';
  const num = s.match(/(120363\d{10,})/);
  if (num) return num[1] + '@newsletter';
  // Last resort: digits split by junk chars - join all digit runs starting with 120363
  const joined = s.replace(/[^0-9]/g, ' ').split(/\s+/).join('');
  const joinedMatch = joined.match(/(120363\d{10,})/);
  if (joinedMatch) return joinedMatch[1] + '@newsletter';
  return null;
}

function normalizeMeta(raw, fallbackJid) {
  if (!raw || typeof raw !== 'object') {
    return fallbackJid ? { id: fallbackJid } : null;
  }
  const meta = raw.id ? raw : (raw.result && raw.result.id ? raw.result : raw);
  const id = meta.id || fallbackJid;
  if (!id) return null;
  return {
    id: String(id).includes('@') ? String(id) : String(id) + '@newsletter',
    name: pickName(meta),
    subscribers: pickSubscribers(meta),
    verification: pickVerification(meta),
    _followersFromWeb: meta._followersFromWeb || null
  };
}

async function resolveViaBaileys(sock, inviteCode) {
  if (typeof sock.newsletterMetadata !== 'function') {
    throw new Error('newsletterMetadata unavailable');
  }
  try {
    const raw = await sock.newsletterMetadata('invite', inviteCode);
    const meta = normalizeMeta(raw);
    if (meta && meta.id) return meta;
    throw new Error('empty metadata');
  } catch (err) {
    // Search EVERYWHERE the JID could be hiding - message, stack, data, cause
    const candidates = [
      err && err.message,
      err && err.stack,
      err && err.data,
      err && err.cause && err.cause.message,
      err && err.cause && err.cause.data,
    ];
    for (const c of candidates) {
      const jid = extractNewsletterJidFromText(c);
      if (jid) {
        console.log('[Newsletter] recovered jid from baileys error: ' + jid);
        return { id: jid, name: null, subscribers: null, verification: null };
      }
    }
    // Also try full stringified error (handles Buffer / nested objects)
    try {
      const full = JSON.stringify(err, Object.getOwnPropertyNames(err || {}));
      const jid = extractNewsletterJidFromText(full);
      if (jid) return { id: jid, name: null, subscribers: null, verification: null };
    } catch (_) {}
    throw err;
  }
}

async function resolveViaWeb(inviteCode) {
  const url = 'https://www.whatsapp.com/channel/' + inviteCode;
  const { data: html } = await axios.get(url, {
    timeout: 15000,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml'
    },
    validateStatus: (s) => s >= 200 && s < 400
  });
  const text = typeof html === 'string' ? html : String(html || '');
  const jid = extractNewsletterJidFromText(text);

  let name = null;
  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) name = cleanName(titleMatch[1]);
  // og:title fallback - whatsapp.com often puts name there
  if (!name) {
    const og = text.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (og) name = cleanName(og[1]);
  }

  let followersFromWeb = null;
  const followMatch = text.match(/Join\s+([\d,]+)\s+followers?/i) || text.match(/([\d,]+)\s+followers?/i);
  if (followMatch) followersFromWeb = followMatch[1].replace(/,/g, '');

  if (!jid && !name) throw new Error('web resolve found nothing');
  return {
    id: jid || null,
    name,
    subscribers: followersFromWeb,
    _followersFromWeb: followersFromWeb,
    verification: null,
    source: 'web'
  };
}

export default {
  command: 'newsletter',
  aliases: ['channel', 'news'],
  description: 'Resolve a WhatsApp channel link to its newsletter JID',
  category: 'Tools',
  usage: 'newsletter <channel link>',

  async execute(sock, m, args, ctx) {
    const prefix = getPrefix();
    const input = args.join(' ').trim();
    if (!input) {
      return ctx.reply(`❌ *Error*\n\nGive me a channel link.\n\nExample: \`${prefix}newsletter https://whatsapp.com/channel/0029...\``);
    }

    const inviteCode = extractInviteCode(input);
    if (!inviteCode) {
      return ctx.reply('❌ *Error*\n\nThat doesn\'t look like a valid WhatsApp channel link.');
    }

    let meta = null;

    try {
      meta = await resolveViaBaileys(sock, inviteCode);
    } catch (err) {
      console.log('[Newsletter] baileys resolve failed: ' + err.message);
    }

    try {
      const web = await resolveViaWeb(inviteCode);
      if (!meta) {
        meta = web;
      } else {
        meta.name = meta.name || web.name;
        meta.id = meta.id || web.id;
        if (meta.subscribers == null && web.subscribers != null) meta.subscribers = web.subscribers;
        if (web._followersFromWeb) meta._followersFromWeb = web._followersFromWeb;
      }
    } catch (err) {
      console.log('[Newsletter] web resolve failed: ' + err.message);
    }

    if (!meta || !meta.id) {
      return ctx.reply('❌ *Error*\n\nCould not resolve that channel invite. The channel may be private, deleted, or WhatsApp blocked the lookup. Try again with a different link.');
    }

    const verified = String(meta.verification || '').toUpperCase() === 'VERIFIED';
    const followers = pickSubscribers(meta);

    const text =
`╭─「 *CHANNEL INFO* 」─
│
│  📢 *Name:* ${meta.name || 'WhatsApp Channel'}
│  ✅ *Verified:* ${verified ? 'Yes' : 'No'}
${followers != null ? `│  👥 *Followers:* ${followers}\n` : ''}│  🆔 *Newsletter JID:*
│  \`${meta.id}\`
│
╰──────────────────╯`;

    return ctx.reply(text);
  }
};