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

// Request logging middleware - only log API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${req.method} ${req.path}`);
  }
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
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  const user = await DB.getUserByToken(token);

  if (!user) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  res.json({
    id: user.id,
    username: user.username,
    favoriteAlbums: user.favoriteAlbums || []
  });
});

// Update user's favorite albums (restricted endpoint)
apiRouter.put('/user/favorites', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  const user = await DB.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  const { favoriteAlbums } = req.body;

  // Validate: must be array, max 3 albums
  if (!Array.isArray(favoriteAlbums) || favoriteAlbums.length > 3) {
    return res.status(400).json({ msg: 'favoriteAlbums must be an array with max 3 albums' });
  }

  // Validate each album has required fields
  for (const album of favoriteAlbums) {
    if (!album.id || !album.name || !album.artist || !album.image) {
      return res.status(400).json({ msg: 'Each album must have id, name, artist, and image' });
    }
  }

  await DB.updateUserFavorites(user.username, favoriteAlbums);

  res.json({ favoriteAlbums });
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

// Get reviews by content type and id
apiRouter.get('/reviews/:contentType/:contentId', async (req, res) => {
  const { contentType, contentId } = req.params;
  const reviews = await DB.getReviewsByContent(contentId, contentType);
  res.json(reviews);
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

  const { albumId, albumName, artistName, albumCover, contentId, contentType, contentName, contentCover, rating, reviewText, reviewerName } = req.body;

  const name = contentName || albumName;
  const id = contentId || albumId;

  if (!id || !name || !rating || !reviewText || !reviewerName) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  const review = {
    id: uuid(),
    albumId: albumId || contentId,
    albumName: albumName || contentName,
    artistName,
    albumCover: albumCover || contentCover,
    contentId: id,
    contentType: contentType || 'album',
    contentName: name,
    contentCover: contentCover || albumCover,
    rating,
    reviewText,
    reviewerName,
    createdAt: new Date().toISOString(),
    likes: 0
  };

  await DB.addReview(review);

  // Broadcast notification to all connected WebSocket clients EXCEPT the sender
  const notification = {
    type: 'newReview',
    userName: reviewerName,
    albumName: name,
    rating: rating
  };

  wss.clients.forEach((client) => {
    // Only send to clients that are connected and NOT the user who posted
    if (client.readyState === 1 && client.userToken !== token) {
      client.send(JSON.stringify(notification));
    }
  });

  res.status(201).json(review);
});

// Get public user profile by username (no auth required)
apiRouter.get('/user/:username', async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ msg: 'Username is required' });
  }

  const user = await DB.getUser(username);

  if (!user) {
    return res.status(404).json({ msg: 'User not found' });
  }

  // Return only public information
  res.json({
    username: user.username,
    favoriteAlbums: user.favoriteAlbums || []
  });
});

// ===================================
// Quick Rating Endpoints
// ===================================

// Set/update a quick rating for any content type
apiRouter.post('/ratings', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ msg: 'Unauthorized' });

  const user = await DB.getUserByToken(token);
  if (!user) return res.status(401).json({ msg: 'Unauthorized' });

  const { contentId, rating, contentType } = req.body;
  // Support legacy albumId field
  const id = contentId || req.body.albumId;
  const type = contentType || 'album';

  if (!id || !rating || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
    return res.status(400).json({ msg: 'contentId and rating (0.5-5, half steps) are required' });
  }

  await DB.setRating(user.username, id, rating, type);
  res.json({ contentId: id, contentType: type, rating });
});

// Get current user's rating for content
apiRouter.get('/ratings/:contentType/:contentId', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ rating: null });

  const user = await DB.getUserByToken(token);
  if (!user) return res.json({ rating: null });

  const result = await DB.getRating(user.username, req.params.contentId, req.params.contentType);
  res.json({ rating: result ? result.rating : null });
});

// Get average rating for content
apiRouter.get('/ratings/:contentType/:contentId/average', async (req, res) => {
  const ratings = await DB.getRatingsByContent(req.params.contentId, req.params.contentType);
  if (ratings.length === 0) return res.json({ average: null, count: 0 });

  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  res.json({ average: Math.round(avg * 10) / 10, count: ratings.length });
});

// ===================================
// Deezer API Endpoints (no auth required)
// ===================================

