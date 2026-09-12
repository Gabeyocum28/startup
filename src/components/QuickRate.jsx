import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { AverageBadge } from './Stars';

// Interactive half-star rating for an album, track, or artist page header.
// Shows the community average, the viewer's rating, and a "write review" button.
export function QuickRate({ contentId, contentType, contentName, artistName, contentCover, size = 'large' }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [userRating, setUserRating] = React.useState(null);
    const [hoverRating, setHoverRating] = React.useState(0);
    const [average, setAverage] = React.useState({ average: null, count: 0 });
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;
        api(`/api/ratings/${contentType}/${contentId}/average`).then(a => { if (!cancelled) setAverage(a); }).catch(() => {});
        if (user) {
            api(`/api/ratings/${contentType}/${contentId}`).then(d => { if (!cancelled) setUserRating(d.rating); }).catch(() => {});
        } else {
            setUserRating(null);
        }
        return () => { cancelled = true; };
    }, [contentId, contentType, user]);

    async function rate(rating) {
        if (!user) return navigate('/', { state: { from: location } });
        setSaving(true);
        const previous = userRating;
        setUserRating(rating);
        try {
            await api('/api/ratings', { method: 'POST', body: { contentId, contentType, rating, contentName, artistName, contentCover } });
            const a = await api(`/api/ratings/${contentType}/${contentId}/average`);
            setAverage(a);
        } catch {
            setUserRating(previous);
        } finally {
            setSaving(false);
        }
    }

    const current = hoverRating || userRating || 0;
    const reviewState = { contentId, contentType, contentName, artistName, contentCover, prefillRating: userRating };

    return (
        <div className={`quick-rate-row ${size}`}>
            <div className="quick-stars" onMouseLeave={() => setHoverRating(0)} aria-label={user ? 'Your rating' : 'Log in to rate'}>
                {[1, 2, 3, 4, 5].map(star => {
                    let fillClass = 'empty';
                    if (current >= star) fillClass = 'full';
                    else if (current >= star - 0.5) fillClass = 'half';
                    return (
                        <div key={star} className={`quick-star-wrap ${saving ? 'saving' : ''}`}>
                            <div className="quick-star-half left" onMouseEnter={() => setHoverRating(star - 0.5)} onClick={() => rate(star - 0.5)} />
                            <div className="quick-star-half right" onMouseEnter={() => setHoverRating(star)} onClick={() => rate(star)} />
                            <span className="quick-star-bg">★</span>
                            <span className={`quick-star-fill ${fillClass}`}>★</span>
                        </div>
                    );
                })}
            </div>
            {userRating && <span className="quick-your-rating">You: {userRating.toFixed(1)}</span>}
            <AverageBadge {...average} />
            <button
                type="button"
                className="review-icon-btn"
                title={user ? 'Write a review' : 'Log in to write a review'}
                onClick={() => (user ? navigate('/review', { state: reviewState }) : navigate('/', { state: { from: location } }))}
            >
                ✎
            </button>
        </div>
    );
}
