// Mock WebSocket service that simulates real-time review notifications
// This will be replaced with actual WebSocket connection later

class MockWebSocket {
    constructor() {
        this.listeners = [];
        this.interval = null;
    }

    // Sample data for generating random notifications
    sampleUsernames = ['MusicLover123', 'IndieFan456', 'RockHead99', 'JazzCat42', 'PopQueen88', 'HipHopHead'];
    sampleAlbums = [
        { id: '5zi7WsKlIiUXv09tbGLKsE', name: 'IGOR', artist: 'Tyler, The Creator', cover: 'https://via.placeholder.com/640/FF69B4/FFFFFF?text=IGOR' },
        { id: '4m2880jivSbbyEGAKfITCa', name: 'Random Access Memories', artist: 'Daft Punk', cover: 'https://via.placeholder.com/640/87CEEB/FFFFFF?text=RAM' },
        { id: '7dxKtc08dYeRVHt3p9CZJn', name: 'In Rainbows', artist: 'Radiohead', cover: 'https://upload.wikimedia.org/wikipedia/en/1/14/Inrainbowscover.png' },
        { id: '4LH4d3cOWNNsVw41Gqt2kv', name: 'The Dark Side of the Moon', artist: 'Pink Floyd', cover: 'https://via.placeholder.com/640/000000/FFFFFF?text=DSOTM' },
        { id: '3mH6qwIy9crq0I9YQbOuDf', name: 'Blonde', artist: 'Frank Ocean', cover: 'https://via.placeholder.com/640/FFD700/FFFFFF?text=Blonde' },
        { id: '7ycBtnsMtyVbbwTfJwRjSP', name: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', cover: 'https://via.placeholder.com/640/32CD32/FFFFFF?text=TPAB' }
    ];
    sampleRatings = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5];
    sampleReviews = [
        'This album is incredible!',
        'A masterpiece of modern music.',
        'Not bad, but not my favorite.',
        'Pretty good overall.',
        'Absolutely loved it!',
        'Could be better.',
        'Amazing production quality.',
        'It\'s okay, nothing special.',
        'One of the best albums ever!',
        'Didn\'t really click with me.'
    ];

    // Generate random notification and add to localStorage
    generateNotification() {
        const userName = this.sampleUsernames[Math.floor(Math.random() * this.sampleUsernames.length)];
        const album = this.sampleAlbums[Math.floor(Math.random() * this.sampleAlbums.length)];
        const rating = this.sampleRatings[Math.floor(Math.random() * this.sampleRatings.length)];
        const reviewText = this.sampleReviews[Math.floor(Math.random() * this.sampleReviews.length)];

        // Create a full review object to add to localStorage
        const review = {
            id: Date.now().toString(),
            albumId: album.id,
            albumName: album.name,
            artistName: album.artist,
            albumCover: album.cover,
            rating: rating,
            reviewText: reviewText,
            reviewerName: userName,
            createdAt: new Date().toISOString(),
            likes: Math.floor(Math.random() * 50) // Random likes 0-49
        };

        // Add to localStorage
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        reviews.unshift(review); // Add to beginning
        localStorage.setItem('reviews', JSON.stringify(reviews));

        // Return notification for live feed display
        return {
            id: review.id,
            userName: userName,
            albumName: album.name,
            rating: rating,
            timestamp: review.createdAt
        };
    }

    // Start sending notifications
    start() {
        // Send a notification every 3-5 seconds
        const sendNotification = () => {
            const notification = this.generateNotification();
            this.listeners.forEach(callback => callback(notification));

            // Schedule next notification with random delay
            const delay = 3000 + Math.random() * 2000; // 3-5 seconds
            this.interval = setTimeout(sendNotification, delay);
        };

        sendNotification();
    }

    // Stop sending notifications
    stop() {
        if (this.interval) {
            clearTimeout(this.interval);
            this.interval = null;
        }
    }

    // Add listener for notifications
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }
}

// Export singleton instance
export const mockWebSocket = new MockWebSocket();
