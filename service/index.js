const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const http = require('http');
const { WebSocketServer } = require('ws');
const DB = require('./database.js');

const app = express();

// The service port. In production this is set by the hosting provider.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve up the frontend static content hosting
app.use(express.static('public'));

// Trust headers that are forwarded from the proxy so we can determine IP addresses
app.set('trust proxy', true);

// NOTE: Removed in-memory storage - now using MongoDB via database.js

// Router for service endpoints
const apiRouter = express.Router();
app.use('/api', apiRouter);

// ===================================
// Authentication Endpoints
// ===================================

// Register a new user
apiRouter.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: 'Username and password are required' });
  }

  // Check if user already exists
  const existingUser = await DB.getUser(username);
  if (existingUser) {
    return res.status(409).json({ msg: 'User already exists' });
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create auth token
  const token = uuid();

  // Create new user
  const user = {
    id: uuid(),
    username,
    password: passwordHash,
    token: token,
    createdAt: new Date().toISOString()
  };

  await DB.addUser(user);

  // Set cookie - httpOnly false in dev for Vite proxy compatibility
  res.cookie('token', token, {
    secure: false,
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });

  console.log(`Created user: ${username}, token: ${token}`);
  console.log(`Set-Cookie header:`, res.getHeader('Set-Cookie'));

  res.status(201).json({
    id: user.id,
    username: user.username,
    token: token
  });
});

// Login existing user
apiRouter.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: 'Username and password are required' });
  }

  const user = await DB.getUser(username);

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

  // Update user with new token
  user.token = token;
  await DB.updateUser(user);

  // Set cookie - httpOnly false in dev for Vite proxy compatibility
  res.cookie('token', token, {
    secure: false,
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });

  console.log(`User logged in: ${username}, token: ${token}`);
  console.log(`Set-Cookie header:`, res.getHeader('Set-Cookie'));

  res.json({
    id: user.id,
    username: user.username,
    token: token
  });
});

// Logout user
apiRouter.delete('/auth/logout', async (req, res) => {
  const token = req.cookies.token;
  if (token) {
    // Remove token from user in database
    const user = await DB.getUserByToken(token);
    if (user) {
      user.token = null;
      await DB.updateUser(user);
    }
  }
  res.clearCookie('token');
  res.status(204).end();
});

// Get current user (restricted endpoint)
apiRouter.get('/user', async (req, res) => {
  // Try to get token from cookie or Authorization header
  let token = req.cookies.token;
  console.log(`Authorization header: ${req.headers.authorization}`);
  console.log(`Cookie token: ${req.cookies.token}`);
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  const user = await DB.getUserByToken(token);
  console.log(`GET /api/user - token: ${token}, user found: ${!!user}`);

  if (!user) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  res.json({
    id: user.id,
    username: user.username
  });
});

// ===================================
// Review Endpoints
// ===================================

// Get all reviews
apiRouter.get('/reviews', async (req, res) => {
  const reviews = await DB.getAllReviews();
  res.json(reviews);
});

// Get reviews by user
apiRouter.get('/reviews/user/:username', async (req, res) => {
  const { username } = req.params;
  const userReviews = await DB.getReviewsByUser(username);
  res.json(userReviews);
});

// Get reviews by album
apiRouter.get('/reviews/album/:albumId', async (req, res) => {
  const { albumId } = req.params;
  const albumReviews = await DB.getReviewsByAlbum(albumId);
  res.json(albumReviews);
});

// Create new review (restricted - requires authentication)
apiRouter.post('/reviews', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ msg: 'Unauthorized - Please login to post a review' });
  }

  const user = await DB.getUserByToken(token);
  if (!user) {
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

  await DB.addReview(review);

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
  res.sendFile('index.html', { root: 'public' });
});

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  // Mark connection as alive
  ws.isAlive = true;

  // Handle pong responses (for keepalive)
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle disconnections
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Ping clients every 30 seconds to detect dead connections
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.isAlive === false) {
      console.log('Terminating dead connection');
      return client.terminate();
    }
    client.isAlive = false;
    client.ping();
  });
}, 30000);

// Start the server
server.listen(port, () => {
  console.log(`Polyrhythmd service listening on port ${port}`);
});
