import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReviewsByAlbum } from '../review/reviewService';
import { InlineRate } from '../services/InlineRate';
import '../app.css';
import './album.css';

export function Album() {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [reviews, setReviews] = React.useState([]);
    const [sortBy, setSortBy] = React.useState('newest');
    const [playingTrack, setPlayingTrack] = React.useState(null);
    const audioRef = React.useRef(null);
    const [userRating, setUserRating] = React.useState(null);
    const [hoverRating, setHoverRating] = React.useState(0);

    React.useEffect(() => {
        const loadAlbum = async () => {
            try {
                // Fetch album details from Spotify API via backend
                const response = await fetch(`/api/spotify/album/${albumId}`);
                if (response.ok) {
                    const albumData = await response.json();
                    setAlbum(albumData);
                } else {
                    console.error('Failed to load album from Spotify');
                    setAlbum(null);
                }
            } catch (error) {
                console.error('Error loading album:', error);
                setAlbum(null);
            } finally {
                setIsLoading(false);
            }
        };

        // Load reviews for this album from backend API
        const loadAlbumReviews = async () => {
            const albumReviews = await getReviewsByAlbum(albumId);
            setReviews(albumReviews);
        };

        const loadUserRating = async () => {
            try {
                const response = await fetch(`/api/ratings/album/${albumId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.rating) setUserRating(data.rating);
                }
            } catch (err) { /* ignore */ }
        };

        loadAlbum();
        loadAlbumReviews();
        loadUserRating();
    }, [albumId]);

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const handleQuickRate = async (rating) => {
        try {
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId: albumId, contentType: 'album', rating })
            });
            if (response.ok) {
                setUserRating(rating);
            }
        } catch (err) {
            console.error('Failed to save rating:', err);
        }
    };

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

    React.useEffect(() => {
        return () => {
            if (audioRef.current) audioRef.current.pause();
        };
    }, []);

    const handleImageError = (e) => {
        e.target.src = '/images/no_album_cover.jpg';
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                <span>{'★'.repeat(fullStars)}</span>
                {hasHalfStar && (
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                        <span>☆</span>
                        <span style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            overflow: 'hidden',
                            width: '50%',
                            color: 'inherit'
                        }}>★</span>
                    </span>
                )}
                <span>{'☆'.repeat(emptyStars)}</span>
            </span>
        );
    };

    const getSortedReviews = () => {
        const reviewsCopy = [...reviews];

        switch (sortBy) {
            case 'highest':
                return reviewsCopy.sort((a, b) => b.rating - a.rating);
            case 'lowest':
                return reviewsCopy.sort((a, b) => a.rating - b.rating);
            case 'oldest':
                return reviewsCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'newest':
            default:
                return reviewsCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    };

    if (isLoading) {
        return (
            <div>
                <main>
                    <p>Loading album...</p>
                </main>
            </div>
        );
    }

    if (!album) {
        return (
            <div>
                <main>
                    <h1>Album Not Found</h1>
                    <p>Sorry, we couldn't find the album you're looking for.</p>
                    <button onClick={() => navigate('/search')}>Back to Search</button>
                </main>
            </div>
        );
    }

    return (
        <div>
            <main>
                <button
                    onClick={() => navigate('/feed')}
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
                    ← Back to Feed
                </button>
                <div className="album-info">
                    <img
                        src={album.images?.[0]?.url || '/images/no_album_cover.jpg'}
                        alt={album.name}
                        className="album-detail-cover"
                        onError={handleImageError}
                    />
                    <div className="album-detail-text">
                        <h1>{album.name}</h1>
                        <h3>{album.artists.map((a, i) => (
                            <span key={a.id || i}>
                                {i > 0 && ', '}
                                <span className="search-link" onClick={() => navigate(`/artist/${a.id}`)}>{a.name}</span>
                            </span>
                        ))}</h3>
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
                                    albumId: album.id,
                                    albumName: album.name,
                                    artistName: album.artists.map(a => a.name).join(', '),
                                    albumCover: album.images?.[0]?.url || '/images/no_album_cover.jpg',
                                    prefillRating: userRating
                                } })}
                            >
                                ✎
                            </button>
                        </div>
                        <p>
                            Released: {new Date(album.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p>
                            Label: {album.label}
                        </p>
                        <p>
                            Total Tracks: {album.total_tracks}
                        </p>
                        <p className="genres">
                            Genres: {album.genres?.length ? album.genres.join(', ') : 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="tracklist-container">
                    <h2>Tracklist</h2>
                    {album.tracks.items.map(track => (
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
                                <span className="track-number">
                                    {track.track_number}
                                </span>
                                <span className="track-name">
                                    {track.name}
                                    {track.explicit && <span className="explicit-tag">🅴</span>}
                                </span>
                            </div>
                            <InlineRate
                                contentId={track.id}
                                contentType="track"
                                contentName={track.name}
                                artistName={album.artists.map(a => a.name).join(', ')}
                                contentCover={album.images?.[0]?.url}
                            />
                            <span className="track-duration">
                                {formatDuration(track.duration_ms)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="album-reviews-section">
                    <div className="reviews-header">
                        <h2>Reviews</h2>
                        {reviews.length > 0 && (
                            <div className="average-rating">
                                <span className="average-stars">{renderStars(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)}</span>
                                <span className="average-number">
                                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} / 5
                                </span>
                            </div>
                        )}
                    </div>
                    {reviews.length > 0 && (
                        <div className="sort-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ marginRight: '0.5rem', alignSelf: 'center', fontWeight: 'bold' }}>Sort by:</span>
                            <button
                                className={sortBy === 'newest' ? 'sort-button active' : 'sort-button'}
                                onClick={() => setSortBy('newest')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: sortBy === 'newest' ? '2px solid var(--primary-color, #ff6b6b)' : '1px solid var(--border-color)',
                                    backgroundColor: sortBy === 'newest' ? 'var(--primary-color, #ff6b6b)' : 'var(--bg-secondary)',
                                    color: sortBy === 'newest' ? 'white' : 'var(--text-color)',
                                    cursor: 'pointer',
                                    fontWeight: sortBy === 'newest' ? 'bold' : 'normal'
                                }}
                            >
                                Newest
                            </button>
                            <button
                                className={sortBy === 'oldest' ? 'sort-button active' : 'sort-button'}
                                onClick={() => setSortBy('oldest')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: sortBy === 'oldest' ? '2px solid var(--primary-color, #ff6b6b)' : '1px solid var(--border-color)',
                                    backgroundColor: sortBy === 'oldest' ? 'var(--primary-color, #ff6b6b)' : 'var(--bg-secondary)',
                                    color: sortBy === 'oldest' ? 'white' : 'var(--text-color)',
                                    cursor: 'pointer',
                                    fontWeight: sortBy === 'oldest' ? 'bold' : 'normal'
                                }}
                            >
                                Oldest
                            </button>
                            <button
                                className={sortBy === 'highest' ? 'sort-button active' : 'sort-button'}
                                onClick={() => setSortBy('highest')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: sortBy === 'highest' ? '2px solid var(--primary-color, #ff6b6b)' : '1px solid var(--border-color)',
                                    backgroundColor: sortBy === 'highest' ? 'var(--primary-color, #ff6b6b)' : 'var(--bg-secondary)',
                                    color: sortBy === 'highest' ? 'white' : 'var(--text-color)',
                                    cursor: 'pointer',
                                    fontWeight: sortBy === 'highest' ? 'bold' : 'normal'
                                }}
                            >
                                Highest Rating
                            </button>
                            <button
                                className={sortBy === 'lowest' ? 'sort-button active' : 'sort-button'}
                                onClick={() => setSortBy('lowest')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: sortBy === 'lowest' ? '2px solid var(--primary-color, #ff6b6b)' : '1px solid var(--border-color)',
                                    backgroundColor: sortBy === 'lowest' ? 'var(--primary-color, #ff6b6b)' : 'var(--bg-secondary)',
                                    color: sortBy === 'lowest' ? 'white' : 'var(--text-color)',
                                    cursor: 'pointer',
                                    fontWeight: sortBy === 'lowest' ? 'bold' : 'normal'
                                }}
                            >
                                Lowest Rating
                            </button>
                        </div>
                    )}
                    {reviews.length === 0 ? (
                        <p className="reviews-placeholder">
                            No reviews yet. Be the first to review this album!
                        </p>
                    ) : (
                        <div className="reviews-list">
                            {getSortedReviews().map(review => (
                                <div key={review.id} className="review-card">
                                    <div className="review-header">
                                        <div>
                                            <p
                                                className="review-author"
                                                style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                                                onClick={() => navigate(`/user/${review.reviewerName}`)}
                                                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-color, #ff6b6b)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.color = ''; }}
                                            >
                                                @{review.reviewerName}
                                            </p>
                                            <p className="review-rating">{renderStars(review.rating)}</p>
                                        </div>
                                        <p className="review-date">
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="review-content">
                                        <p className="review-text">{review.reviewText}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}