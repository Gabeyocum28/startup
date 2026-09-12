// Review service using backend API
import { api } from '../services/api';

// Paginated feed. Returns { reviews, nextBefore }.
export function getReviews({ limit = 20, before = null, scope = 'all' } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    if (scope === 'following') params.set('scope', 'following');
    return api(`/api/reviews?${params}`);
}

export function getReview(id) {
    return api(`/api/reviews/${encodeURIComponent(id)}`);
}

export function addReview(reviewData) {
    return api('/api/reviews', { method: 'POST', body: reviewData });
}

export function updateReview(id, { rating, reviewText }) {
    return api(`/api/reviews/${encodeURIComponent(id)}`, { method: 'PUT', body: { rating, reviewText } });
}

export function deleteReview(id) {
    return api(`/api/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

async function safeList(path) {
    try {
        return await api(path);
    } catch (error) {
        console.error('Failed to fetch', path, error);
        return [];
    }
}

export function getReviewsByUser(username) {
    return safeList(`/api/reviews/user/${encodeURIComponent(username)}`);
}

export function getReviewsByAlbum(albumId) {
    return safeList(`/api/reviews/album/${encodeURIComponent(albumId)}`);
}

export function getReviewsByContent(contentType, contentId) {
    return safeList(`/api/reviews/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}`);
}
