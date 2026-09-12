import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stars } from './Stars';
import { api, contentPath } from '../services/api';
import { useAuth } from '../services/AuthContext';

// One review in a list. Handles like toggling and owner edit/delete.
export function ReviewCard({ review, onChange, onDelete, showContent = true }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [likes, setLikes] = React.useState(review.likes || 0);
    const [likedByMe, setLikedByMe] = React.useState(!!review.likedByMe);
    const [confirmDelete, setConfirmDelete] = React.useState(false);

    React.useEffect(() => {
        setLikes(review.likes || 0);
        setLikedByMe(!!review.likedByMe);
    }, [review.id, review.likes, review.likedByMe]);

    const type = review.contentType || 'album';
    const id = review.contentId || review.albumId;
    const name = review.contentName || review.albumName;
    const cover = review.contentCover || review.albumCover;
    const isOwner = user && user.username === review.reviewerName;

    async function toggleLike(e) {
        e.stopPropagation();
        if (!user) return navigate('/');
        // Optimistic update.
        setLikedByMe(v => !v);
        setLikes(n => n + (likedByMe ? -1 : 1));
        try {
            const data = await api(`/api/reviews/${review.id}/like`, { method: 'POST' });
            setLikes(data.likes);
            setLikedByMe(data.likedByMe);
            onChange?.({ ...review, ...data });
        } catch {
            setLikedByMe(v => !v);
            setLikes(n => n + (likedByMe ? 1 : -1));
        }
    }

    async function remove(e) {
        e.stopPropagation();
        try {
            await api(`/api/reviews/${review.id}`, { method: 'DELETE' });
            onDelete?.(review.id);
        } catch { /* ignore */ }
    }

    function edit(e) {
        e.stopPropagation();
        navigate('/review', { state: { editReview: review } });
    }

    const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

    return (
        <article className="review-card" onClick={() => navigate(`/post/${review.id}`)}>
            {showContent && (
                <div className="album-info">
                    <img
                        src={cover || '/images/no_album_cover.jpg'}
                        alt={name}
                        className="album-cover"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }}
                    />
                    <div className="album-details">
                        <h3 className="album-title search-link" onClick={stop(() => navigate(contentPath(type, id)))}>{name}</h3>
                        {review.artistName && <p className="album-artist">{review.artistName}</p>}
                        <p className="review-rating"><Stars rating={review.rating} /></p>
                    </div>
                </div>
            )}
            {!showContent && (
                <p className="review-rating"><Stars rating={review.rating} /></p>
            )}

            <div className="review-content">
                <p className="review-text">{review.reviewText}</p>
            </div>

            <div className="review-footer">
                <span
                    className="review-author search-link"
                    onClick={stop(() => navigate(user?.username === review.reviewerName ? '/profile' : `/user/${review.reviewerName}`))}
                >
                    @{review.reviewerName}
                </span>
                <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {review.updatedAt && <span className="review-edited"> · edited</span>}
                </span>
                <span className="review-actions">
                    <button type="button" className={`like-btn ${likedByMe ? 'liked' : ''}`} onClick={toggleLike} title={likedByMe ? 'Unlike' : 'Like'}>
                        {likedByMe ? '♥' : '♡'} {likes}
                    </button>
                    <span className="comment-count" title="Comments">💬 {review.commentCount ?? (review.comments?.length || 0)}</span>
                    {isOwner && !confirmDelete && (
                        <>
                            <button type="button" className="text-btn" onClick={edit}>Edit</button>
                            <button type="button" className="text-btn danger" onClick={stop(() => setConfirmDelete(true))}>Delete</button>
                        </>
                    )}
                    {isOwner && confirmDelete && (
                        <>
                            <button type="button" className="text-btn danger" onClick={remove}>Confirm delete</button>
                            <button type="button" className="text-btn" onClick={stop(() => setConfirmDelete(false))}>Cancel</button>
                        </>
                    )}
                </span>
            </div>
        </article>
    );
}
