import Tesseract from 'tesseract.js';
import { downloadMediaMessage } from '@itsliaaa/baileys';

export default {
    command: 'ocr',
    category: 'Tools',
    description: 'Extract text from an image',
    usage: '.ocr (reply to an image)',
    aliases: ['readtext', 'imagetotext'],

    async execute(sock, m, args, ctx) {
        try {
            // 1. Get the image - quoted image or sent image
            let target = null;

            // Case A: reply to an image
            if (ctx.quoted && ctx.quoted.type === 'imageMessage') {
                target = {
                    key: ctx.quoted.key,
                    message: { imageMessage: ctx.quoted.message.imageMessage }
                };
            }
            // Case B: image sent with .ocr as caption
            else if (m.message?.imageMessage) {
                target = m;
            }
            // Case C: image in quoted via raw message
            else if (ctx.quoted?.message?.imageMessage) {
                target = {
                    key: ctx.quoted.key,
                    message: ctx.quoted.message
                };
            }

            if (!target) {
                return ctx.reply('📷 *Reply to an image* with `.ocr`\n\nExample:\nReply to a screenshot/photo > type `.ocr`');
            }

            await ctx.reply('🔍 Reading image...');

            const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: console });

            if (!buffer?.length) {
                return ctx.reply('❌ Could not download image. Try again.');
            }

            const lang = args[0]?.toLowerCase() || 'eng';
            const result = await Tesseract.recognize(buffer, lang);
            const text = result.data.text?.trim();

            if (!text) {
                return ctx.reply('❌ No text found in this image.');
            }

            await ctx.reply(`📝 *OCR Result:*\n\n${text}`);
        } catch (err) {
            console.error('[ocr]', err);
            await ctx.reply('❌ OCR failed: ' + (err?.message || err));
        }
    }
};