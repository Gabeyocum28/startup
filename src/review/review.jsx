import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addReview } from './reviewService';
import '../app.css';
import './review.css';

export function Review({ userName }) {
    const location = useLocation();
    const navigate = useNavigate();
    const albumData = location.state || {};
    const { albumId, albumName, artistName, albumCover } = albumData;

    const [rating, setRating] = React.useState(0);
    const [hoverRating, setHoverRating] = React.useState(0);
    const [reviewText, setReviewText] = React.useState('');

    const handleImageError = (e) => {
        e.target.src = '/images/no_album_cover.jpg';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate review
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        if (!reviewText.trim()) {
            alert('Please write a review');
            return;
        }

        try {
            // Save review to backend API
            const review = await addReview({
                albumId: albumId,
                albumName: albumName,
                artistName: artistName,
                albumCover: albumCover,
                rating: rating,
                reviewText: reviewText.trim()
            }, userName);

            console.log('Review saved:', review);

            // Reset form
            setRating(0);
            setReviewText('');

            // Navigate to feed or show success message
            alert('Review submitted successfully!');
            navigate('/feed');
        } catch (error) {
            alert('Failed to submit review. Please make sure you are logged in.');
            console.error('Failed to submit review:', error);
        }
    };

    const handleStarClick = (value) => {
        setRating(value);
    };

    const handleMouseEnter = (value) => {
        setHoverRating(value);
    };

    const handleMouseLeave = () => {
        setHoverRating(0);
    };

    const renderStar = (starIndex) => {
        const currentRating = hoverRating || rating;
        let fillClass = 'empty';

        if (currentRating >= starIndex) {
            fillClass = 'full';
        } else if (currentRating >= starIndex - 0.5) {
            fillClass = 'half';
        }

        return (
            <div key={starIndex} className="star" style={{ position: 'relative' }}>
                {/* Left half - for half star */}
                <div
                    style={{
                        width: '50%',
                        height: '100%',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        zIndex: 2,
                        cursor: 'pointer'
                    }}
                    onClick={() => handleStarClick(starIndex - 0.5)}
                    onMouseEnter={() => handleMouseEnter(starIndex - 0.5)}
                    onMouseLeave={handleMouseLeave}
                />
                {/* Right half - for full star */}
                <div
                    style={{
                        width: '50%',
                        height: '100%',
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        zIndex: 2,
                        cursor: 'pointer'
                    }}
                    onClick={() => handleStarClick(starIndex)}
                    onMouseEnter={() => handleMouseEnter(starIndex)}
                    onMouseLeave={handleMouseLeave}
                />
                {/* Visual star */}
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
                <div className="review-container">
                    <div className="album-cover-section">
                        <img
                            src={albumCover || '/images/no_album_cover.jpg'}
                            alt={albumName || 'Album Cover'}
                            className="album-cover-preview"
                            onError={handleImageError}
                        />
                        <h2>{albumName || 'Album Name'}</h2>
                        <h3>{artistName || 'Artist Name'}</h3>
                    </div>

                    <div className="rating-section">
                        <div className="star-rating-container">
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map(starIndex => renderStar(starIndex))}
                            </div>
                            <div className="rating-display">
                                <span className="rating-number">{rating > 0 ? rating.toFixed(1) : '0.0'}</span> / 5
                            </div>
                        </div>
                    </div>

                    <div className="review-input-section">
                        <h2>Your Review</h2>
                        <textarea
                            className="review-textarea"
                            name="review"
                            placeholder="Write your review here..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                        />
                    </div>

                    <div>
                        <button type="submit" onClick={handleSubmit}>Submit Review</button>
                    </div>
                </div>
            </main>
        </div>
    );
}