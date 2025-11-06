import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../app.css';
import './search.css';

export function Search() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasSearched, setHasSearched] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleImageError = (e) => {
        e.target.src = '/images/no_album_cover.jpg';
    };

    async function handleSearch() {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        setError(null);

        try {
            // Call backend Spotify API endpoint
            const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.items || []);
            } else {
                const errorData = await response.json();
                setError(errorData.msg || 'Failed to search albums');
                setSearchResults([]);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to connect to server. Please try again.');
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleAlbumClick(albumId) {
        navigate(`/album/${albumId}`);
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }

    return (
        <div>
            <main>
                <h1>Search Albums</h1>
                <label htmlFor="album-search">Search Album:</label>
                <input
                    id="album-search"
                    name="album-search"
                    className="standard_search"
                    placeholder="Enter album or artist name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <div>
                    <button className="aura" onClick={handleSearch}>Search</button>
                </div>

                {isLoading && <p>Searching Spotify...</p>}

                {error && (
                    <p className="error-message" style={{ color: 'var(--error-color, #ff4444)', marginTop: '1rem' }}>
                        {error}
                    </p>
                )}

                {searchResults.length > 0 && (
                    <div className="search-results-container">
                        <h2>Search Results ({searchResults.length})</h2>
                        {searchResults.map(album => (
                            <div
                                key={album.id}
                                className="review-card search-result-card"
                                onClick={() => handleAlbumClick(album.id)}
                            >
                                <div className="album-info search-album-info">
                                    <img
                                        src={album.images[2].url}
                                        alt={album.name}
                                        className="album-cover search-album-cover"
                                        onError={handleImageError}
                                    />
                                    <div className="album-details">
                                        <h3 className="album-title">{album.name}</h3>
                                        <p className="album-artist">{album.artists[0].name}</p>
                                        <p className="search-album-metadata">
                                            {album.release_date.split('-')[0]} • {album.total_tracks} tracks
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {hasSearched && searchResults.length === 0 && !isLoading && (
                    <p className="no-results">
                        No albums found for "{searchQuery}"
                    </p>
                )}
            </main>
        </div>
    );
}

