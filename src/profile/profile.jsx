import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { getReviewsByUser } from '../review/reviewService';
import { clearAuthToken } from '../login/authService';
import '../app.css';
import './profile.css';

export function Profile({ userName, currentUser, onLogout }) {
    const navigate = useNavigate();
    const { username: urlUsername } = useParams();
    const [userReviews, setUserReviews] = React.useState([]);
    const [favoriteAlbums, setFavoriteAlbums] = React.useState([]);
    const [showFavoritesModal, setShowFavoritesModal] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [tempFavorites, setTempFavorites] = React.useState([]);

    // Determine which user's profile we're viewing
    const profileUser = urlUsername || userName;
    const isOwnProfile = profileUser === userName || profileUser === currentUser;

    React.useEffect(() => {
        // Load reviews for this user from backend API
        const loadUserReviews = async () => {
            const reviews = await getReviewsByUser(profileUser);
            setUserReviews(reviews);
        };

        // Load user's favorite albums
        const loadFavoriteAlbums = async () => {
            try {
                if (isOwnProfile) {
                    // Load own favorites from authenticated endpoint
                    const response = await fetch('/api/user');
                    if (response.ok) {
                        const userData = await response.json();
                        setFavoriteAlbums(userData.favoriteAlbums || []);
                    }
                } else {
                    // Load other user's public favorites
                    const response = await fetch(`/api/user/${profileUser}`);
                    if (response.ok) {
                        const userData = await response.json();
                        setFavoriteAlbums(userData.favoriteAlbums || []);
                    }
                }
            } catch (error) {
                console.error('Error loading favorite albums:', error);
            }
        };

        if (profileUser) {
            loadUserReviews();
            loadFavoriteAlbums();
        }
    }, [profileUser, isOwnProfile]);

    function logout() {
        fetch('/api/auth/logout', {
            method: 'delete',
        })
            .catch(() => {
                // Logout failed. Assuming offline
            })
            .finally(() => {
                clearAuthToken();
                onLogout();
                navigate('/');
            });
    }

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                <span>{'★'.repeat(fullStars)}</span>
                {hasHalfStar && (
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                        <span>☆</span>
                        <span style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            overflow: 'hidden',
                            width: '50%',
                            color: 'inherit'
                        }}>★</span>
                    </span>
                )}
                <span>{'☆'.repeat(emptyStars)}</span>
            </span>
        );
    };

    const handleOpenFavoritesModal = () => {
        setTempFavorites([...favoriteAlbums]);
        setSearchQuery('');
        setSearchResults([]);
        setShowFavoritesModal(true);
    };

    const handleCloseFavoritesModal = () => {
        setShowFavoritesModal(false);
        setSearchQuery('');
        setSearchResults([]);
        setTempFavorites([]);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.items || []);
            } else {
                console.error('Failed to search albums');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching albums:', error);
            setSearchResults([]);
        }
    };

    const handleAddFavorite = (album) => {
        if (tempFavorites.length >= 3) {
            alert('You can only have 3 favorite albums');
            return;
        }

        const albumData = {
            id: album.id,
            name: album.name,
            artist: album.artists[0].name,
            image: album.images[0]?.url || '/images/no_album_cover.jpg'
        };

        setTempFavorites([...tempFavorites, albumData]);
    };

    const handleRemoveFavorite = (albumId) => {
        setTempFavorites(tempFavorites.filter(album => album.id !== albumId));
    };

    const handleSaveFavorites = async () => {
        try {
            const response = await fetch('/api/user/favorites', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favoriteAlbums: tempFavorites })
            });

            if (response.ok) {
                setFavoriteAlbums(tempFavorites);
                handleCloseFavoritesModal();
            } else {
                console.error('Failed to save favorites');
                alert('Failed to save favorites');
            }
        } catch (error) {
            console.error('Error saving favorites:', error);
            alert('Error saving favorites');
        }
    };

    return (
        <div>
            <main>
                <h1>{isOwnProfile ? `Hey ${profileUser}!` : `${profileUser}'s Profile`}</h1>
                {isOwnProfile && onLogout && (
                    <Button variant='danger' onClick={() => logout()} style={{ marginBottom: '1rem' }}>
                        Logout
                    </Button>
                )}

                {/* Favorite Albums Section - only show if there are favorites or it's own profile */}
                {(isOwnProfile || favoriteAlbums.length > 0) && (
                    <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Favorite Albums</h2>
                            {isOwnProfile && (
                                <Button variant='primary' onClick={handleOpenFavoritesModal}>
                                    Edit Favorites
                                </Button>
                            )}
                        </div>
                        {favoriteAlbums.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                No favorite albums yet. Click "Edit Favorites" to add some!
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {favoriteAlbums.map(album => (
                                    <div
                                        key={album.id}
                                        style={{ textAlign: 'center', cursor: 'pointer' }}
                                        onClick={() => navigate(`/album/${album.id}`)}
                                    >
                                        <img
                                            src={album.image}
                                            alt={album.name}
                                            style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem', transition: 'transform 0.2s' }}
                                            onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }}
                                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                        />
                                        <h4 style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>{album.name}</h4>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{album.artist}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="feed-container">
                    <div className="feed-main">
                        {userReviews.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                                You haven't written any reviews yet. Search for an album and write your first review!
                            </p>
                        ) : (
                            userReviews.map(review => (
                                <div key={review.id} className="review-card">
                                    <div
                                        className="album-info"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/album/${review.albumId}`)}
                                    >
                                        <img
                                            src={review.albumCover}
                                            alt={review.albumName}
                                            className="album-cover"
                                            onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }}
                                        />
                                        <div className="album-details">
                                            <h3 className="album-title">{review.albumName}</h3>
                                            <p className="album-artist">{review.artistName}</p>
                                            <p className="review-rating">{renderStars(review.rating)}</p>
                                        </div>
                                    </div>

                                    <div
                                        className="review-content"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/album/${review.albumId}`)}
                                    >
                                        <p className="review-text">{review.reviewText}</p>
                                    </div>

                                    <p className="review-author">@{review.reviewerName}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Favorites Modal */}
                <Modal show={showFavoritesModal} onHide={handleCloseFavoritesModal} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Favorite Albums (Max 3)</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* Search Section */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h5>Search for Albums</h5>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search albums..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch}>Search</Button>
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h5>Search Results</h5>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {searchResults.map(album => {
                                        const isAlreadyAdded = tempFavorites.some(fav => fav.id === album.id);
                                        return (
                                            <div key={album.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                                <img
                                                    src={album.images[0]?.url || '/images/no_album_cover.jpg'}
                                                    alt={album.name}
                                                    style={{ width: '50px', height: '50px', borderRadius: '4px', marginRight: '1rem' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold' }}>{album.name}</div>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{album.artists[0].name}</div>
                                                </div>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => handleAddFavorite(album)}
                                                    disabled={isAlreadyAdded || tempFavorites.length >= 3}
                                                >
                                                    {isAlreadyAdded ? 'Added' : 'Add'}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Current Favorites */}
                        <div>
                            <h5>Current Favorites ({tempFavorites.length}/3)</h5>
                            {tempFavorites.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No favorites selected</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {tempFavorites.map(album => (
                                        <div key={album.id} style={{ textAlign: 'center', position: 'relative' }}>
                                            <img
                                                src={album.image}
                                                alt={album.name}
                                                style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem' }}
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRemoveFavorite(album.id)}
                                                style={{ position: 'absolute', top: '5px', right: '5px' }}
                                            >
                                                Remove
                                            </Button>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{album.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{album.artist}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseFavoritesModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveFavorites}>
                            Save Favorites
                        </Button>
                    </Modal.Footer>
                </Modal>
            </main>
        </div>
    );
}