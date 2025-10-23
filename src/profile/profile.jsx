import React from 'react';
import { getReviewsByUser } from '../review/reviewService';
import '../app.css';
import './profile.css';

export function Profile({ userName }) {
    const [userReviews, setUserReviews] = React.useState([]);

    React.useEffect(() => {
        // Load reviews for this user
        const reviews = getReviewsByUser(userName);
        setUserReviews(reviews);
    }, [userName]);

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
                <h1>Hey {userName}!</h1>
                <div className="feed-container">
                    <div className="feed-main">
                        {userReviews.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                                You haven't written any reviews yet. Search for an album and write your first review!
                            </p>
                        ) : (
                            userReviews.map(review => (
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