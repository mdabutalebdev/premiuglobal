/**
 * YouTube helpers — extract the video ID from any common YouTube URL format
 * and build an embed URL suitable for a muted, looping background hero banner.
 */

/** Extracts the 11-char video ID from watch / youtu.be / embed / shorts URLs. */
export function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
        /(?:youtu\.be\/)([\w-]{11})/,
        /(?:youtube\.com\/embed\/)([\w-]{11})/,
        /(?:youtube\.com\/shorts\/)([\w-]{11})/,
        /(?:youtube\.com\/v\/)([\w-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m?.[1]) return m[1];
    }
    // Bare ID
    if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
    return null;
}

/** Whether the given string looks like a valid YouTube URL/ID. */
export function isValidYouTube(url: string): boolean {
    return getYouTubeId(url) !== null;
}

/** Builds an autoplay + muted + looping embed URL (no controls) for a hero banner. */
export function getYouTubeEmbedUrl(url: string): string | null {
    const id = getYouTubeId(url);
    if (!id) return null;
    const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        loop: '1',
        playlist: id, // required for loop to work on a single video
        controls: '0',
        showinfo: '0',
        modestbranding: '1',
        rel: '0',
        playsinline: '1',
        disablekb: '1',
        fs: '0',
        iv_load_policy: '3',
    });
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

/** Returns the standard YouTube thumbnail URL for previews. */
export function getYouTubeThumbnail(url: string): string | null {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
