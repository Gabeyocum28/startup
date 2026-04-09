import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InlineRate } from '../services/InlineRate';
import '../app.css';
import './artist.css';

export function Artist() {
    const { artistId } = useParams();
    const navigate = useNavigate();
    const [artist, setArtist] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [playingTrack, setPlayingTrack] = React.useState(null);
    const audioRef = React.useRef(null);
    const [userRating, setUserRating] = React.useState(null);
    const [hoverRating, setHoverRating] = React.useState(0);

    React.useEffect(() => {
        const loadArtist = async () => {
            try {
                const response = await fetch(`/api/artist/${artistId}`);
                if (response.ok) {
                    const data = await response.json();
                    setArtist(data);
                } else {
                    setArtist(null);
                }
            } catch (error) {
                console.error('Error loading artist:', error);
                setArtist(null);
            } finally {
                setIsLoading(false);
            }
        };

        const loadUserRating = async () => {
            try {
                const res = await fetch(`/api/ratings/artist/${artistId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.rating) setUserRating(data.rating);
                }
            } catch (err) { /* ignore */ }
        };

        loadArtist();
        loadUserRating();

        return () => {
            if (audioRef.current) audioRef.current.pause();
        };
    }, [artistId]);

    const handleQuickRate = async (rating) => {
        try {
            const res = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId: artistId, contentType: 'artist', rating })
            });
            if (res.ok) setUserRating(rating);
        } catch (err) { /* ignore */ }
    };

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const handlePlayPreview = (track) => {
        if (!track.preview) return;

        if (playingTrack === track.id) {
            audioRef.current?.pause();
            setPlayingTrack(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(track.preview);
        audio.volume = 0.5;
        audio.play();
        audio.onended = () => setPlayingTrack(null);
        audioRef.current = audio;
        setPlayingTrack(track.id);
    };

    const handleImageError = (e) => {
        e.target.src = '/images/no_album_cover.jpg';
    };

    if (isLoading) {
        return <div><main><p>Loading artist...</p></main></div>;
    }

    if (!artist) {
        return (
            <div>
                <main>
                    <h1>Artist Not Found</h1>
                    <button className="aura" onClick={() => navigate('/search')}>Back to Search</button>
                </main>
            </div>
        );
    }

    return (
        <div>
            <main>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        marginBottom: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-color)',
                        fontSize: '1rem'
                    }}
                >
                    &larr; Back
                </button>

                <div className="artist-header">
                    <img
                        src={artist.image || '/images/no_album_cover.jpg'}
                        alt={artist.name}
                        className="artist-image"
                        onError={handleImageError}
                    />
                    <div className="artist-info">
                        <h1>{artist.name}</h1>
                        <p className="artist-fans">{artist.fans.toLocaleString()} fans</p>
                        <div className="quick-rate-row">
                            <div className="quick-stars" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map(starIndex => {
                                    const current = hoverRating || userRating || 0;
                                    let fillClass = 'empty';
                                    if (current >= starIndex) fillClass = 'full';
                                    else if (current >= starIndex - 0.5) fillClass = 'half';
                                    return (
                                        <div key={starIndex} className="quick-star-wrap">
                                            <div className="quick-star-half left" onMouseEnter={() => setHoverRating(starIndex - 0.5)} onClick={() => handleQuickRate(starIndex - 0.5)} />
                                            <div className="quick-star-half right" onMouseEnter={() => setHoverRating(starIndex)} onClick={() => handleQuickRate(starIndex)} />
                                            <span className="quick-star-bg">★</span>
                                            <span className={`quick-star-fill ${fillClass}`}>★</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <button className="review-icon-btn" title="Write a review" onClick={() => navigate('/review', { state: { contentId: artist.id, contentType: 'artist', contentName: artist.name, contentCover: artist.image, prefillRating: userRating } })}>✎</button>
                        </div>
                    </div>
                </div>

                {artist.topTracks.length > 0 && (
                    <div className="artist-section">
                        <h2>Popular Tracks</h2>
                        {artist.topTracks.map((track, index) => (
                            <div key={track.id} className="track-item" onClick={() => navigate(`/song/${track.id}`)} style={{ cursor: 'pointer' }}>
                                <div className="track-info">
                                    {track.preview && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePlayPreview(track); }}
                                            className="track-play-btn"
                                            title={playingTrack === track.id ? 'Pause' : 'Play preview'}
                                        >
                                            {playingTrack === track.id ? '⏸' : '▶'}
                                        </button>
                                    )}
                                    <span className="track-number">{index + 1}</span>
                                    <img
                                        src={track.image || '/images/no_album_cover.jpg'}
                                        alt={track.name}
                                        className="track-thumb"
                                        onError={handleImageError}
                                    />
                                    <div>
                                        <span className="track-name">
                                            {track.name}
                                            {track.explicit && <span className="explicit-tag">🅴</span>}
                                        </span>
                                        <span className="track-album-name">{track.albumName}</span>
                                    </div>
                                </div>
                                <InlineRate
                                    contentId={track.id}
                                    contentType="track"
                                    contentName={track.name}
                                    artistName={artist.name}
                                    contentCover={track.image}
                                />
                                <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {artist.albums.length > 0 && (
                    <div className="artist-section">
                        <h2>Albums</h2>
                        <div className="artist-albums-grid">
                            {artist.albums.map(album => (
                                <div
                                    key={album.id}
                                    className="artist-album-card"
                                    onClick={() => navigate(`/album/${album.id}`)}
                                >
                                    <img
                                        src={album.image || '/images/no_album_cover.jpg'}
                                        alt={album.name}
                                        className="artist-album-cover"
                                        onError={handleImageError}
                                    />
                                    <p className="artist-album-title">{album.name}</p>
                                    {album.releaseDate && (
                                        <p className="artist-album-year">{album.releaseDate.split('-')[0]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
