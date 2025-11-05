// Review service using backend API

// Get all reviews
export async function getAllReviews() {
    try {
        const response = await fetch('/api/reviews');
        if (response.ok) {
            return await response.json();
        }
        console.error('Failed to fetch reviews:', response.statusText);
        return [];
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

// Add a new review
export async function addReview(reviewData, userName) {
    console.log('Adding review with userName:', userName);

    const newReview = {
        albumId: reviewData.albumId,
        albumName: reviewData.albumName,
        artistName: reviewData.artistName,
        albumCover: reviewData.albumCover,
        rating: reviewData.rating,
        reviewText: reviewData.reviewText,
        reviewerName: userName || 'Anonymous'
    };

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newReview)
        });

        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            throw new Error(error.msg || 'Failed to add review');
        }
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
}

// Get reviews by user
export async function getReviewsByUser(username) {
    try {
        const response = await fetch(`/api/reviews/user/${encodeURIComponent(username)}`);
        if (response.ok) {
            return await response.json();
        }
        console.error('Failed to fetch user reviews:', response.statusText);
        return [];
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        return [];
    }
}

// Get reviews by album
export async function getReviewsByAlbum(albumId) {
    try {
        const response = await fetch(`/api/reviews/album/${encodeURIComponent(albumId)}`);
        if (response.ok) {
            return await response.json();
        }
        console.error('Failed to fetch album reviews:', response.statusText);
        return [];
    } catch (error) {
        console.error('Error fetching album reviews:', error);
        return [];
    }
}
