import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../app.css';
import './album.css';

export function Album() {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetch('/album_info.JSON')
            .then(response => response.json())
            .then(data => {
                const foundAlbum = data.albums.find(a => a.id === albumId);
                setAlbum(foundAlbum);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error loading album:', error);
                setIsLoading(false);
            });
    }, [albumId]);

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const handleImageError = (e) => {
        e.target.src = '/images/no_album_cover.jpg';
    };

    if (isLoading) {
        return (
            <div>
                <main>
                    <p>Loading album...</p>
                </main>
            </div>
        );
    }

    if (!album) {
        return (
            <div>
                <main>
                    <h1>Album Not Found</h1>
                    <p>Sorry, we couldn't find the album you're looking for.</p>
                    <button onClick={() => navigate('/search')}>Back to Search</button>
                </main>
            </div>
        );
    }

    return (
        <div>
            <main>
                <div className="album-info">
                    <img
                        src={album.images[0].url}
                        alt={album.name}
                        className="album-detail-cover"
                        onError={handleImageError}
                    />
                    <div className="album-detail-text">
                        <h1>{album.name}</h1>
                        <h3>by {album.artists.map(a => a.name).join(', ')}</h3>
                        <button type="button" className='aura' onClick={() => navigate('/review', { state: {
                            albumId: album.id,
                            albumName: album.name,
                            artistName: album.artists.map(a => a.name).join(', '),
                            albumCover: album.images[0].url
                        } })}>Write a Review</button>
                        <p>
                            Released: {new Date(album.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p>
                            Label: {album.label}
                        </p>
                        <p>
                            Total Tracks: {album.total_tracks}
                        </p>
                        <p>
                            Popularity: {album.popularity}/100
                        </p>
                        <p className="genres">
                            Genres: {album.genres.join(', ')}
                        </p>
                    </div>
                </div>

                <div className="tracklist-container">
                    <h2>Tracklist</h2>
                    {album.tracks.items.map(track => (
                        <div key={track.id} className="track-item">
                            <div className="track-info">
                                <span className="track-number">
                                    {track.track_number}
                                </span>
                                <span className="track-name">
                                    {track.name}
                                    {track.explicit && <span className="explicit-tag">🅴</span>}
                                </span>
                            </div>
                            <span className="track-duration">
                                {formatDuration(track.duration_ms)}
                            </span>
                        </div>
                    ))}
                </div>

                <div>
                    <h2>Reviews</h2>
                    <p className="reviews-placeholder">
                        No reviews yet. Be the first to review this album!
                    </p>
                </div>
            </main>
        </div>
    );
}