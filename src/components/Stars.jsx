import React from 'react';

// Read-only star display for a 0.5-step rating out of 5.
export function Stars({ rating, className = '' }) {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(value);
    const half = value % 1 !== 0;
    const empty = 5 - full - (half ? 1 : 0);
    return (
        <span className={`stars ${className}`} aria-label={`${value} out of 5 stars`} title={`${value} / 5`}>
            <span>{'★'.repeat(full)}</span>
            {half && (
                <span className="stars-half">
                    <span>☆</span>
                    <span className="stars-half-fill">★</span>
                </span>
            )}
            <span>{'☆'.repeat(empty)}</span>
        </span>
    );
}

// Compact "4.2 (37)" pill for aggregate ratings.
export function AverageBadge({ average, count }) {
    if (!count) return null;
    return (
        <span className="avg-badge" title={`${count} rating${count === 1 ? '' : 's'}`}>
            ★ {Number(average).toFixed(1)} <span className="avg-badge-count">({count})</span>
        </span>
    );
}
