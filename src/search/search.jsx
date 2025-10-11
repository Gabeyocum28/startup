import React from 'react';
import './app.css';

export function Search() {
    return (
        <div>
            <main>
                <p className="dev">Search will be helped by spotify api</p>
                <h1>Search</h1>
                <label htmlFor="album-search">Search Album:</label>
                <input id="album-search" name="album-search" className="standard" placeholder="Enter album name" />
                <div>
                    <button type="button">Back</button>
                    <button type="button">Search</button>
                </div>
            </main>
        </div>
    );
}

