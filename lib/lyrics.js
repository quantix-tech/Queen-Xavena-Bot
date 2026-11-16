import axios from 'axios';

// ═════════
//  LYRICS SYSTEM HELPERS
// ═════════
function normalizeForMatch(str) {
    return (str || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[’‘‛`]/g, "'")
        .replace(/[“”„]/g, '"')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

const DISALLOWED_QUALIFIERS = [
    'parody', 'parodia', 'парадия', 'пародия',
    'cover', 'remix', 'instrumental', 'karaoke',
    'live', 'tribute', 'acoustic version', 'type beat',
    'reaction', 'reversed', 'slowed', 'sped up', 'nightcore', 'mashup'
];

function hasDisallowedQualifier(text) {
    return DISALLOWED_QUALIFIERS.some(q => text.includes(normalizeForMatch(q)));
}

function isStrictMatch({ requestedArtist, requestedTitle }, { candidateArtist, candidateTitle }) {
    const reqTitle = normalizeForMatch(requestedTitle);
    const candTitle = normalizeForMatch(candidateTitle);
    if (!reqTitle || !candTitle || candTitle !== reqTitle) return false;

    if (requestedArtist) {
        const reqArtist = normalizeForMatch(requestedArtist);
        const candArtist = normalizeForMatch(candidateArtist);
        if (!reqArtist || candArtist !== reqArtist) return false;
    }

    const requestedHadQualifier = hasDisallowedQualifier(reqTitle);
    if (!requestedHadQualifier && hasDisallowedQualifier(candTitle)) return false;

    return true;
}

function parseLyricsQuery(query) {
    let m = query.match(/^(.+?)\s*-\s*(.+)$/);
    if (m) return { artist: m[1].trim(), title: m[2].trim() };

    m = query.match(/^(.+?)\s+by\s+(.+)$/i);
    if (m) return { artist: m[2].trim(), title: m[1].trim() };

    return { artist: null, title: query.trim() };
}

// ─── Provider 1: LRCLIB ───
async function fetchLyricsFromLRCLIB(query) {
    const { artist, title } = parseLyricsQuery(query);
    const BASE = 'https://lrclib.net/api';

    if (artist) {
        try {
            const { data } = await axios.get(`${BASE}/get`, {
                params: { artist_name: artist, track_name: title },
                timeout: 15000
            });
            if (data?.trackName && isStrictMatch(
                { requestedArtist: artist, requestedTitle: title },
                { candidateArtist: data.artistName, candidateTitle: data.trackName }
            )) {
                return {
                    success: true,
                    title: data.trackName,
                    artist: data.artistName,
                    album: data.albumName || null,
                    duration: data.duration || null,
                    lyrics: (data.plainLyrics || '').trim(),
                    source: 'LRCLIB'
                };
            }
        } catch (e) { /* fall through to search */ }
    }

    try {
        const params = { track_name: title };
        if (artist) params.artist_name = artist;

        const { data } = await axios.get(`${BASE}/search`, { params, timeout: 15000 });
        const results = Array.isArray(data) ? data : [];

        const match = results.find(r =>
            r.plainLyrics && isStrictMatch(
                { requestedArtist: artist, requestedTitle: title },
                { candidateArtist: r.artistName, candidateTitle: r.trackName }
            )
        );

        if (match) {
            return {
                success: true,
                title: match.trackName,
                artist: match.artistName,
                album: match.albumName || null,
                duration: match.duration || null,
                lyrics: (match.plainLyrics || '').trim(),
                source: 'LRCLIB'
            };
        }
    } catch (e) { /* fall through */ }

    return { success: false };
}

// ─── Provider 2: Lyrics.ovh ───
async function fetchLyricsFromOvh(artist, title) {
    if (!artist) return { success: false };

    try {
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
        const res = await axios.get(url, { timeout: 10000 });

        if (!res.data?.lyrics?.trim()) return { success: false };

        return {
            success: true,
            title: title,
            artist: artist,
            album: null,
            duration: null,
            lyrics: res.data.lyrics.trim(),
            source: 'Lyrics.ovh'
        };
    } catch (e) {
        return { success: false };
    }
}

// ─── Orchestrator ───
export async function getLyrics(query) {
    // 1. LRCLIB
    const lrclib = await fetchLyricsFromLRCLIB(query);
    if (lrclib.success && lrclib.lyrics) return lrclib;

    // 2. Lyrics.ovh
    const { artist, title } = parseLyricsQuery(query);
    const ovh = await fetchLyricsFromOvh(artist, title);
    if (ovh.success && ovh.lyrics) return ovh;

    return { success: false, error: 'Lyrics not found.' };
}