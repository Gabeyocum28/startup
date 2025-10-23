import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { About } from './about/about';
import { Album } from './album/album';
import { Feed } from './feed/feed';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { Review } from './review/review';
import { Search } from './search/search';
import { mockWebSocket } from './services/mockWebSocket';

import { AuthState } from './login/authState';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

function App() {
    const [userName, setUserName] = React.useState(localStorage.getItem('userName') || '');
    const currentAuthState = userName ? AuthState.Authenticated : AuthState.Unauthenticated;
    const [authState, setAuthState] = React.useState(currentAuthState);
    const [liveNotifications, setLiveNotifications] = React.useState([]);

    React.useEffect(() => {
        if (authState === AuthState.Authenticated) {
            // Start WebSocket and listen for notifications
            const handleNotification = (notification) => {
                setLiveNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep last 10

                // Dispatch custom event so other components can update
                window.dispatchEvent(new CustomEvent('newReview'));
            };

            mockWebSocket.addListener(handleNotification);
            mockWebSocket.start();

            // Cleanup on unmount
            return () => {
                mockWebSocket.removeListener(handleNotification);
                mockWebSocket.stop();
            };
        }
    }, [authState]);



    return (
        <BrowserRouter>
            <div className="app-container">
                <header className="banner">
                    <h1>Polyrhythmd</h1>
                    {authState === AuthState.Unauthenticated && (
                        <NavLink className='nav-link' to='/'>
                            Home
                        </NavLink>
                    )}
                </header>
                <main className="main-content">
                    <Routes>
                        <Route
                            path='/'
                            element={
                            <Login
                                userName={userName}
                                authState={authState}
                                onAuthChange={(userName, authState) => {
                                setAuthState(authState);
                                setUserName(userName);
                                }}
                            />
                            }
                            exact
                        />
                        <Route path='/about' element={<About />} />
                        <Route path='/album/:albumId' element={<Album />} />
                        <Route path='/feed' element={<Feed userName={userName} />} />
                        <Route path='/profile' element={<Profile userName={userName} />} />
                        <Route path='/review' element={<Review userName={userName} />} />
                        <Route path='/search' element={<Search />} />
                        <Route path='*' element={<NotFound />} />
                    </Routes>
                </main>
                <nav className="bottom-nav">
                    <div className="sidebar-header">
                        <h1>Polyrhythmd</h1>
                    </div>
                    {authState === AuthState.Unauthenticated && (
                        <NavLink className='nav-link' to='/about'>
                            About
                        </NavLink>
                    )}
                    {authState === AuthState.Authenticated && (
                        <NavLink className='nav-link' to='/search'>
                            Search
                        </NavLink>
                    )}
                    {authState === AuthState.Authenticated && (
                        <NavLink className='nav-link' to='/feed'>
                            Feed
                        </NavLink>
                    )}
                    {authState === AuthState.Authenticated && (
                        <NavLink className='nav-link' to='/profile'>
                            Profile
                        </NavLink>
                    )}
                    {authState === AuthState.Authenticated && liveNotifications.length > 0 && (
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
                        <a href="https://github.com/Gabeyocum28/startup.git">GitHub</a>
                    </div>
                </nav>
            </div>
        </BrowserRouter>
    );
}

function Home() {
    return (
        <div className="text-center mt-5">
            <h1>Welcome to Polyrhythmd</h1>
            <p>Your gateway to exploring and reviewing albums.</p>
        </div>
    );
}

function NotFound() {
    return <div className='container-fluid bg-secondary text-center'>404: Return to sender. Address unknown.</div>;
}

export default App;