import React from 'react';
import '../app.css';
import './feed.css';

export function Feed() {
    return (
        <div>
            <main>
                <h1>Feed</h1>
                <div className="feed-container">
                    <main className="feed-main">
                        <div className="review-card">
                            <div className="album-info">
                                <img src="/images/igor.jpg" alt="IGOR Album Cover" className="album-cover" />
                                <div className="album-details">
                                    <h3 className="album-title">IGOR</h3>
                                    <p className="album-artist">Tyler, the Creator</p>
                                    <p className="review-rating">★★★★☆</p>
                                </div>
                            </div>
                            
                            <div className="review-content">
                                <h4 className="review-title">Great Album!</h4>
                                <p className="review-text">This album is a masterpiece. The production quality and lyrical depth are outstanding.</p>
                            </div>
                            
                            <p className="review-author">@MusicLover123</p>
                            
                            <div className="review-actions">
                                <button className="action-btn like-btn">
                                    <span className="icon">♥</span>
                                    <span className="count">24</span>
                                </button>
                                <button className="action-btn comment-btn">
                                    <span className="icon">💬</span>
                                    <span className="count">5</span>
                                </button>
                            </div>
                        </div>

                        
                        <div className="review-card">
                            <div className="album-info">
                                <img src="https://via.placeholder.com/80x80?text=Album" alt="Album Cover" className="album-cover" />
                                <div className="album-details">
                                    <h3 className="album-title">Random Access Memories</h3>
                                    <p className="album-artist">Daft Punk</p>
                                    <p className="review-rating">★★☆☆☆</p>
                                </div>
                            </div>
                            
                        
                            <div className="review-content">
                                <h4 className="review-title">Not my style</h4>
                                <p className="review-text">I found the album to be a bit too experimental for my taste, but I can see why others enjoy it.</p>
                            </div>
                            
                            
                            <p className="review-author">@IndieFan456</p>
                            
                            
                            <div className="review-actions">
                                <button className="action-btn like-btn">
                                    <span className="icon">♥</span>
                                    <span className="count">12</span>
                                </button>
                                <button className="action-btn comment-btn">
                                    <span className="icon">💬</span>
                                    <span className="count">3</span>
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </main>
        </div>
    );
}

