import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReviewsByAlbum } from '../review/reviewService';
import { api } from '../services/api';
import { InlineRate } from '../services/InlineRate';
import { QuickRate } from '../components/QuickRate';
import { ListButtons } from '../components/ListButtons';
import { ReviewCard } from '../components/ReviewCard';
import { Stars } from '../components/Stars';
import { Loading, EmptyState, BackButton } from '../components/ui';
import { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';
import './album.css';

const SORTS = [
    { key: 'newest', label: 'Newest' },
    { key: 'oldest', label: 'Oldest' },
    { key: 'highest', label: 'Highest rating' },
    { key: 'lowest', label: 'Lowest rating' },
];

export function Album() {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [reviews, setReviews] = React.useState([]);
    const [sortBy, setSortBy] = React.useState('newest');
    const { playingId, toggle } = usePreviewPlayer();

    const artistNames = album ? album.artists.map(a => a.name).join(', ') : '';
    useDocumentTitle(album ? `${album.name} by ${artistNames}` : 'Album', album ? `Reviews and ratings for ${album.name}.` : undefined);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            api(`/api/albums/${encodeURIComponent(albumId)}`).catch(() => null),
            getReviewsByAlbum(albumId),
        ]).then(([a, r]) => {
            if (cancelled) return;
            setAlbum(a);
            setReviews(r);
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [albumId]);

    const sorted = React.useMemo(() => {
        const copy = [...reviews];
        switch (sortBy) {
            case 'highest': return copy.sort((a, b) => b.rating - a.rating);
            case 'lowest': return copy.sort((a, b) => a.rating - b.rating);
            case 'oldest': return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            default: return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }, [reviews, sortBy]);

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (loading) return <div><main><Loading label="Loading album…" /></main></div>;
    if (!album) {
        return (
            <div><main>
                <EmptyState title="Album not found">We couldn't find that album.</EmptyState>
                <BackButton to="/search">Back to search</BackButton>
            </main></div>
        );
    }

    const cover = album.images?.[0]?.url || '/images/no_album_cover.jpg';
    const reviewAverage = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

    return (
        <div>
            <main>
                <BackButton to="/search">Back to search</BackButton>
                <div className="album-info">
                    <img src={cover} alt={album.name} className="album-detail-cover" onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }} />
                    <div className="album-detail-text">
                        <h1>{album.name}</h1>
                        <h3>{album.artists.map((a, i) => (
                            <span key={a.id || i}>
                                {i > 0 && ', '}
                                <span className="search-link" onClick={() => navigate(`/artist/${a.id}`)}>{a.name}</span>
                            </span>
                        ))}</h3>
                        <QuickRate contentId={album.id} contentType="album" contentName={album.name} artistName={artistNames} contentCover={cover} />
                        <ListButtons item={{ id: album.id, type: 'album', name: album.name, artist: artistNames, image: cover }} />
                        <p>Released: {album.release_date ? new Date(album.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</p>
                        <p>Label: {album.label}</p>
                        <p>Total tracks: {album.total_tracks}</p>
                        <p className="genres">Genres: {album.genres?.length ? album.genres.join(', ') : 'N/A'}</p>
                    </div>
                </div>

                <div className="tracklist-container">
                    <h2>Tracklist</h2>
                    {album.tracks.items.map(track => (
                        <div key={track.id} className="track-item" onClick={() => navigate(`/song/${track.id}`)} style={{ cursor: 'pointer' }}>
                            <div className="track-info">
                                {track.preview && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggle(track.id, track.preview); }}
                                        className="track-play-btn"
                                        title={playingId === track.id ? 'Pause' : 'Play preview'}
                                    >
                                        {playingId === track.id ? '⏸' : '▶'}
                                    </button>
                                )}
                                <span className="track-number">{track.track_number}</span>
                                <span className="track-name">
                                    {track.name}
                                    {track.explicit && <span className="explicit-tag">🅴</span>}
                                </span>
                            </div>
                            <InlineRate contentId={track.id} contentType="track" contentName={track.name} artistName={artistNames} contentCover={cover} />
                            <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                        </div>
                    ))}
                </div>

                <div className="album-reviews-section">
                    <div className="reviews-header">
                        <h2>Reviews ({reviews.length})</h2>
                        {reviewAverage !== null && (
                            <div className="average-rating">
                                <span className="average-stars"><Stars rating={reviewAverage} /></span>
                                <span className="average-number">{reviewAverage.toFixed(1)} / 5</span>
                            </div>
                        )}
                    </div>
                    {reviews.length > 1 && (
                        <div className="sort-controls">
                            <span>Sort by:</span>
                            {SORTS.map(s => (
                                <button key={s.key} type="button" className={`chip ${sortBy === s.key ? 'active' : ''}`} onClick={() => setSortBy(s.key)}>{s.label}</button>
                            ))}
                        </div>
                    )}
                    {reviews.length === 0 ? (
                        <EmptyState title="No reviews yet">Be the first to review this album.</EmptyState>
                    ) : (
                        <div className="reviews-list">
                            {sorted.map(review => (
                                <ReviewCard key={review.id} review={review} showContent={false} onDelete={(id) => setReviews(prev => prev.filter(r => r.id !== id))} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
