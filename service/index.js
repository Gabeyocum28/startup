const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const app = express();

// The service port. In production this is set by the hosting provider.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the frontend static content hosting
app.use(express.static('dist'));

// Trust headers that are forwarded from the proxy so we can determine IP addresses
app.set('trust proxy', true);

// In-memory data stores
const users = [];
const reviews = [];
const authTokens = {};

// Router for service endpoints
const apiRouter = express.Router();
app.use('/api', apiRouter);

// ===================================
// Authentication Endpoints
// ===================================

// Register a new user
apiRouter.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ msg: 'User already exists' });
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create new user
  const user = {
    id: uuid(),
    email,
    password: passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);

  // Create auth token
  const token = uuid();
  authTokens[token] = user.email;

  // Set cookie
  res.cookie('token', token, {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  });

  res.status(201).json({
    id: user.id,
    email: user.email
  });
});

// Login existing user
apiRouter.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  // Check password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  // Create auth token
  const token = uuid();
  authTokens[token] = user.email;

  // Set cookie
  res.cookie('token', token, {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  });

  res.json({
    id: user.id,
    email: user.email
  });
});

// Logout user
apiRouter.delete('/auth/logout', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    delete authTokens[token];
  }
  res.clearCookie('token');
  res.status(204).end();
});

// Get current user (restricted endpoint)
apiRouter.get('/user', (req, res) => {
  const token = req.cookies.token;
  const email = authTokens[token];

  if (!email) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  res.json({
    id: user.id,
    email: user.email
  });
});

// ===================================
// Review Endpoints
// ===================================

// Get all reviews
apiRouter.get('/reviews', (req, res) => {
  // Sort by newest first
  const sortedReviews = [...reviews].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sortedReviews);
});

// Get reviews by user
apiRouter.get('/reviews/user/:username', (req, res) => {
  const { username } = req.params;
  const userReviews = reviews.filter(r => r.reviewerName === username);
  const sortedReviews = userReviews.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sortedReviews);
});

// Get reviews by album
apiRouter.get('/reviews/album/:albumId', (req, res) => {
  const { albumId } = req.params;
  const albumReviews = reviews.filter(r => r.albumId === albumId);
  const sortedReviews = albumReviews.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sortedReviews);
});

// Create new review (restricted - requires authentication)
apiRouter.post('/reviews', (req, res) => {
  const token = req.cookies.token;
  const email = authTokens[token];

  if (!email) {
    return res.status(401).json({ msg: 'Unauthorized - Please login to post a review' });
  }

  const { albumId, albumName, artistName, albumCover, rating, reviewText, reviewerName } = req.body;

  if (!albumId || !albumName || !rating || !reviewText || !reviewerName) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  const review = {
    id: uuid(),
    albumId,
    albumName,
    artistName,
    albumCover,
    rating,
    reviewText,
    reviewerName,
    createdAt: new Date().toISOString(),
    likes: 0
  };

  reviews.push(review);

  res.status(201).json(review);
});

// ===================================
// Spotify API Endpoints
// ===================================

// Search albums on Spotify
apiRouter.get('/spotify/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ msg: 'Search query is required' });
  }

  try {
    // Get Spotify access token
    const token = await getSpotifyToken();

    // Search for albums
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=20`;
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Spotify API request failed');
    }

    const data = await response.json();
    res.json(data.albums);
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({ msg: 'Failed to search Spotify', error: error.message });
  }
});

// Get album details from Spotify
apiRouter.get('/spotify/album/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get Spotify access token
    const token = await getSpotifyToken();

    // Get album details
    const albumUrl = `https://api.spotify.com/v1/albums/${id}`;
    const response = await fetch(albumUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Spotify API request failed');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Spotify album error:', error);
    res.status(500).json({ msg: 'Failed to fetch album from Spotify', error: error.message });
  }
});

// ===================================
// Spotify Authentication Helper
// ===================================

let spotifyAccessToken = null;
let spotifyTokenExpiry = null;

async function getSpotifyToken() {
  // Check if we have a valid token
  if (spotifyAccessToken && spotifyTokenExpiry && Date.now() < spotifyTokenExpiry) {
    return spotifyAccessToken;
  }

  // Get new token using Client Credentials flow
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token');
  }

  const data = await response.json();
  spotifyAccessToken = data.access_token;
  spotifyTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

  return spotifyAccessToken;
}

// ===================================
// Default error handler
// ===================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Something went wrong!', error: err.message });
});

// Return the application's default page if the path is unknown
app.use((_req, res) => {
  res.sendFile('index.html', { root: 'dist' });
});

// Start the server
app.listen(port, () => {
  console.log(`Polyrhythmd service listening on port ${port}`);
});
