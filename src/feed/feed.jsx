import React from 'react';
import { getAllReviews } from '../review/reviewService';
import '../app.css';
import './feed.css';

export function Feed() {
    const [allReviews, setAllReviews] = React.useState([]);

    React.useEffect(() => {
        // Load all reviews from localStorage
        const reviews = getAllReviews();
        setAllReviews(reviews);
    }, []);

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <>
                {'★'.repeat(fullStars)}
                {hasHalfStar && '⯨'}
                {'☆'.repeat(emptyStars)}
            </>
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

                                    <p className="review-author">@{review.reviewerName}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

