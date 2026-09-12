import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getReviewsByContent } from '../review/reviewService';
import { InlineRate } from '../services/InlineRate';
import { QuickRate } from '../components/QuickRate';
import { ListButtons } from '../components/ListButtons';
import { ReviewCard } from '../components/ReviewCard';
import { Loading, EmptyState, BackButton } from '../components/ui';
import { usePreviewPlayer } from '../hooks/usePreviewPlayer';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';
import './artist.css';

export function Artist() {
    const { artistId } = useParams();
    const navigate = useNavigate();
    const [artist, setArtist] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [reviews, setReviews] = React.useState([]);
    const { playingId, toggle } = usePreviewPlayer();

    useDocumentTitle(artist ? artist.name : 'Artist', artist ? `Albums, top tracks, and reviews for ${artist.name}.` : undefined);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            api(`/api/artist/${encodeURIComponent(artistId)}`).catch(() => null),
            getReviewsByContent('artist', artistId),
        ]).then(([a, r]) => {
            if (cancelled) return;
            setArtist(a);
            setReviews(r);
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [artistId]);

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const onImgError = (e) => { e.target.src = '/images/no_album_cover.jpg'; };

    if (loading) return <div><main><Loading label="Loading artist…" /></main></div>;
    if (!artist) {
        return (
            <div><main>
                <EmptyState title="Artist not found">We couldn't find that artist.</EmptyState>
                <BackButton to="/search">Back to search</BackButton>
            </main></div>
        );
    }

    const image = artist.image || '/images/no_album_cover.jpg';

    return (
        <div>
            <main>
                <BackButton to="/search">Back to search</BackButton>

                <div className="artist-header">
                    <img src={image} alt={artist.name} className="artist-image" onError={onImgError} />
                    <div className="artist-info">
                        <h1>{artist.name}</h1>
                        <p className="artist-fans">{artist.fans.toLocaleString()} fans</p>
                        <QuickRate contentId={artist.id} contentType="artist" contentName={artist.name} artistName="" contentCover={image} />
                        <ListButtons item={{ id: artist.id, type: 'artist', name: artist.name, artist: '', image }} />
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
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); toggle(track.id, track.preview); }}
                                            className="track-play-btn"
                                            title={playingId === track.id ? 'Pause' : 'Play preview'}
                                        >
                                            {playingId === track.id ? '⏸' : '▶'}
                                        </button>
                                    )}
                                    <span className="track-number">{index + 1}</span>
                                    <img src={track.image || '/images/no_album_cover.jpg'} alt={track.name} className="track-thumb" loading="lazy" onError={onImgError} />
                                    <div>
                                        <span className="track-name">
                                            {track.name}
                                            {track.explicit && <span className="explicit-tag">🅴</span>}
                                        </span>
                                        <span className="track-album-name">{track.albumName}</span>
                                    </div>
                                </div>
                                <InlineRate contentId={track.id} contentType="track" contentName={track.name} artistName={artist.name} contentCover={track.image} />
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
                                <div key={album.id} className="artist-album-card" onClick={() => navigate(`/album/${album.id}`)}>
                                    <img src={album.image || '/images/no_album_cover.jpg'} alt={album.name} className="artist-album-cover" loading="lazy" onError={onImgError} />
                                    <p className="artist-album-title">{album.name}</p>
                                    {album.releaseDate && <p className="artist-album-year">{album.releaseDate.split('-')[0]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="album-reviews-section">
                    <h2>Reviews ({reviews.length})</h2>
                    {reviews.length === 0 ? (
                        <EmptyState title="No reviews yet">Be the first to review this artist.</EmptyState>
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
