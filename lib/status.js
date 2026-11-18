export const STATUS_RING_NAME = 'Xavena';
export const STATUS_RING_EMOJIS = ['👑', '🦇', '🌹'];
let statusEmojiIndex = 0;

export const CHANNEL_JID = '120363406549205665@newsletter';
export const CHANNEL_NAME = '—͟͞͞★『 xᴀᴠᴇɴ ᴛᴇᴄʜ';
export const CHANNEL_SERVER_MESSAGE_ID = 143;

export const STATUS_RING_PALETTE = {
  red: '#E53935',
  pink: '#E91E8C',
  blue: '#2196F3',
  yellow: '#F4C20D',
  purple: '#9C27B0'
};
export const STATUS_RING_CYCLE = ['red', 'pink', 'blue', 'yellow', 'purple'];
let statusRingIndex = 0;

const STATUS_COLOR_ALIASES = {
  magenta: 'pink',
  violet: 'purple',
  orange: 'yellow',
  gold: 'yellow'
};

export const TONESTER_STATUS_COLORS = [
  '#000000', '#050505', '#0A0A0A', '#101010', '#141414', '#1A1A1A', '#1F1F1F',
  '#C0C0C0', '#A8A8A8', '#8A8A8A', '#808080', '#6B6B6B',
  '#000080', '#00008B', '#0A1628', '#0D1B2A', '#1B263B', '#1565C0', '#0D47A1', '#2196F3',
  '#030303', '#080808', '#0C0C0C', '#111111', '#151515', '#181818', '#1C1C1C', '#202020',
  '#0B0B0F', '#0E0E12', '#121218', '#16161C', '#1A1A22',
  '#1A1A1A', '#222222', '#2A2A2A', '#2F2F2F', '#333333', '#3A3A3A',
  '#1C1C1E', '#242426', '#2C2C2E', '#323234',
  '#1A0508', '#22080C', '#2A0A10', '#320C14', '#3A0E18', '#4A101C',
  '#5C1422', '#6B1828', '#7A1C2E', '#8B1E30', '#9B2034',
  '#4A0E18', '#5A121C', '#6A1620', '#3D0C14', '#2C0810',
  '#5C001A', '#6E0020', '#800020', '#8B0000', '#A00028', '#B00030',
  '#4A000F', '#3B000C', '#2D0009', '#1F0006',
  '#5C1A1A', '#6B2020', '#7A2626', '#4A1414', '#3A1010',
  '#2B0A14', '#3A1020', '#4A1828', '#5A2030', '#6A2838', '#7A3040',
  '#4C1A28', '#5C2230', '#3C1420', '#2C0E18',
  '#501828', '#601E30', '#702438', '#401020',
  '#1A0A18', '#220E20', '#2A1228', '#321630', '#3A1A38',
  '#1C0C1C', '#241024', '#2C142C', '#341834',
  '#050810', '#080C16', '#0C101C', '#101424', '#141828', '#181C2C',
  '#0A0E18', '#0E1220', '#121624', '#161A28',
  '#800020', '#4A0000', '#2A0000', '#1A0000',
  '#0D1B2A', '#1B263B', '#415A77', '#778DA9'
];

function normaliseStatusColor(input) {
  if (!input) return null;
  const key = String(input).trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (STATUS_COLOR_ALIASES[key]) return STATUS_COLOR_ALIASES[key];
  if (STATUS_RING_PALETTE[key]) return key;
  return null;
}

export function parseStatusColor(message) {
  const parts = String(message || '').trim().split(/\s+/);
  if (parts.length < 2) return { text: message, color: null };
  const last = parts[parts.length - 1];
  const color = normaliseStatusColor(last);
  if (!color) return { text: message, color: null };
  return { text: parts.slice(0, -1).join(' ').trim(), color };
}

function getStatusRingColor(override) {
  if (override && STATUS_RING_PALETTE[override]) return override;
  const colour = STATUS_RING_CYCLE[statusRingIndex % STATUS_RING_CYCLE.length];
  statusRingIndex += 1;
  return colour;
}

function buildChannelCtx() {
  return {
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: {
      newsletterJid: CHANNEL_JID,
      newsletterName: CHANNEL_NAME,
      serverMessageId: CHANNEL_SERVER_MESSAGE_ID
    }
  };
}

function nextStatusEmoji() {
  const emoji = STATUS_RING_EMOJIS[statusEmojiIndex % STATUS_RING_EMOJIS.length];
  statusEmojiIndex += 1;
  return emoji;
}

function buildStatusAudienceCtx(ringColorOverride) {
  const ringColor = getStatusRingColor(ringColorOverride);
  return {
    isGroupStatus: true,
    statusSourceType: 4,
    pairedMediaType: 0,
    statusAttributions: [{ type: 6 }],
    statusAudienceMetadata: {
      audienceType: 2,
      listName: STATUS_RING_NAME,
      listEmoji: nextStatusEmoji(),
      ringColor,
      ringColorHex: STATUS_RING_PALETTE[ringColor]
    }
  };
}

export function mergeStatusContextInfo(existing, ringColorOverride) {
  const base = existing && typeof existing === 'object' ? { ...existing } : {};
  const audience = buildStatusAudienceCtx(ringColorOverride);
  const channel = buildChannelCtx();
  return {
    ...base,
    ...audience,
    ...channel,
    ...(base.externalAdReply ? { externalAdReply: base.externalAdReply } : {}),
    ...(base.quotedMessage ? { quotedMessage: base.quotedMessage } : {}),
    ...(base.mentionedJid ? { mentionedJid: base.mentionedJid } : {})
  };
}

export function randomStatusColor() {
  return TONESTER_STATUS_COLORS[Math.floor(Math.random() * TONESTER_STATUS_COLORS.length)];
}