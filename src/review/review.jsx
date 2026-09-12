import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addReview, updateReview } from './reviewService';
import { ErrorMessage, EmptyState } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';
import './review.css';

const TEXT_MAX = 5000;

export function Review() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};
    const editing = state.editReview || null;

    // Support both legacy album fields and new content fields.
    const contentId = editing ? (editing.contentId || editing.albumId) : (state.contentId || state.albumId);
    const contentType = editing ? (editing.contentType || 'album') : (state.contentType || 'album');
    const contentName = editing ? (editing.contentName || editing.albumName) : (state.contentName || state.albumName);
    const artistName = editing ? editing.artistName : state.artistName;
    const contentCover = editing ? (editing.contentCover || editing.albumCover) : (state.contentCover || state.albumCover);

    useDocumentTitle(editing ? `Edit review of ${contentName}` : contentName ? `Review ${contentName}` : 'Write a review');

    const [rating, setRating] = React.useState(editing?.rating || state.prefillRating || 0);
    const [hoverRating, setHoverRating] = React.useState(0);
    const [reviewText, setReviewText] = React.useState(editing?.reviewText || '');
    const [error, setError] = React.useState(null);
    const [busy, setBusy] = React.useState(false);

    if (!contentId) {
        return (
            <div><main>
                <EmptyState title="Nothing to review">Pick an album, song, or artist from search first.</EmptyState>
                <button type="button" className="aura" onClick={() => navigate('/search')}>Go to search</button>
            </main></div>
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (rating === 0) return setError('Pick a star rating.');
        if (!reviewText.trim()) return setError('Write something before submitting.');
        setBusy(true);
        setError(null);
        try {
            if (editing) {
                await updateReview(editing.id, { rating, reviewText: reviewText.trim() });
                navigate(`/post/${editing.id}`, { replace: true });
            } else {
                const created = await addReview({
                    contentId, contentType, contentName, artistName, contentCover,
                    rating, reviewText: reviewText.trim(),
                });
                navigate(`/post/${created.id}`, { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    const renderStar = (starIndex) => {
        const currentRating = hoverRating || rating;
        let fillClass = 'empty';
        if (currentRating >= starIndex) fillClass = 'full';
        else if (currentRating >= starIndex - 0.5) fillClass = 'half';
        return (
            <div key={starIndex} className="star" style={{ position: 'relative' }}>
                <div className="star-hit left" onClick={() => setRating(starIndex - 0.5)} onMouseEnter={() => setHoverRating(starIndex - 0.5)} onMouseLeave={() => setHoverRating(0)} />
                <div className="star-hit right" onClick={() => setRating(starIndex)} onMouseEnter={() => setHoverRating(starIndex)} onMouseLeave={() => setHoverRating(0)} />
                <div style={{ position: 'relative', pointerEvents: 'none' }}>
                    <span className="star-background">★</span>
                    <span className={`star-fill ${fillClass}`}>★</span>
                </div>
            </div>
        );
    };

    return (
        <div>
            <main>
                <form className="review-container" onSubmit={handleSubmit}>
                    <div className="album-cover-section">
                        <img
                            src={contentCover || '/images/no_album_cover.jpg'}
                            alt={contentName || 'Cover'}
                            className="album-cover-preview"
                            onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }}
                        />
                        <h2>{contentName}</h2>
                        {artistName && <h3>{artistName}</h3>}
                    </div>

                    <div className="rating-section">
                        <div className="star-rating-container">
                            <div className="star-rating">{[1, 2, 3, 4, 5].map(renderStar)}</div>
                            <div className="rating-display">
                                <span className="rating-number">{rating > 0 ? rating.toFixed(1) : '0.0'}</span> / 5
                            </div>
                        </div>
                    </div>

                    <div className="review-input-section">
                        <h2>{editing ? 'Edit your review' : 'Your review'}</h2>
                        <textarea
                            className="review-textarea"
                            name="review"
                            placeholder="Write your review here..."
                            value={reviewText}
                            maxLength={TEXT_MAX}
                            onChange={(e) => setReviewText(e.target.value)}
                        />
                        <p className="ui-muted" style={{ textAlign: 'right' }}>{reviewText.length}/{TEXT_MAX}</p>
                    </div>

                    <ErrorMessage>{error}</ErrorMessage>
                    <div className="review-form-actions">
                        <button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Submit review'}</button>
                        <button type="button" className="text-btn" onClick={() => navigate(-1)}>Cancel</button>
                    </div>
                </form>
            </main>
        </div>
    );
}
