import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { About } from './about/about';
import { Album } from './album/album';
import { Feed } from './feed/feed';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { Register } from './register/register';
import { Review } from './review/review';
import { Search } from './search/search';

import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

function App() {
    return (
        <BrowserRouter>
            <div className="app-container">
                <header className="banner">
                    <h1>Polyrhythmd</h1>
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/about">About</NavLink>
                    <NavLink to="/login">Login</NavLink>
                    <NavLink to="/register">Register</NavLink>
                    <NavLink to="/profile">Profile</NavLink>
                    <NavLink to="/search">Search</NavLink>
                    <NavLink to="/album">Album</NavLink>
                    <NavLink to="/review">Review</NavLink>
                    <NavLink to="/feed">Feed</NavLink>
                </header>
                <main className="main-content">
                    <Routes>
                        <Route path='/' element={<Home />} />
                        <Route path='/about' element={<About />} />
                        <Route path='/album' element={<Album />} />
                        <Route path='/feed' element={<Feed />} />
                        <Route path='/login' element={<Login />} />
                        <Route path='/profile' element={<Profile />} />
                        <Route path='/register' element={<Register />} />
                        <Route path='/review' element={<Review />} />
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