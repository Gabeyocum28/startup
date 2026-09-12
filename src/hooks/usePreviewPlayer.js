import React from 'react';

// Plays one 30-second Deezer preview at a time. Returns { playingId, toggle }.
export function usePreviewPlayer() {
    const audioRef = React.useRef(null);
    const [playingId, setPlayingId] = React.useState(null);

    const toggle = React.useCallback((id, previewUrl) => {
        if (!previewUrl) return;
        if (playingId === id) {
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }
        audioRef.current?.pause();
        const audio = new Audio(previewUrl);
        audio.volume = 0.5;
        audio.play().catch(() => setPlayingId(null));
        audio.onended = () => setPlayingId(null);
        audioRef.current = audio;
        setPlayingId(id);
    }, [playingId]);

    React.useEffect(() => () => audioRef.current?.pause(), []);

    return { playingId, toggle };
}
