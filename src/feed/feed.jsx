import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllReviews } from '../review/reviewService';
import '../app.css';
import './feed.css';

export function Feed({ userName }) {
    const navigate = useNavigate();
    const [allReviews, setAllReviews] = React.useState([]);

    React.useEffect(() => {
        // Load all reviews from backend API
        const loadReviews = async () => {
            const reviews = await getAllReviews();
            setAllReviews(reviews);
        };

        loadReviews();

        // Listen for new review events from WebSocket
        const handleNewReview = () => {
            loadReviews();
        };

        window.addEventListener('newReview', handleNewReview);

        return () => {
            window.removeEventListener('newReview', handleNewReview);
        };
    }, []);

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                <span>{'★'.repeat(fullStars)}</span>
                {hasHalfStar && (
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                        <span>☆</span>
                        <span style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            overflow: 'hidden',
                            width: '50%',
                            color: 'inherit'
                        }}>★</span>
                    </span>
                )}
                <span>{'☆'.repeat(emptyStars)}</span>
            </span>
        );
    };

    return (
        <div>
            <main>
                <h1>Feed</h1>
                <div className="feed-container">
                    <div className="feed-main">
                        {allReviews.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                                No reviews yet. Be the first to write a review!
                            </p>
                        ) : (
                            allReviews.map(review => (
                                <div key={review.id} className="review-card">
                                    <div className="album-info">
                                        <img
                                            src={review.albumCover}
                                            alt={review.albumName}
                                            className="album-cover"
                                            onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }}
                                        />
                                        <div className="album-details">
                                            <h3 className="album-title">{review.albumName}</h3>
                                            <p className="album-artist">{review.artistName}</p>
                                            <p className="review-rating">{renderStars(review.rating)}</p>
                                        </div>
                                    </div>

                                    <div className="review-content">
                                        <p className="review-text">{review.reviewText}</p>
                                    </div>

                                    <p
                                        className="review-author"
                                        style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                                        onClick={() => {
                                            // If clicking on own username, go to /profile, otherwise /user/:username
                                            if (review.reviewerName === userName) {
                                                navigate('/profile');
                                            } else {
                                                navigate(`/user/${review.reviewerName}`);
                                            }
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-color, #ff6b6b)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.color = ''; }}
                                    >
                                        @{review.reviewerName}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

