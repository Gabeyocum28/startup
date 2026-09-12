import React from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { About } from './about/about';
import { Album } from './album/album';
import { Feed } from './feed/feed';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { Review } from './review/review';
import { Search } from './search/search';
import { Song } from './song/song';
import { Artist } from './artist/artist';
import { Post } from './feed/post';
import { webSocketClient } from './services/webSocketClient';
import { AuthProvider, useAuth } from './services/AuthContext';
import { Loading } from './components/ui';

import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Shell />
            </BrowserRouter>
        </AuthProvider>
    );
}

function Shell() {
    const { user, loading } = useAuth();
    const [liveNotifications, setLiveNotifications] = React.useState([]);
    const userName = user?.username || '';

    React.useEffect(() => {
        if (!user) return undefined;
        const handleNotification = (notification) => {
            setLiveNotifications(prev => [{ ...notification, id: Date.now() + Math.random() }, ...prev].slice(0, 10));
            window.dispatchEvent(new CustomEvent('newReview'));
        };
        webSocketClient.addListener(handleNotification);
        webSocketClient.connect();
        return () => {
            webSocketClient.removeListener(handleNotification);
            webSocketClient.disconnect();
        };
    }, [user]);

    return (
        <div className="app-container">
            <header className="banner">
                <h1>Polyrhythmd</h1>
                {!user && <NavLink className="nav-link" to="/">Log in</NavLink>}
            </header>
            <main className="main-content">
                {loading ? <Loading /> : (
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/album/:albumId" element={<Album />} />
                        <Route path="/feed" element={<Feed userName={userName} />} />
                        <Route path="/profile" element={<RequireAuth><Profile userName={userName} /></RequireAuth>} />
                        <Route path="/user/:username" element={<Profile currentUser={userName} />} />
                        <Route path="/review" element={<RequireAuth><Review userName={userName} /></RequireAuth>} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/song/:trackId" element={<Song />} />
                        <Route path="/artist/:artistId" element={<Artist />} />
                        <Route path="/post/:reviewId" element={<Post userName={userName} />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                )}
            </main>
            <nav className="bottom-nav">
                <div className="sidebar-header">
                    <h1>Polyrhythmd</h1>
                </div>
                <NavLink className="nav-link" to="/search">Search</NavLink>
                <NavLink className="nav-link" to="/feed">Feed</NavLink>
                {user
                    ? <NavLink className="nav-link" to="/profile">Profile</NavLink>
                    : <NavLink className="nav-link" to="/">Log in</NavLink>}
                {user && liveNotifications.length > 0 && (
                    <div className="live-feed-section">
                        <h3 className="live-feed-title">Live Activity</h3>
                        <div className="live-feed-items">
                            {liveNotifications.map(notification => (
                                <div key={notification.id} className="live-feed-item">
                                    <p className="live-feed-text">
                                        <strong>{notification.userName}</strong> gave <strong>{notification.albumName}</strong> {notification.rating} stars!
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="footer-info">
                    <p>&copy; 2025 polyrhythmd</p>
                    <NavLink to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About</NavLink>
                    <br />
                    <a href="https://github.com/Gabeyocum28/startup.git">GitHub</a>
                </div>
            </nav>
        </div>
    );
}

// Sends logged-out visitors to the login page, remembering where they wanted to go.
function RequireAuth({ children }) {
    const { user } = useAuth();
    const location = useLocation();
    if (!user) return <Navigate to="/" replace state={{ from: location }} />;
    return children;
}

function NotFound() {
    return (
        <div className="ui-empty">
            <h3>404</h3>
            <p>Return to sender. Address unknown.</p>
            <NavLink to="/feed">Back to the feed</NavLink>
        </div>
    );
}

export default App;