// Combined search — albums, tracks, and artists in parallel
apiRouter.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ msg: 'Search query is required' });
  }

  try {
    const encoded = encodeURIComponent(q);
    const [albumRes, trackRes, artistRes] = await Promise.all([
      fetch(`https://api.deezer.com/search/album?q=${encoded}&limit=5`),
      fetch(`https://api.deezer.com/search/track?q=${encoded}&limit=5`),
      fetch(`https://api.deezer.com/search/artist?q=${encoded}&limit=5`)
    ]);

    const [albumData, trackData, artistData] = await Promise.all([
      albumRes.json(), trackRes.json(), artistRes.json()
    ]);

    const albums = (albumData.data || []).map(album => ({
      id: album.id,
      name: album.title,
      artists: [{ name: album.artist.name, id: album.artist.id }],
      images: [
        { url: album.cover_big },
        { url: album.cover_medium },
        { url: album.cover_small }
      ],
      total_tracks: album.nb_tracks || 0
    }));

    const tracks = (trackData.data || []).map(track => ({
      id: track.id,
      name: track.title,
      artist: track.artist.name,
      artistId: track.artist.id,
      albumName: track.album.title,
      albumId: track.album.id,
      image: track.album.cover_big || track.album.cover_medium,
      duration_ms: track.duration * 1000,
      preview: track.preview,
      explicit: track.explicit_lyrics
    }));

    const artists = (artistData.data || []).map(artist => ({
      id: artist.id,
      name: artist.name,
      image: artist.picture_big || artist.picture_medium,
      fans: artist.nb_fan || 0
    }));

    res.json({ albums, tracks, artists });
  } catch (error) {
    console.error('Deezer search error:', error);
    res.status(500).json({ msg: 'Failed to search', error: error.message });
  }
});

// Keep legacy album search for profile favorites
apiRouter.get('/spotify/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ msg: 'Search query is required' });

  try {
    const response = await fetch(`https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=20`);
    if (!response.ok) throw new Error(`Deezer API failed with status ${response.status}`);
    const data = await response.json();
    const items = (data.data || []).map(album => ({
      id: album.id,
      name: album.title,
      artists: [{ name: album.artist.name }],
      images: [
        { url: album.cover_big },
        { url: album.cover_medium },
        { url: album.cover_small }
      ],
      total_tracks: album.nb_tracks || 0
    }));
    res.json({ items });
  } catch (error) {
    res.status(500).json({ msg: 'Failed to search albums', error: error.message });
  }
});

// Get album details
apiRouter.get('/spotify/album/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(`https://api.deezer.com/album/${id}`);
    if (!response.ok) throw new Error(`Deezer API failed with status ${response.status}`);
    const data = await response.json();

    const album = {
      id: data.id,
      name: data.title,
      artists: (data.contributors || [{ name: data.artist.name, id: data.artist.id }]).map(a => ({ name: a.name, id: a.id })),
      images: [
        { url: data.cover_xl || data.cover_big },
        { url: data.cover_big },
        { url: data.cover_medium }
      ],
      release_date: data.release_date || '',
      label: data.label || 'N/A',
      total_tracks: data.nb_tracks || 0,
      genres: data.genres?.data?.map(g => g.name) || [],
      tracks: {
        items: (data.tracks?.data || []).map(track => ({
          id: track.id,
          track_number: track.track_position,
          name: track.title,
          duration_ms: track.duration * 1000,
          explicit: track.explicit_lyrics,
          preview: track.preview
        }))
      }
    };

    res.json(album);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch album', error: error.message });
  }
});

// Get track details
apiRouter.get('/track/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(`https://api.deezer.com/track/${id}`);
    if (!response.ok) throw new Error(`Deezer API failed with status ${response.status}`);
    const data = await response.json();

    const track = {
      id: data.id,
      name: data.title,
      artist: data.artist.name,
      artistId: data.artist.id,
      albumName: data.album.title,
      albumId: data.album.id,
      image: data.album.cover_xl || data.album.cover_big,
      duration_ms: data.duration * 1000,
      preview: data.preview,
      explicit: data.explicit_lyrics,
      trackNumber: data.track_position,
      releaseDate: data.release_date || ''
    };

    res.json(track);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch track', error: error.message });
  }
});

// Get artist details + top tracks + albums
apiRouter.get('/artist/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [artistRes, topRes, albumsRes] = await Promise.all([
      fetch(`https://api.deezer.com/artist/${id}`),
      fetch(`https://api.deezer.com/artist/${id}/top?limit=10`),
      fetch(`https://api.deezer.com/artist/${id}/albums?limit=20`)
    ]);

    const [artistData, topData, albumsData] = await Promise.all([
      artistRes.json(), topRes.json(), albumsRes.json()
    ]);

    const artist = {
      id: artistData.id,
      name: artistData.name,
      image: artistData.picture_xl || artistData.picture_big,
      fans: artistData.nb_fan || 0,
      topTracks: (topData.data || []).map(track => ({
        id: track.id,
        name: track.title,
        albumName: track.album.title,
        albumId: track.album.id,
        image: track.album.cover_medium,
        duration_ms: track.duration * 1000,
        preview: track.preview,
        explicit: track.explicit_lyrics
      })),
      albums: (albumsData.data || []).map(album => ({
        id: album.id,
        name: album.title,
        image: album.cover_big || album.cover_medium,
        releaseDate: album.release_date || '',
        type: album.record_type
      }))
    };

    res.json(artist);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch artist', error: error.message });
  }
});

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

// Handle WebSocket upgrade requests on /ws path
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  console.log('New WebSocket connection established');

  // Mark connection as alive
  ws.isAlive = true;

  // Extract token from cookies to identify the user
  let userToken = null;
  if (request.headers.cookie) {
    const cookies = request.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    userToken = cookies.token || null;
  }
  ws.userToken = userToken;

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
