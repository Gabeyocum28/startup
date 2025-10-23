import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../app.css';

export function Search() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [albums, setAlbums] = React.useState([]);
    const [searchResults, setSearchResults] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasSearched, setHasSearched] = React.useState(false);

    React.useEffect(() => {
        // TODO: When switching to real Spotify API, remove this and use searchSpotify() instead
        fetch('/album_info.JSON')
            .then(response => response.json())
            .then(data => {
                setAlbums(data.albums);
            })
            .catch(error => console.error('Error loading albums:', error));
    }, []);

    function handleSearch() {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        const results = albums.filter(album =>
            album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            album.artists[0].name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setSearchResults(results);
        setIsLoading(false);

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
                    className="standard"
                    placeholder="Enter album or artist name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <div>
                    <button className="aura" onClick={handleSearch}>Search</button>
                </div>

                {isLoading && <p>Searching...</p>}

                {searchResults.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h2>Search Results ({searchResults.length})</h2>
                        {searchResults.map(album => (
                            <div
                                key={album.id}
                                className="review-card search-result-card"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleAlbumClick(album.id)}
                            >
                                <div className="album-info search-album-info">
                                    <img
                                        src={album.images[2].url}
                                        alt={album.name}
                                        className="album-cover search-album-cover"
                                    />
                                    <div className="album-details">
                                        <h3 className="album-title">{album.name}</h3>
                                        <p className="album-artist">{album.artists[0].name}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {album.release_date.split('-')[0]} • {album.total_tracks} tracks
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {hasSearched && searchResults.length === 0 && !isLoading && (
                    <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>
                        No albums found for "{searchQuery}"
                    </p>
                )}
            </main>
        </div>
    );
}

