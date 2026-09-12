import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';

// Small inline half-star rater used in track lists.
export function InlineRate({ contentId, contentType, contentName, artistName, contentCover }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [userRating, setUserRating] = React.useState(null);
    const [hoverRating, setHoverRating] = React.useState(0);

    React.useEffect(() => {
        if (!user) { setUserRating(null); return undefined; }
        let cancelled = false;
        api(`/api/ratings/${contentType}/${contentId}`).then(d => { if (!cancelled) setUserRating(d.rating); }).catch(() => {});
        return () => { cancelled = true; };
    }, [contentId, contentType, user]);

    async function rate(rating) {
        if (!user) return navigate('/', { state: { from: location } });
        const previous = userRating;
        setUserRating(rating);
        try {
            await api('/api/ratings', { method: 'POST', body: { contentId, contentType, rating, contentName, artistName, contentCover } });
        } catch {
            setUserRating(previous);
        }
    }

    const current = hoverRating || userRating || 0;

    return (
        <div className="inline-rate" onClick={(e) => e.stopPropagation()}>
            <div className="inline-stars" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map(star => {
                    let fillClass = 'empty';
                    if (current >= star) fillClass = 'full';
                    else if (current >= star - 0.5) fillClass = 'half';
                    return (
                        <div key={star} className="inline-star-wrap">
                            <div className="inline-star-half left" onMouseEnter={() => setHoverRating(star - 0.5)} onClick={() => rate(star - 0.5)} />
                            <div className="inline-star-half right" onMouseEnter={() => setHoverRating(star)} onClick={() => rate(star)} />
                            <span className="inline-star-bg">★</span>
                            <span className={`inline-star-fill ${fillClass}`}>★</span>
                        </div>
                    );
                })}
            </div>
            <button
                type="button"
                className="inline-review-btn"
                title="Write a review"
                onClick={() => navigate(user ? '/review' : '/', { state: user
                    ? { contentId, contentType, contentName, artistName, contentCover, prefillRating: userRating }
                    : { from: location } })}
            >
                ✎
            </button>
        </div>
    );
}
