import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { About } from './about/about';
import { Album } from './album/album';
import { Edit } from './about/about';
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
            <div>
                <header class="banner">
                    <h1>Polyrhythmd</h1>
                    <NavLink to="">Home</NavLink>
                    <NavLink to="About">About</NavLink>
                    <NavLink to="Login">Login</NavLink>
                    <NavLink to="Register">Register</NavLink>
                    <NavLink to="Profile">Profile</NavLink>
                    <NavLink to="Search">Search</NavLink>
                    <NavLink to="Album">Album</NavLink>
                    <NavLink to="Review">Review</NavLink>
                    <NavLink to="Feed">Feed</NavLink>
                </header>
                <Routes>
                    <Route path='/'/>
                    <Route path='/about' element={<About />} />
                    <Route path='/album' element={<Album />} />
                    <Route path='/edit' element={<Edit />} />
                    <Route path='/feed' element={<Feed />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/profile' element={<Profile />} />
                    <Route path='/register' element={<Register />} />
                    <Route path='/review' element={<Review />} />
                    <Route path='/search' element={<Search />} />
                    <Route path='*' element={<NotFound />} />
                </Routes>
                <footer>
                    <p>&copy; 2025 polyrhythmd. All rights reserved.</p>
                    <a href="https://github.com/Gabeyocum28/startup.git">My Github Repo</a>
                </footer>
            </div>

        </BrowserRouter>
    );
}

function NotFound() {
  return <main className='container-fluid bg-secondary text-center'>404: Return to sender. Address unknown.</main>;
}

export default App;