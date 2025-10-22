import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { About } from './about/about';
import { Album } from './album/album';
import { Feed } from './feed/feed';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { Review } from './review/review';
import { Search } from './search/search';

import { AuthState } from './login/authState';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

function App() {
    const [userName, setUserName] = React.useState(localStorage.getItem('userName') || '');
    const currentAuthState = userName ? AuthState.Authenticated : AuthState.Unauthenticated;
    const [authState, setAuthState] = React.useState(currentAuthState);



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
                        <NavLink className='nav-link' to='/review'>
                            Review
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
                        <Route path='/album' element={<Album />} />
                        <Route path='/feed' element={<Feed userName={userName} />} />
                        <Route path='/profile' element={<Profile userName={userName} />} />
                        <Route path='/review' element={<Review userName={userName} />} />
                        <Route path='/search' element={<Search />} />
                        <Route path='*' element={<NotFound />} />
                    </Routes>
                </main>
                <footer>
                    <p>&copy; 2025 polyrhythmd. All rights reserved.</p>
                    <a href="https://github.com/Gabeyocum28/startup.git">My Github Repo</a>
                </footer>
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