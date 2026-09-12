import React from 'react';
import { getReviews } from '../review/reviewService';
import { ReviewCard } from '../components/ReviewCard';
import { Loading, EmptyState, ErrorMessage } from '../components/ui';
import { useAuth } from '../services/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';
import './feed.css';

const PAGE = 20;

export function Feed() {
    useDocumentTitle('Feed', 'The latest music reviews from the Polyrhythmd community.');
    const { user } = useAuth();
    const [scope, setScope] = React.useState('all');
    const [reviews, setReviews] = React.useState([]);
    const [nextBefore, setNextBefore] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [error, setError] = React.useState(null);

    const loadFirstPage = React.useCallback(async (which) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getReviews({ limit: PAGE, scope: which });
            setReviews(data.reviews);
            setNextBefore(data.nextBefore);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadFirstPage(scope);
        const refresh = () => loadFirstPage(scope);
        window.addEventListener('newReview', refresh);
        return () => window.removeEventListener('newReview', refresh);
    }, [scope, loadFirstPage]);

    async function loadMore() {
        if (!nextBefore) return;
        setLoadingMore(true);
        try {
            const data = await getReviews({ limit: PAGE, before: nextBefore, scope });
            setReviews(prev => [...prev, ...data.reviews]);
            setNextBefore(data.nextBefore);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingMore(false);
        }
    }

    const followingCount = user?.following?.length || 0;

    return (
        <div>
            <main>
                <div className="feed-header">
                    <h1>Feed</h1>
                    {user && (
                        <div className="feed-tabs" role="tablist">
                            <button type="button" role="tab" aria-selected={scope === 'all'} className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>Everyone</button>
                            <button type="button" role="tab" aria-selected={scope === 'following'} className={scope === 'following' ? 'active' : ''} onClick={() => setScope('following')}>Following</button>
                        </div>
                    )}
                </div>
                <div className="feed-container">
                    <div className="feed-main">
                        <ErrorMessage>{error}</ErrorMessage>
                        {loading ? <Loading label="Loading reviews…" /> : reviews.length === 0 ? (
                            scope === 'following' ? (
                                <EmptyState title="Nothing here yet">
                                    {followingCount === 0
                                        ? 'You are not following anyone. Open a profile and hit Follow.'
                                        : 'The people you follow have not posted yet.'}
                                </EmptyState>
                            ) : (
                                <EmptyState title="No reviews yet">Be the first to write one.</EmptyState>
                            )
                        ) : (
                            <>
                                {reviews.map(review => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        onDelete={(id) => setReviews(prev => prev.filter(r => r.id !== id))}
                                    />
                                ))}
                                {nextBefore && (
                                    <button type="button" className="aura load-more" disabled={loadingMore} onClick={loadMore}>
                                        {loadingMore ? 'Loading…' : 'Load more'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
