import React from 'react';
import { useNavigate } from 'react-router-dom';

export function InlineRate({ contentId, contentType, contentName, artistName, contentCover }) {
    const navigate = useNavigate();
    const [userRating, setUserRating] = React.useState(null);
    const [hoverRating, setHoverRating] = React.useState(0);
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/ratings/${contentType}/${contentId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.rating) setUserRating(data.rating);
                }
            } catch (err) { /* ignore */ }
            setLoaded(true);
        };
        load();
    }, [contentId, contentType]);

    const handleRate = async (rating) => {
        try {
            const res = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId, contentType, rating })
            });
            if (res.ok) setUserRating(rating);
        } catch (err) { /* ignore */ }
    };

    if (!loaded) return null;

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
                            <div className="inline-star-half left" onMouseEnter={() => setHoverRating(star - 0.5)} onClick={() => handleRate(star - 0.5)} />
                            <div className="inline-star-half right" onMouseEnter={() => setHoverRating(star)} onClick={() => handleRate(star)} />
                            <span className="inline-star-bg">★</span>
                            <span className={`inline-star-fill ${fillClass}`}>★</span>
                        </div>
                    );
                })}
            </div>
            <button
                className="inline-review-btn"
                title="Write a review"
                onClick={() => navigate('/review', { state: {
                    contentId,
                    contentType,
                    contentName,
                    artistName,
                    contentCover,
                    prefillRating: userRating,
                    // Legacy fields for album reviews
                    albumId: contentType === 'album' ? contentId : undefined,
                    albumName: contentType === 'album' ? contentName : undefined,
                    albumCover: contentCover
                } })}
            >
                ✎
            </button>
        </div>
    );
}
