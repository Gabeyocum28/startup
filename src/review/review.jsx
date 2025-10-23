import React from 'react';
import '../app.css';

export function Review() {

    return (
        <div>
            <main>
                <h1>Review</h1>
                
                <div className="row g-4">
                    <div className="col-lg-8 mx-auto">
                        <div className="mb-4">
                            <label htmlFor="album-search">Search Album:</label>
                            <input id="album-search" name="album-search" className="standard" placeholder="Enter album name" />
                        </div>

                        <div className="text-center mb-4">
                            <h2>Album Cover</h2>
                            <img src="https://via.placeholder.com/200x200?text=Album+Cover" alt="Album Cover" style={{width: '200px', height: '200px'}} className="rounded" />
                        </div>
                        <div className="mb-4">
                            <h2>Rating</h2>
                            <div className="rating-group">
                                <label>
                                    <input type="radio" name="rating" value="0.5" /> 0.5
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="1" /> 1 
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="1.5" /> 1.5 
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="2" /> 2 
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="2.5" /> 2.5 
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="3" /> 3 
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="3.5" /> 3.5 
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="4" /> 4 
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="4.5" /> 4.5 
                                </label>
                                <label>
                                    <input type="radio" name="rating" value="5" /> 5 
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h2>Your Review</h2>
                            <textarea name="review" rows="5" placeholder="Write your review here..."></textarea>
                        </div>

                        <div className="text-center">
                            <button type="submit">Submit Review</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}