// lib/theme.js — SILENT TECH logic, adapted for ESM + @itsliaaa/baileys
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { proto } from '@itsliaaa/baileys';

const require = createRequire(import.meta.url);

// ---------- PART 1: COLOUR NAMES ----------
const _stNormHex = h => {
  const COLORS = {
    red: 'FF0000', green: '00FF00', blue: '0000FF', yellow: 'FFFF00',
    orange: 'FF8000', pink: 'FF69B4', purple: '800080', black: '000000',
    white: 'FFFFFF', brown: 'A52A2A', grey: '808080', gray: '808080',
    cyan: '00FFFF', lime: '00FF00', gold: 'FFD700', silver: 'C0C0C0',
    maroon: '800000', navy: '000080', teal: '008080', magenta: 'FF00FF',
    violet: '8A2BE2', indigo: '4B0082', peach: 'FFDAB9', sky: '87CEEB',
    mint: '98FF98', coral: 'FF7F50', lavender: 'E6E6FA', crimson: 'DC143C',
    turquoise: '40E0D0'
  };
  const name = String(h || '').trim().toLowerCase();
  if (COLORS[name]) return '#' + COLORS[name] + 'FF';
  const s = name.replace(/^#/, '').toUpperCase();
  if (/^[0-9A-F]{6}$/.test(s)) return '#' + s + 'FF';
  if (/^[0-9A-F]{8}$/.test(s)) return '#' + s;
  return null;
};

export const __stThemeArgb = (name) => {
  const h = _stNormHex(name);
  if (!h) return null;
  return (0xFF000000 | parseInt(h.slice(1, 7), 16)) >>> 0;
};

// ---------- PART 2: PROTO PATCH (field 30, tag 242) ----------
export function __stThemePatchProto(p) {
  const M = p && p.Message;
  if (!M || M.__stThemePatched) return;
  const PM = M.ProtocolMessage;
  if (PM) {
    if (PM.Type && PM.Type.CHAT_THEME_SETTING == null) {
      PM.Type.CHAT_THEME_SETTING = 34;
      PM.Type[34] = 'CHAT_THEME_SETTING';
    }
    if (typeof PM.encode === 'function') {
      const prevPMEncode = PM.encode;
      PM.encode = function (message, writer) {
        const cts = message && message.chatThemeSetting;
        if (cts && Object.prototype.hasOwnProperty.call(message, 'chatThemeSetting')) delete message.chatThemeSetting;
        const w = prevPMEncode.call(this, message, writer);
        if (cts) {
          message.chatThemeSetting = cts;
          const sub = w.uint32(242).fork();
          if (cts.settingTimestampMs != null) sub.uint32(8).int64(cts.settingTimestampMs);
          if (cts.clearTheme) sub.uint32(16).bool(true);
          if (cts.colorSchemeId) sub.uint32(26).string(cts.colorSchemeId);
          if (cts.solidColor) {
            const sc = sub.uint32(90).fork();
            if (cts.solidColor.backgroundLightArgb != null) sc.uint32(13).fixed32(cts.solidColor.backgroundLightArgb >>> 0);
            if (cts.solidColor.backgroundDarkArgb != null) sc.uint32(21).fixed32(cts.solidColor.backgroundDarkArgb >>> 0);
            if (cts.solidColor.isDoodleEnabled != null) sc.uint32(24).bool(!!cts.solidColor.isDoodleEnabled);
            sc.ldelim();
          }
          if (cts.customImage) {
            const ci = sub.uint32(106).fork();
            if (cts.customImage.directPath) ci.uint32(10).string(cts.customImage.directPath);
            if (cts.customImage.mediaKey) ci.uint32(18).bytes(cts.customImage.mediaKey);
            if (cts.customImage.fileEncSha256) ci.uint32(26).bytes(cts.customImage.fileEncSha256);
            if (cts.customImage.fileSha256) ci.uint32(34).bytes(cts.customImage.fileSha256);
            if (cts.customImage.dimLevel != null) ci.uint32(45).float(cts.customImage.dimLevel);
            ci.ldelim();
          }
          sub.ldelim();
        }
        return w;
      };
    }
    if (typeof PM.fromObject === 'function') {
      const prevPMFromObj = PM.fromObject;
      PM.fromObject = function (object) {
        const msg = prevPMFromObj.call(this, object);
        if (object && object.chatThemeSetting) msg.chatThemeSetting = object.chatThemeSetting;
        return msg;
      };
    }
  }
  M.__stThemePatched = true;
}

export function __stThemeEnsurePatched() { try { __stThemePatchProto(proto); } catch {} }

// ---------- PART 3: SEND + RESTART ----------
export const __stThemeRestartSoon = () => { setTimeout(() => { try { process.exit(0); } catch {} }, 1500); };
export const __stThemeNeedRestart = () => globalThis.__stThemeServerPatch === 'patched';

export const __stThemeSend = async (sock, jid, setting, reply, cmdText) => {
  __stThemeEnsurePatched();
  const _sp = globalThis.__stThemeServerPatch;
  if (_sp === 'patched') {
    if (reply) await reply('Server patch installed — restarting the bot once to load it. Run ' + (cmdText || 'the command') + ' again in ~20 seconds.');
    __stThemeRestartSoon();
    return 'restart';
  }
  if (typeof _sp === 'string' && _sp.indexOf('failed') === 0) {
    if (reply) await reply('The server patch could not be applied (' + _sp + ') — the theme cannot apply without it.');
    return 'failed';
  }
  await sock.relayMessage(jid, {
    protocolMessage: { type: 34, chatThemeSetting: Object.assign({ settingTimestampMs: Date.now() }, setting) }
  }, { additionalAttributes: { type: 'media' } });
  return 'sent';
};

// ---------- PART 4: SERVER SELF-PATCH (mediatype chat_theme) ----------
export function __stThemePatchServerFile() {
  try {
    const _main = require.resolve('@itsliaaa/baileys');
    const _send = path.join(path.dirname(_main), 'Socket', 'messages-send.js');
    let _src = fs.readFileSync(_send, 'utf8');
    const _branchNeedle = "return 'chat_theme';";
    if (_src.includes(_branchNeedle)) return 'present';
    const _branch14 = "        if (message.protocolMessage && message.protocolMessage.type === 34) {\n            return 'chat_theme';\n        }\n";
    const _anchor14 = "    const getMediaType = (message) => {\n        if (message.imageMessage) {";
    const _branchVan = "    if (message.protocolMessage && message.protocolMessage.type === 34) {\n      return 'chat_theme';\n    }\n";
    const _anchorVan = "  const getMediaType = message => {\n    if (message.imageMessage) {";
    if (_src.includes(_anchor14)) {
      _src = _src.replace(_anchor14, "    const getMediaType = (message) => {\n" + _branch14 + "        if (message.imageMessage) {");
    } else if (_src.includes(_anchorVan)) {
      _src = _src.replace(_anchorVan, "  const getMediaType = message => {\n" + _branchVan + "    if (message.imageMessage) {");
    } else {
      return 'failed: getMediaType anchor not found';
    }
    fs.writeFileSync(_send, _src);
    const _after = fs.readFileSync(_send, 'utf8');
    if (!_after.includes(_branchNeedle)) return 'failed: write did not stick';
    return 'patched';
  } catch (e) { return 'failed: ' + (e && e.message ? e.message : String(e)); }
}
globalThis.__stThemeServerPatch = __stThemePatchServerFile();

// ---------- PART 5: WALLPAPER MAPPINGS FIX ----------
export function __stWallpaperFixMappings() {
  try {
    const _b = require('@itsliaaa/baileys');
    const _hk = _b.MEDIA_HKDF_KEY_MAPPING;
    const _pm = _b.MEDIA_PATH_MAP;
    if (_hk && _hk['chat-wallpaper-image'] == null) _hk['chat-wallpaper-image'] = 'Chat Wallpaper';
    if (_pm && _pm['chat-wallpaper-image'] == null) _pm['chat-wallpaper-image'] = '/mms/image';
  } catch {}
}