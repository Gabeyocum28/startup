import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../app.css';
import './search.css';

function scoreResult(item, query) {
    const q = query.toLowerCase();
    const name = item.name.toLowerCase();

    // Name relevance (smaller gaps so popularity can override)
    if (name === q) return 50;
    if (name.startsWith(q)) return 45;
    if (name.includes(` ${q}`) || name.includes(`${q} `)) return 40;
    if (name.includes(q)) return 35;

    // Check secondary fields (artist name on albums/tracks)
    const secondary = (item._artist || '').toLowerCase();
    if (secondary === q) return 40;
    if (secondary.startsWith(q)) return 35;
    if (secondary.includes(q)) return 25;

    return 10;
}

const typeBonus = { artist: 0, album: 0, track: 0 };

export function Search() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [rankedResults, setRankedResults] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasSearched, setHasSearched] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleImageError = (e) => {
        e.target.src = '/images/no_album_cover.jpg';
    };

    async function handleSearch() {
        if (!searchQuery.trim()) {
            setRankedResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        setError(null);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);

            if (response.ok) {
                const data = await response.json();
                const q = searchQuery;

                // Tag each result with its type, index (Deezer returns by popularity), and score
                const all = [
                    ...(data.artists || []).map((a, i) => ({ ...a, _type: 'artist', _artist: a.name, _rank: i })),
                    ...(data.albums || []).map((a, i) => ({ ...a, _type: 'album', _artist: a.artists[0].name, _rank: i })),
                    ...(data.tracks || []).map((t, i) => ({ ...t, _type: 'track', _artist: t.artist, _rank: i }))
                ];

                all.forEach((item) => {
                    item._score = scoreResult(item, q) + typeBonus[item._type];
                    // Deezer returns results by popularity — first result = most popular
                    // Bonus: rank 0 gets 15, rank 1 gets 12, rank 2 gets 9, etc.
                    item._score += Math.max(0, 15 - item._rank * 3);
                    // Fan count only as tiebreaker between artists with same score
                    if (item._type === 'artist' && item.fans) {
                        item._score += Math.min(Math.log10(item.fans + 1), 2);
                    }
                });

                all.sort((a, b) => b._score - a._score);

                setRankedResults(all);
            } else {
                const errorData = await response.json();
                setError(errorData.msg || 'Failed to search');
                setRankedResults([]);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to connect to server. Please try again.');
            setRankedResults([]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function renderResult(item) {
        if (item._type === 'artist') {
            return (
                <div
                    key={`artist-${item.id}`}
                    className="review-card search-result-card"
                    onClick={() => navigate(`/artist/${item.id}`)}
                >
                    <div className="album-info search-album-info">
                        <img
                            src={item.image || '/images/no_album_cover.jpg'}
                            alt={item.name}
                            className="album-cover search-album-cover search-artist-cover"
                            onError={handleImageError}
                        />
                        <div className="album-details">
                            <h3 className="album-title">{item.name}</h3>
                            <p className="search-result-type">Artist</p>
                            <p className="album-artist">{item.fans.toLocaleString()} fans</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (item._type === 'album') {
            return (
                <div
                    key={`album-${item.id}`}
                    className="review-card search-result-card"
                    onClick={() => navigate(`/album/${item.id}`)}
                >
                    <div className="album-info search-album-info">
                        <img
                            src={item.images?.[2]?.url || item.images?.[0]?.url || '/images/no_album_cover.jpg'}
                            alt={item.name}
                            className="album-cover search-album-cover"
                            onError={handleImageError}
                        />
                        <div className="album-details">
                            <h3 className="album-title">{item.name}</h3>
                            <p className="search-result-type">Album</p>
                            <p className="album-artist">
                                <span className="search-link" onClick={(e) => { e.stopPropagation(); navigate(`/artist/${item.artists[0].id}`); }}>{item.artists[0].name}</span>
                                {' '} • {item.total_tracks} tracks
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // track
        return (
            <div
                key={`track-${item.id}`}
                className="review-card search-result-card"
                onClick={() => navigate(`/song/${item.id}`)}
            >
                <div className="album-info search-album-info">
                    <img
                        src={item.image || '/images/no_album_cover.jpg'}
                        alt={item.name}
                        className="album-cover search-album-cover"
                        onError={handleImageError}
                    />
                    <div className="album-details">
                        <h3 className="album-title">{item.name}</h3>
                        <p className="search-result-type">Song</p>
                        <p className="album-artist">
                            <span className="search-link" onClick={(e) => { e.stopPropagation(); navigate(`/artist/${item.artistId}`); }}>{item.artist}</span>
                            {' '} • <span className="search-link" onClick={(e) => { e.stopPropagation(); navigate(`/album/${item.albumId}`); }}>{item.albumName}</span>
                            {' '} • {formatDuration(item.duration_ms)}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <main>
                <h1>Search</h1>
                <label htmlFor="album-search">Search albums, songs, and artists:</label>
                <input
                    id="album-search"
                    name="album-search"
                    className="standard_search"
                    placeholder="Enter a name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <div>
                    <button className="aura" onClick={handleSearch}>Search</button>
                </div>

                {isLoading && <p>Searching...</p>}

                {error && (
                    <p className="error-message" style={{ color: 'var(--error-color, #ff4444)', marginTop: '1rem' }}>
                        {error}
                    </p>
                )}

                {rankedResults.length > 0 && (
                    <div className="search-results-container">
                        <h2>Results ({rankedResults.length})</h2>
                        {rankedResults.map(item => renderResult(item))}
                    </div>
                )}

                {hasSearched && rankedResults.length === 0 && !isLoading && (
                    <p className="no-results">
                        No results found for "{searchQuery}"
                    </p>
                )}
            </main>
        </div>
    );
}
