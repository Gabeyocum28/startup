import React from 'react';
import './app.css';

export function Profile() {
    return (
        <div>
            <main>
                <h1>Profile</h1>
                <p className="dev">Data here will be in DB</p>
                <h1>Hey John</h1>
                <img src="/public/images/blank_pfp.jpg" alt="Profile Photo" style={{width: '200px', height: '200px'}} />
                <ul>
                    <li><strong>Username:</strong> johndoe</li>
                    <li><strong>Email:</strong> johndoe@example.com</li>
                    <li><strong>Full Name:</strong> John Doe</li>
                    <li><strong>Date of Birth:</strong> 2000-01-01</li>
                    <li><strong>Phone:</strong> (555) 123-4567</li>
                    <li><strong>Favorite Genres:</strong> Rock, Jazz, Classical</li>
                </ul>
                <button>Edit Profile</button>
                <button>Logout</button>
            </main>
        </div>
    );
}