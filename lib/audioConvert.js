import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export function ffmpegBin() {
    return ffmpegPath;
}

export function toOpusVoice(buffer, maxSec = 6) {
    return new Promise((resolve, reject) => {
        const inp = path.join(os.tmpdir(), `in_${Date.now()}`);
        const out = path.join(os.tmpdir(), `out_${Date.now()}.ogg`);
        fs.writeFileSync(inp, buffer);

        const p = spawn(ffmpegPath, ['-y', '-t', String(maxSec), '-i', inp, '-vn', '-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on', '-compression_level', '10', '-ar', '48000', '-ac', '1', out]);
        
        let err = '';
        p.stderr.on('data', d => { err += d.toString(); });
        p.on('error', reject);
        p.on('close', c => {
            try { fs.unlinkSync(inp); } catch {}
            if (c === 0) {
                const result = fs.readFileSync(out);
                try { fs.unlinkSync(out); } catch {}
                resolve(result);
            } else {
                reject(new Error(err || `ffmpeg exited ${c}`));
            }
        });
    });
}