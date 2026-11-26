import crypto from 'crypto';

const AUDIO_STICKER_FIELD = 134;
const STICKER_IN_MESSAGE = 26;
const AUDIO_IN_STICKER = 26;

const varint = (n) => { const o = []; while (n > 127) { o.push((n & 127) | 128); n = Math.floor(n / 128); } o.push(n); return Buffer.from(o); };
const field = (num, buf) => Buffer.concat([varint(num * 8 + 2), varint(buf.length), buf]);

export function installPatch(proto) {
  const M = proto.Message;
  if (M.__audioStickerPatched) return true;
  const orig = M.encode;
  if (typeof orig !== 'function') return false;
  M.encode = function (m, w) {
    const writer = orig.call(this, m, w);
    if (m && m.__audioSticker) writer.uint32(AUDIO_STICKER_FIELD * 8 + 2).bytes(m.__audioSticker);
    return writer;
  };
  M.__audioStickerPatched = true;
  return true;
}

export function buildAudioSticker(proto, stickerObj, audioObj) {
  const S = proto.Message.StickerMessage, A = proto.Message.AudioMessage;
  const stickerBytes = Buffer.from(S.encode(S.create(stickerObj)).finish());
  const audioBytes = Buffer.from(A.encode(A.create(audioObj)).finish());
  const stickerWithAudio = Buffer.concat([stickerBytes, field(AUDIO_IN_STICKER, audioBytes)]);
  const innerMessage = field(STICKER_IN_MESSAGE, stickerWithAudio);   
  return field(1, innerMessage);                                      
}

export function selfTest(proto) {
  try {
    if (!installPatch(proto)) return false;
    const bytes = Buffer.from(proto.Message.encode({ __audioSticker: Buffer.from([1, 2, 3]) }).finish());
    return bytes.includes(Buffer.concat([varint(AUDIO_STICKER_FIELD * 8 + 2), Buffer.from([3, 1, 2, 3])]));
  } catch { return false; }
}