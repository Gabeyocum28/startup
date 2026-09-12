import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getReviewsByContent } from '../review/reviewService';
import { QuickRate } from '../components/QuickRate';
import { ListButtons } from '../components/ListButtons';
import { ReviewCard } from '../components/ReviewCard';
import { Loading, EmptyState, BackButton } from '../components/ui';
import { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';
import './song.css';

export function Song() {
    const { trackId } = useParams();
    const navigate = useNavigate();
    const [track, setTrack] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [reviews, setReviews] = React.useState([]);
    const { playingId, toggle } = usePreviewPlayer();

    useDocumentTitle(track ? `${track.name} by ${track.artist}` : 'Song', track ? `Reviews and ratings for ${track.name}.` : undefined);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            api(`/api/track/${encodeURIComponent(trackId)}`).catch(() => null),
            getReviewsByContent('track', trackId),
        ]).then(([t, r]) => {
            if (cancelled) return;
            setTrack(t);
            setReviews(r);
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [trackId]);

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (loading) return <div><main><Loading label="Loading song…" /></main></div>;
    if (!track) {
        return (
            <div><main>
                <EmptyState title="Song not found">We couldn't find that song.</EmptyState>
                <BackButton to="/search">Back to search</BackButton>
            </main></div>
        );
    }

    const cover = track.image || '/images/no_album_cover.jpg';

    return (
        <div>
            <main>
                <BackButton to="/search">Back to search</BackButton>

                <div className="song-detail">
                    <img src={cover} alt={track.name} className="song-cover" onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }} />
                    <div className="song-info">
                        <h1>
                            {track.preview && (
                                <button type="button" className="song-play-inline" onClick={() => toggle(track.id, track.preview)} title={playingId === track.id ? 'Pause' : 'Play preview'}>
                                    {playingId === track.id ? '⏸' : '▶'}
                                </button>
                            )}
                            {track.name} {track.explicit && <span className="song-explicit">E</span>}
                        </h1>
                        <h3><span className="search-link" onClick={() => navigate(`/artist/${track.artistId}`)}>{track.artist}</span></h3>
                        <p className="song-album"><span className="search-link" onClick={() => navigate(`/album/${track.albumId}`)}>{track.albumName}</span></p>

                        <QuickRate contentId={track.id} contentType="track" contentName={track.name} artistName={track.artist} contentCover={cover} />
                        <ListButtons item={{ id: track.id, type: 'track', name: track.name, artist: track.artist, image: cover }} />

                        {track.releaseDate && (
                            <p className="song-meta">Released: {new Date(track.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        )}
                        <p className="song-meta">Duration: {formatDuration(track.duration_ms)}</p>
                    </div>
                </div>

                <div className="album-reviews-section">
                    <h2>Reviews ({reviews.length})</h2>
                    {reviews.length === 0 ? (
                        <EmptyState title="No reviews yet">Be the first to review this song.</EmptyState>
                    ) : (
                        <div className="reviews-list">
                            {reviews.map(review => (
                                <ReviewCard key={review.id} review={review} showContent={false} onDelete={(id) => setReviews(prev => prev.filter(r => r.id !== id))} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
