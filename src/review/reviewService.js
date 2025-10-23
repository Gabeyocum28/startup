// Simple review service using localStorage with single array
// Easy to migrate to MongoDB later

// Get all reviews
export function getAllReviews() {
    const reviews = localStorage.getItem('reviews');
    return reviews ? JSON.parse(reviews) : [];
}

// Add a new review
export function addReview(reviewData, userName) {
    const reviews = getAllReviews();
    console.log('Adding review with userName:', userName);

    const newReview = {
        id: Date.now().toString(),
        albumId: reviewData.albumId,
        albumName: reviewData.albumName,
        artistName: reviewData.artistName,
        albumCover: reviewData.albumCover,
        rating: reviewData.rating,
        reviewText: reviewData.reviewText,
        reviewerName: userName || 'Anonymous',
        createdAt: new Date().toISOString(),
        likes: 0
    };

    reviews.unshift(newReview); // Add to beginning (newest first)
    localStorage.setItem('reviews', JSON.stringify(reviews));
    return newReview;
}

// Get reviews by user
export function getReviewsByUser(username) {
    return getAllReviews().filter(r => r.reviewerName === username);
}

// Get reviews by album
export function getReviewsByAlbum(albumId) {
    return getAllReviews().filter(r => r.albumId === albumId);
}
