import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../app.css';
import './feed.css';

export function Post({ userName }) {
    const { reviewId } = useParams();
    const navigate = useNavigate();
    const [review, setReview] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const loadReview = async () => {
            try {
                const response = await fetch('/api/reviews');
                if (response.ok) {
                    const reviews = await response.json();
                    const found = reviews.find(r => r.id === reviewId);
                    setReview(found || null);
                }
            } catch (err) {
                console.error('Failed to load review:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadReview();
    }, [reviewId]);

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

    if (isLoading) return <div><main><p>Loading...</p></main></div>;

    if (!review) {
        return (
            <div><main>
                <h1>Post Not Found</h1>
                <button className="aura" onClick={() => navigate('/feed')}>Back to Feed</button>
            </main></div>
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
                    &larr; Back to Feed
                </button>

                <div className="post-detail">
                    <div className="post-album-section">
                        <img
                            src={review.contentCover || review.albumCover || '/images/no_album_cover.jpg'}
                            alt={review.contentName || review.albumName}
                            className="post-album-cover"
                            onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }}
                        />
                        <div className="post-album-info">
                            <h2
                                className="search-link"
                                onClick={() => {
                                    const type = review.contentType || 'album';
                                    const id = review.contentId || review.albumId;
                                    if (type === 'artist') navigate(`/artist/${id}`);
                                    else if (type === 'track') navigate(`/song/${id}`);
                                    else navigate(`/album/${id}`);
                                }}
                            >
                                {review.contentName || review.albumName}
                            </h2>
                            <p className="post-artist search-link" onClick={async () => {
                                try {
                                    const res = await fetch(`/api/search?q=${encodeURIComponent(review.artistName)}`);
                                    if (res.ok) {
                                        const data = await res.json();
                                        if (data.artists?.length) {
                                            navigate(`/artist/${data.artists[0].id}`);
                                            return;
                                        }
                                    }
                                } catch (err) { /* ignore */ }
                                navigate(`/search?q=${encodeURIComponent(review.artistName)}`);
                            }}>{review.artistName}</p>
                            <p className="post-rating">{renderStars(review.rating)} <span>{review.rating.toFixed(1)} / 5</span></p>
                        </div>
                    </div>

                    <div className="post-review-text">
                        <p>{review.reviewText}</p>
                    </div>

                    <div className="post-meta">
                        <p
                            className="post-author search-link"
                            onClick={() => {
                                if (review.reviewerName === userName) navigate('/profile');
                                else navigate(`/user/${review.reviewerName}`);
                            }}
                        >
                            @{review.reviewerName}
                        </p>
                        <p className="post-date">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
