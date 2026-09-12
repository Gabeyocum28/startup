import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReview } from '../review/reviewService';
import { api, contentPath } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { Stars } from '../components/Stars';
import { Loading, EmptyState, ErrorMessage, LoginPrompt, BackButton } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';
import './feed.css';

const COMMENT_MAX = 1000;

export function Post() {
    const { reviewId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [review, setReview] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [commentText, setCommentText] = React.useState('');
    const [posting, setPosting] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);

    const name = review ? (review.contentName || review.albumName) : '';
    useDocumentTitle(review ? `${review.reviewerName} on ${name}` : 'Review', review?.reviewText?.slice(0, 160));

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getReview(reviewId)
            .then(r => { if (!cancelled) setReview(r); })
            .catch(() => { if (!cancelled) setReview(null); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [reviewId]);

    async function toggleLike() {
        if (!user) return navigate('/', { state: { from: { pathname: `/post/${reviewId}` } } });
        try {
            const data = await api(`/api/reviews/${review.id}/like`, { method: 'POST' });
            setReview(r => ({ ...r, ...data }));
        } catch (err) { setError(err.message); }
    }

    async function submitComment(e) {
        e.preventDefault();
        const text = commentText.trim();
        if (!text) return;
        setPosting(true);
        setError(null);
        try {
            const comment = await api(`/api/reviews/${review.id}/comments`, { method: 'POST', body: { text } });
            setReview(r => ({ ...r, comments: [...(r.comments || []), comment], commentCount: (r.commentCount || 0) + 1 }));
            setCommentText('');
        } catch (err) { setError(err.message); } finally { setPosting(false); }
    }

    async function removeComment(id) {
        try {
            await api(`/api/reviews/${review.id}/comments/${id}`, { method: 'DELETE' });
            setReview(r => ({ ...r, comments: r.comments.filter(c => c.id !== id), commentCount: r.commentCount - 1 }));
        } catch (err) { setError(err.message); }
    }

    async function removeReview() {
        try {
            await api(`/api/reviews/${review.id}`, { method: 'DELETE' });
            navigate('/feed', { replace: true });
        } catch (err) { setError(err.message); }
    }

    if (loading) return <div><main><Loading label="Loading review…" /></main></div>;
    if (!review) {
        return (
            <div><main>
                <EmptyState title="Review not found">It may have been deleted.</EmptyState>
                <BackButton to="/feed">Back to feed</BackButton>
            </main></div>
        );
    }

    const type = review.contentType || 'album';
    const id = review.contentId || review.albumId;
    const isOwner = user?.username === review.reviewerName;
    const comments = review.comments || [];

    return (
        <div>
            <main>
                <BackButton to="/feed">Back to feed</BackButton>

                <article className="post-detail">
                    <div className="post-album-section">
                        <img
                            src={review.contentCover || review.albumCover || '/images/no_album_cover.jpg'}
                            alt={name}
                            className="post-album-cover"
                            onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }}
                        />
                        <div className="post-album-info">
                            <h2 className="search-link" onClick={() => navigate(contentPath(type, id))}>{name}</h2>
                            {review.artistName && (
                                <p className="post-artist search-link" onClick={() => navigate(`/search?q=${encodeURIComponent(review.artistName)}`)}>
                                    {review.artistName}
                                </p>
                            )}
                            <p className="post-rating"><Stars rating={review.rating} /> <span>{Number(review.rating).toFixed(1)} / 5</span></p>
                        </div>
                    </div>

                    <div className="post-review-text">
                        <p>{review.reviewText}</p>
                    </div>

                    <div className="post-meta">
                        <p className="post-author search-link" onClick={() => navigate(isOwner ? '/profile' : `/user/${review.reviewerName}`)}>
                            @{review.reviewerName}
                        </p>
                        <p className="post-date">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            {review.updatedAt && <span className="review-edited"> · edited</span>}
                        </p>
                    </div>

                    <div className="post-actions">
                        <button type="button" className={`like-btn ${review.likedByMe ? 'liked' : ''}`} onClick={toggleLike}>
                            {review.likedByMe ? '♥' : '♡'} {review.likes || 0}
                        </button>
                        {isOwner && !confirmDelete && (
                            <>
                                <button type="button" className="text-btn" onClick={() => navigate('/review', { state: { editReview: review } })}>Edit</button>
                                <button type="button" className="text-btn danger" onClick={() => setConfirmDelete(true)}>Delete</button>
                            </>
                        )}
                        {isOwner && confirmDelete && (
                            <>
                                <span>Delete this review?</span>
                                <button type="button" className="text-btn danger" onClick={removeReview}>Yes, delete</button>
                                <button type="button" className="text-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                            </>
                        )}
                    </div>
                </article>

                <section className="comments-section">
                    <h3>Comments ({comments.length})</h3>
                    <ErrorMessage>{error}</ErrorMessage>
                    {comments.length === 0 && <p className="ui-muted">No comments yet.</p>}
                    {comments.map(c => (
                        <div key={c.id} className="comment">
                            <div className="comment-head">
                                <span className="search-link" onClick={() => navigate(user?.username === c.username ? '/profile' : `/user/${c.username}`)}>@{c.username}</span>
                                <span className="comment-date">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                {(user?.username === c.username || isOwner) && (
                                    <button type="button" className="text-btn danger" onClick={() => removeComment(c.id)}>Delete</button>
                                )}
                            </div>
                            <p className="comment-text">{c.text}</p>
                        </div>
                    ))}
                    {user ? (
                        <form className="comment-form" onSubmit={submitComment}>
                            <textarea
                                value={commentText}
                                maxLength={COMMENT_MAX}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment…"
                                rows={3}
                            />
                            <div className="comment-form-row">
                                <span className="ui-muted">{commentText.length}/{COMMENT_MAX}</span>
                                <button type="submit" className="aura" disabled={posting || !commentText.trim()}>{posting ? 'Posting…' : 'Post comment'}</button>
                            </div>
                        </form>
                    ) : <LoginPrompt action="comment" />}
                </section>
            </main>
        </div>
    );
}
