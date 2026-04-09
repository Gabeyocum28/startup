import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../app.css';
import './song.css';

export function Song() {
    const { trackId } = useParams();
    const navigate = useNavigate();
    const [track, setTrack] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const audioRef = React.useRef(null);
    const [userRating, setUserRating] = React.useState(null);
    const [hoverRating, setHoverRating] = React.useState(0);
    const [reviews, setReviews] = React.useState([]);

    React.useEffect(() => {
        const loadTrack = async () => {
            try {
                const response = await fetch(`/api/track/${trackId}`);
                if (response.ok) {
                    const data = await response.json();
                    setTrack(data);
                } else {
                    setTrack(null);
                }
            } catch (error) {
                console.error('Error loading track:', error);
                setTrack(null);
            } finally {
                setIsLoading(false);
            }
        };

        const loadUserRating = async () => {
            try {
                const response = await fetch(`/api/ratings/track/${trackId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.rating) setUserRating(data.rating);
                }
            } catch (err) { /* ignore */ }
        };

        const loadReviews = async () => {
            try {
                const response = await fetch(`/api/reviews/track/${trackId}`);
                if (response.ok) setReviews(await response.json());
            } catch (err) { /* ignore */ }
        };

        loadTrack();
        loadUserRating();
        loadReviews();

        return () => {
            if (audioRef.current) audioRef.current.pause();
        };
    }, [trackId]);

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span>{'★'.repeat(fullStars)}</span>
                {hasHalfStar && (
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                        <span>☆</span>
                        <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: '50%', color: 'inherit' }}>★</span>
                    </span>
                )}
                <span>{'☆'.repeat(emptyStars)}</span>
            </span>
        );
    };

    const handleQuickRate = async (rating) => {
        try {
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId: trackId, contentType: 'track', rating })
            });
            if (response.ok) {
                setUserRating(rating);
            }
        } catch (err) {
            console.error('Failed to save rating:', err);
        }
    };

    const handlePlayPause = () => {
        if (!track.preview) return;

        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(track.preview);
        audio.volume = 0.5;
        audio.play();
        audio.onended = () => setIsPlaying(false);
        audioRef.current = audio;
        setIsPlaying(true);
    };

    const handleImageError = (e) => {
        e.target.src = '/images/no_album_cover.jpg';
    };

    if (isLoading) {
        return (
            <div><main><p>Loading song...</p></main></div>
        );
    }

    if (!track) {
        return (
            <div>
                <main>
                    <h1>Song Not Found</h1>
                    <p>Sorry, we couldn't find the song you're looking for.</p>
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

                <div className="song-detail">
                    <img
                        src={track.image || '/images/no_album_cover.jpg'}
                        alt={track.name}
                        className="song-cover"
                        onError={handleImageError}
                    />
                    <div className="song-info">
                        <h1>
                            {track.preview && (
                                <button className="song-play-inline" onClick={handlePlayPause}>
                                    {isPlaying ? '⏸' : '▶'}
                                </button>
                            )}
                            {track.name} {track.explicit && <span className="song-explicit">E</span>}
                        </h1>
                        <h3><span className="search-link" onClick={() => navigate(`/artist/${track.artistId}`)}>{track.artist}</span></h3>
                        <p className="song-album"><span className="search-link" onClick={() => navigate(`/album/${track.albumId}`)}>{track.albumName}</span></p>

                        <div className="quick-rate-row">
                            <div
                                className="quick-stars"
                                onMouseLeave={() => setHoverRating(0)}
                            >
                                {[1, 2, 3, 4, 5].map(starIndex => {
                                    const current = hoverRating || userRating || 0;
                                    let fillClass = 'empty';
                                    if (current >= starIndex) fillClass = 'full';
                                    else if (current >= starIndex - 0.5) fillClass = 'half';

                                    return (
                                        <div key={starIndex} className="quick-star-wrap">
                                            <div
                                                className="quick-star-half left"
                                                onMouseEnter={() => setHoverRating(starIndex - 0.5)}
                                                onClick={() => handleQuickRate(starIndex - 0.5)}
                                            />
                                            <div
                                                className="quick-star-half right"
                                                onMouseEnter={() => setHoverRating(starIndex)}
                                                onClick={() => handleQuickRate(starIndex)}
                                            />
                                            <span className="quick-star-bg">★</span>
                                            <span className={`quick-star-fill ${fillClass}`}>★</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                className="review-icon-btn"
                                title="Write a review"
                                onClick={() => navigate('/review', { state: {
                                    contentId: track.id,
                                    contentType: 'track',
                                    contentName: track.name,
                                    artistName: track.artist,
                                    contentCover: track.image,
                                    prefillRating: userRating
                                } })}
                            >
                                ✎
                            </button>
                        </div>

                        {track.releaseDate && (
                            <p className="song-meta">Released: {new Date(track.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        )}
                        <p className="song-meta">Duration: {formatDuration(track.duration_ms)}</p>
                    </div>
                </div>

                {reviews.length > 0 && (
                    <div className="album-reviews-section">
                        <h2>Reviews</h2>
                        <div className="reviews-list">
                            {reviews.map(review => (
                                <div key={review.id} className="review-card">
                                    <div className="review-header">
                                        <div>
                                            <p
                                                className="review-author search-link"
                                                onClick={() => navigate(`/user/${review.reviewerName}`)}
                                            >
                                                @{review.reviewerName}
                                            </p>
                                            <p className="review-rating">{renderStars(review.rating)}</p>
                                        </div>
                                        <p className="review-date">
                                            {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="review-content">
                                        <p className="review-text">{review.reviewText}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
