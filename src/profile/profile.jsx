import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { getReviewsByUser } from '../review/reviewService';
import { api, contentPath } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { ReviewCard } from '../components/ReviewCard';
import { Stars } from '../components/Stars';
import { Loading, EmptyState, ErrorMessage } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';
import './profile.css';

const TABS = [
    { key: 'reviews', label: 'Reviews' },
    { key: 'ratings', label: 'Ratings' },
    { key: 'listened', label: 'Listened' },
    { key: 'wantToListen', label: 'Want to listen' },
];

export function Profile() {
    const navigate = useNavigate();
    const { username: urlUsername } = useParams();
    const { user, setUser, logout, refresh } = useAuth();

    const profileUser = urlUsername || user?.username;
    const isOwnProfile = !!user && profileUser === user.username;

    useDocumentTitle(profileUser ? `@${profileUser}` : 'Profile', `Music reviews and ratings by ${profileUser}.`);

    const [profile, setProfile] = React.useState(null);
    const [reviews, setReviews] = React.useState([]);
    const [ratings, setRatings] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);
    const [tab, setTab] = React.useState('reviews');
    const [followBusy, setFollowBusy] = React.useState(false);
    const [showFavorites, setShowFavorites] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);

    const load = React.useCallback(async () => {
        if (!profileUser) return;
        setLoading(true);
        setNotFound(false);
        try {
            const [p, r, rt] = await Promise.all([
                api(`/api/user/${encodeURIComponent(profileUser)}`),
                getReviewsByUser(profileUser),
                api(`/api/user/${encodeURIComponent(profileUser)}/ratings`).catch(() => []),
            ]);
            setProfile(p);
            setReviews(r);
            setRatings(rt);
        } catch (err) {
            if (err.status === 404) setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [profileUser]);

    React.useEffect(() => { load(); }, [load]);

    // Own profile: keep lists in sync with the auth context (ListButtons updates it).
    const lists = isOwnProfile && user?.lists ? user.lists : profile?.lists || { listened: [], wantToListen: [] };
    const favoriteAlbums = isOwnProfile && user ? user.favoriteAlbums || [] : profile?.favoriteAlbums || [];

    async function toggleFollow() {
        if (!user) return navigate('/', { state: { from: { pathname: `/user/${profileUser}` } } });
        setFollowBusy(true);
        try {
            const method = profile.followedByMe ? 'DELETE' : 'POST';
            await api(`/api/users/${encodeURIComponent(profileUser)}/follow`, { method });
            setProfile(p => ({
                ...p,
                followedByMe: !p.followedByMe,
                followers: p.followedByMe ? p.followers.filter(f => f !== user.username) : [...p.followers, user.username],
            }));
            await refresh();
        } catch { /* ignore */ } finally {
            setFollowBusy(false);
        }
    }

    async function handleLogout() {
        await logout();
        navigate('/');
    }

    if (!profileUser) return <div><main><EmptyState title="No profile">Log in to see your profile.</EmptyState></main></div>;
    if (loading) return <div><main><Loading label="Loading profile…" /></main></div>;
    if (notFound || !profile) return <div><main><EmptyState title="User not found">There is no one called @{profileUser}.</EmptyState></main></div>;

    return (
        <div>
            <main>
                <div className="profile-header">
                    <div>
                        <h1>{isOwnProfile ? `Hey ${profileUser}!` : `@${profileUser}`}</h1>
                        <p className="profile-stats">
                            <span><strong>{reviews.length}</strong> reviews</span>
                            <span><strong>{ratings.length}</strong> ratings</span>
                            <span><strong>{profile.followers?.length || 0}</strong> followers</span>
                            <span><strong>{profile.following?.length || 0}</strong> following</span>
                        </p>
                    </div>
                    <div className="profile-actions">
                        {isOwnProfile ? (
                            <>
                                <Button variant="outline-light" onClick={() => setShowSettings(true)}>Settings</Button>
                                <Button variant="danger" onClick={handleLogout}>Log out</Button>
                            </>
                        ) : (
                            <Button variant={profile.followedByMe ? 'outline-light' : 'primary'} disabled={followBusy} onClick={toggleFollow}>
                                {profile.followedByMe ? 'Following' : 'Follow'}
                            </Button>
                        )}
                    </div>
                </div>

                {(isOwnProfile || favoriteAlbums.length > 0) && (
                    <section className="favorites-section">
                        <div className="favorites-head">
                            <h2>Favorite Albums</h2>
                            {isOwnProfile && <Button size="sm" variant="primary" onClick={() => setShowFavorites(true)}>Edit</Button>}
                        </div>
                        {favoriteAlbums.length === 0 ? (
                            <p className="ui-muted" style={{ textAlign: 'center' }}>No favorite albums yet.</p>
                        ) : (
                            <div className="favorites-grid">
                                {favoriteAlbums.map(album => (
                                    <div key={album.id} className="favorite-album" onClick={() => navigate(`/album/${album.id}`)}>
                                        <img src={album.image} alt={album.name} onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }} />
                                        <h4>{album.name}</h4>
                                        <p>{album.artist}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                <div className="profile-tabs" role="tablist">
                    {TABS.map(t => (
                        <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
                            {t.label}
                            <span className="tab-count">
                                {t.key === 'reviews' ? reviews.length : t.key === 'ratings' ? ratings.length : (lists[t.key] || []).length}
                            </span>
                        </button>
                    ))}
                </div>

                {tab === 'reviews' && (
                    <div className="feed-container"><div className="feed-main">
                        {reviews.length === 0 ? (
                            <EmptyState title="No reviews yet">
                                {isOwnProfile ? 'Search for an album and write your first review.' : `@${profileUser} has not written any reviews.`}
                            </EmptyState>
                        ) : reviews.map(review => (
                            <ReviewCard key={review.id} review={review} onDelete={(id) => setReviews(prev => prev.filter(r => r.id !== id))} />
                        ))}
                    </div></div>
                )}

                {tab === 'ratings' && (
                    ratings.length === 0 ? <EmptyState title="No ratings yet">Quick-rate anything with the stars on its page.</EmptyState> : (
                        <div className="rating-history">
                            {ratings.map(r => (
                                <div key={`${r.contentType}:${r.contentId}`} className="rating-row" onClick={() => navigate(contentPath(r.contentType, r.contentId))}>
                                    <img src={r.contentCover || '/images/no_album_cover.jpg'} alt="" onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }} />
                                    <div className="rating-row-text">
                                        <span className="rating-row-name">{r.contentName || `${r.contentType} #${r.contentId}`}</span>
                                        {r.artistName && <span className="ui-muted">{r.artistName}</span>}
                                    </div>
                                    <Stars rating={r.rating} />
                                    <span className="rating-row-type">{r.contentType}</span>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {(tab === 'listened' || tab === 'wantToListen') && (
                    (lists[tab] || []).length === 0 ? (
                        <EmptyState title="Nothing here yet">
                            {isOwnProfile ? 'Use the buttons on any album, song, or artist page to add it.' : 'This list is empty.'}
                        </EmptyState>
                    ) : (
                        <div className="list-grid">
                            {lists[tab].map(item => (
                                <div key={`${item.type}:${item.id}`} className="list-item" onClick={() => navigate(contentPath(item.type, item.id))}>
                                    <img src={item.image || '/images/no_album_cover.jpg'} alt={item.name} loading="lazy" onError={(e) => { e.target.src = '/images/no_album_cover.jpg'; }} />
                                    <h4>{item.name}</h4>
                                    <p className="ui-muted">{item.artist || item.type}</p>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {isOwnProfile && (
                    <>
                        <FavoritesModal show={showFavorites} onHide={() => setShowFavorites(false)} favorites={favoriteAlbums} onSaved={(f) => setUser(u => ({ ...u, favoriteAlbums: f }))} />
                        <SettingsModal show={showSettings} onHide={() => setShowSettings(false)} onDeleted={handleLogout} />
                    </>
                )}
            </main>
        </div>
    );
}

function FavoritesModal({ show, onHide, favorites, onSaved }) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [temp, setTemp] = React.useState(favorites);
    const [error, setError] = React.useState(null);
    const [searching, setSearching] = React.useState(false);

    React.useEffect(() => { if (show) { setTemp(favorites); setQuery(''); setResults([]); setError(null); } }, [show, favorites]);

    async function search() {
        if (!query.trim()) return;
        setSearching(true);
        try {
            const data = await api(`/api/albums/search?q=${encodeURIComponent(query)}`);
            setResults(data.items || []);
        } catch (err) { setError(err.message); } finally { setSearching(false); }
    }

    function add(album) {
        if (temp.length >= 3) return;
        setTemp([...temp, { id: album.id, name: album.name, artist: album.artists[0].name, image: album.images[0]?.url || '/images/no_album_cover.jpg' }]);
    }

    async function save() {
        try {
            await api('/api/user/favorites', { method: 'PUT', body: { favoriteAlbums: temp } });
            onSaved(temp);
            onHide();
        } catch (err) { setError(err.message); }
    }

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton><Modal.Title>Edit Favorite Albums (max 3)</Modal.Title></Modal.Header>
            <Modal.Body>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="text" className="form-control" placeholder="Search albums…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
                    <Button onClick={search} disabled={searching}>{searching ? '…' : 'Search'}</Button>
                </div>
                <ErrorMessage>{error}</ErrorMessage>
                {results.length > 0 && (
                    <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: '1rem' }}>
                        {results.map(album => {
                            const added = temp.some(f => f.id === album.id);
                            return (
                                <div key={album.id} className="fav-result">
                                    <img src={album.images[2]?.url || album.images[0]?.url} alt="" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{album.name}</div>
                                        <div className="ui-muted">{album.artists[0].name}</div>
                                    </div>
                                    <Button variant="success" size="sm" onClick={() => add(album)} disabled={added || temp.length >= 3}>{added ? 'Added' : 'Add'}</Button>
                                </div>
                            );
                        })}
                    </div>
                )}
                <h6>Current favorites ({temp.length}/3)</h6>
                <div className="favorites-grid">
                    {temp.map(album => (
                        <div key={album.id} className="favorite-album" style={{ position: 'relative' }}>
                            <img src={album.image} alt={album.name} />
                            <Button variant="danger" size="sm" style={{ position: 'absolute', top: 5, right: 5 }} onClick={() => setTemp(temp.filter(a => a.id !== album.id))}>Remove</Button>
                            <h4>{album.name}</h4>
                            <p>{album.artist}</p>
                        </div>
                    ))}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={save}>Save</Button>
            </Modal.Footer>
        </Modal>
    );
}

function SettingsModal({ show, onHide, onDeleted }) {
    const [current, setCurrent] = React.useState('');
    const [next, setNext] = React.useState('');
    const [deletePw, setDeletePw] = React.useState('');
    const [msg, setMsg] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [confirming, setConfirming] = React.useState(false);
    const { setUser } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => { if (show) { setCurrent(''); setNext(''); setDeletePw(''); setMsg(null); setError(null); setConfirming(false); } }, [show]);

    async function changePassword(e) {
        e.preventDefault();
        setError(null);
        try {
            await api('/api/user/password', { method: 'PUT', body: { currentPassword: current, newPassword: next } });
            // Server clears the session; send them to log in again.
            setUser(null);
            navigate('/', { replace: true });
        } catch (err) { setError(err.message); }
    }

    async function deleteAccount(e) {
        e.preventDefault();
        setError(null);
        try {
            await api('/api/user', { method: 'DELETE', body: { password: deletePw } });
            onDeleted();
        } catch (err) { setError(err.message); }
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton><Modal.Title>Account settings</Modal.Title></Modal.Header>
            <Modal.Body>
                <form onSubmit={changePassword} className="settings-form">
                    <h6>Change password</h6>
                    <p className="ui-muted">You will be logged out everywhere after changing it.</p>
                    <input className="form-control" type="password" autoComplete="current-password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                    <input className="form-control" type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={next} onChange={(e) => setNext(e.target.value)} />
                    <Button type="submit" size="sm" disabled={!current || next.length < 8}>Update password</Button>
                </form>
                <hr />
                <form onSubmit={deleteAccount} className="settings-form">
                    <h6>Delete account</h6>
                    <p className="ui-muted">Removes your account, reviews, ratings, comments, and lists. This cannot be undone.</p>
                    {!confirming ? (
                        <Button variant="outline-danger" size="sm" onClick={() => setConfirming(true)}>Delete my account…</Button>
                    ) : (
                        <>
                            <input className="form-control" type="password" autoComplete="current-password" placeholder="Confirm your password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} />
                            <Button type="submit" variant="danger" size="sm" disabled={!deletePw}>Permanently delete</Button>
                        </>
                    )}
                </form>
                <ErrorMessage>{error}</ErrorMessage>
                {msg && <p>{msg}</p>}
            </Modal.Body>
        </Modal>
    );
}
