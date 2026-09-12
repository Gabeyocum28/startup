const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const { v4: uuid } = require('uuid');
const { WebSocketServer } = require('ws');
const DB = require('./database.js');

const isProd = process.env.NODE_ENV === 'production';

const LIMITS = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  passwordMin: 8,
  passwordMax: 128,
  reviewText: 5000,
  commentText: 1000,
  feedPage: 20,
  feedPageMax: 50,
  favorites: 3,
  listSize: 500,
};

const CONTENT_TYPES = new Set(['album', 'track', 'artist']);
const LIST_NAMES = new Set(['listened', 'wantToListen']);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test' && req.path.startsWith('/api')) console.log(`${req.method} ${req.path}`);
  next();
});

// Set once, used everywhere a cookie is issued.
const COOKIE_OPTS = {
  secure: isProd,
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

// ===================================
// Helpers
// ===================================

function tokenFrom(req) {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

async function loadUser(req) {
  const token = tokenFrom(req);
  if (!token) return null;
  return DB.getUserByToken(token);
}

// Attaches req.user or rejects with 401.
async function requireAuth(req, res, next) {
  try {
    const user = await loadUser(req);
    if (!user) return res.status(401).json({ msg: 'Unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Attaches req.user if present, never rejects.
async function optionalAuth(req, _res, next) {
  try {
    req.user = await loadUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

function isValidRating(r) {
  return typeof r === 'number' && r >= 0.5 && r <= 5 && (r * 2) % 1 === 0;
}

function publicUser(user, extra = {}) {
  return {
    username: user.username,
    favoriteAlbums: user.favoriteAlbums || [],
    following: user.following || [],
    lists: {
      listened: user.lists?.listened || [],
      wantToListen: user.lists?.wantToListen || [],
    },
    createdAt: user.createdAt,
    ...extra,
  };
}

// Adds per-viewer fields to a review before sending.
function presentReview(review, viewer) {
  const { _id, likedBy = [], comments = [], ...rest } = review;
  return {
    ...rest,
    likes: review.likes || 0,
    likedByMe: viewer ? likedBy.includes(viewer.username) : false,
    commentCount: comments.length,
    comments,
    canEdit: viewer ? viewer.username === review.reviewerName : false,
  };
}

function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ===================================
// Router
// ===================================

const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.get('/health', wrap(async (_req, res) => {
  try {
    await DB.ping();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
}));

// ===================================
// Authentication
// ===================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { msg: 'Too many attempts. Try again in a few minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

function validateCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return 'Username and password are required';
  if (!LIMITS.username.test(username)) return 'Username must be 3-20 characters: letters, numbers, or underscore';
  if (password.length < LIMITS.passwordMin) return `Password must be at least ${LIMITS.passwordMin} characters`;
  if (password.length > LIMITS.passwordMax) return 'Password is too long';
  return null;
}

apiRouter.post('/auth/register', authLimiter, wrap(async (req, res) => {
  const { username, password } = req.body || {};
  const problem = validateCredentials(username, password);
  if (problem) return res.status(400).json({ msg: problem });

  if (await DB.getUser(username)) return res.status(409).json({ msg: 'User already exists' });

  const token = uuid();
  const user = {
    id: uuid(),
    username,
    password: await bcrypt.hash(password, 10),
    token,
    favoriteAlbums: [],
    following: [],
    lists: { listened: [], wantToListen: [] },
    createdAt: new Date().toISOString(),
  };
  await DB.addUser(user);

  res.cookie('token', token, COOKIE_OPTS);
  res.status(201).json({ id: user.id, username: user.username });
}));

apiRouter.post('/auth/login', authLimiter, wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ msg: 'Username and password are required' });
  }

  const user = await DB.getUser(username);
  const ok = user && await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });

  user.token = uuid();
  await DB.updateUser(user);

  res.cookie('token', user.token, COOKIE_OPTS);
  res.json({ id: user.id, username: user.username });
}));

apiRouter.delete('/auth/logout', wrap(async (req, res) => {
  const user = await loadUser(req);
  if (user) {
    user.token = null;
    await DB.updateUser(user);
  }
  res.clearCookie('token', { path: '/' });
  res.status(204).end();
}));

// ===================================
// Current user
// ===================================

apiRouter.get('/user', requireAuth, wrap(async (req, res) => {
  const followers = await DB.getFollowers(req.user.username);
  res.json(publicUser(req.user, { id: req.user.id, followers: followers.map(f => f.username) }));
}));

apiRouter.put('/user/favorites', requireAuth, wrap(async (req, res) => {
  const { favoriteAlbums } = req.body || {};
  if (!Array.isArray(favoriteAlbums) || favoriteAlbums.length > LIMITS.favorites) {
    return res.status(400).json({ msg: `favoriteAlbums must be an array with max ${LIMITS.favorites} albums` });
  }
  for (const album of favoriteAlbums) {
    if (!album?.id || !album.name || !album.artist || !album.image) {
      return res.status(400).json({ msg: 'Each album must have id, name, artist, and image' });
    }
  }
  await DB.updateUserFavorites(req.user.username, favoriteAlbums);
  res.json({ favoriteAlbums });
}));

apiRouter.put('/user/password', requireAuth, wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ msg: 'currentPassword and newPassword are required' });
  }
  // Only the password is validated here: older accounts may have usernames
  // that predate the current username rule.
  if (newPassword.length < LIMITS.passwordMin) return res.status(400).json({ msg: `Password must be at least ${LIMITS.passwordMin} characters` });
  if (newPassword.length > LIMITS.passwordMax) return res.status(400).json({ msg: 'Password is too long' });
  if (!await bcrypt.compare(currentPassword, req.user.password)) {
    return res.status(401).json({ msg: 'Current password is incorrect' });
  }
  await DB.setUserPassword(req.user.username, await bcrypt.hash(newPassword, 10));
  res.clearCookie('token', { path: '/' });
  res.status(204).end();
}));

apiRouter.delete('/user', requireAuth, wrap(async (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || !await bcrypt.compare(password, req.user.password)) {
    return res.status(401).json({ msg: 'Password is incorrect' });
  }
  await DB.deleteUser(req.user.username);
  res.clearCookie('token', { path: '/' });
  res.status(204).end();
}));

// ---- Lists ----

apiRouter.put('/user/lists/:list', requireAuth, wrap(async (req, res) => {
  const { list } = req.params;
  if (!LIST_NAMES.has(list)) return res.status(400).json({ msg: 'Unknown list' });
  const { action, item } = req.body || {};
  if (!item?.id || !CONTENT_TYPES.has(item.type)) {
    return res.status(400).json({ msg: 'item must have id and a valid type' });
  }
  const id = Number(item.id);
  if (action === 'add') {
    const current = req.user.lists?.[list] || [];
    if (current.length >= LIMITS.listSize) return res.status(400).json({ msg: 'List is full' });
    await DB.addToList(req.user.username, list, {
      id,
      type: item.type,
      name: String(item.name || '').slice(0, 200),
      artist: String(item.artist || '').slice(0, 200),
      image: String(item.image || '').slice(0, 500),
      addedAt: new Date().toISOString(),
    });
  } else if (action === 'remove') {
    await DB.removeFromList(req.user.username, list, id, item.type);
  } else {
    return res.status(400).json({ msg: 'action must be add or remove' });
  }
  const fresh = await DB.getUser(req.user.username);
  res.json({ [list]: fresh.lists?.[list] || [] });
}));

// ===================================
// Public user profiles and following
// ===================================

apiRouter.get('/user/:username', optionalAuth, wrap(async (req, res) => {
  const user = await DB.getUser(req.params.username);
  if (!user) return res.status(404).json({ msg: 'User not found' });
  const followers = await DB.getFollowers(user.username);
  res.json(publicUser(user, {
    followers: followers.map(f => f.username),
    followedByMe: req.user ? (req.user.following || []).includes(user.username) : false,
  }));
}));

apiRouter.get('/user/:username/ratings', wrap(async (req, res) => {
  const user = await DB.getUser(req.params.username);
  if (!user) return res.status(404).json({ msg: 'User not found' });
  const ratings = await DB.getRatingsByUser(user.username);
  res.json(ratings.map(({ _id, ...r }) => r));
}));

apiRouter.post('/users/:username/follow', requireAuth, wrap(async (req, res) => {
  const target = req.params.username;
  if (target === req.user.username) return res.status(400).json({ msg: 'You cannot follow yourself' });
  if (!await DB.getUser(target)) return res.status(404).json({ msg: 'User not found' });
  await DB.follow(req.user.username, target);
  res.json({ following: true });
}));

apiRouter.delete('/users/:username/follow', requireAuth, wrap(async (req, res) => {
  await DB.unfollow(req.user.username, req.params.username);
  res.json({ following: false });
}));

// ===================================
// Reviews
// ===================================

// Paginated feed. ?limit=20&before=<createdAt ISO>&scope=all|following
apiRouter.get('/reviews', optionalAuth, wrap(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || LIMITS.feedPage, 1), LIMITS.feedPageMax);
  const before = typeof req.query.before === 'string' && req.query.before ? req.query.before : null;
  let authors = null;
  if (req.query.scope === 'following') {
    if (!req.user) return res.status(401).json({ msg: 'Login to see your following feed' });
    authors = req.user.following || [];
  }
  const rows = await DB.getReviews({ limit: limit + 1, before, authors });
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).map(r => presentReview(r, req.user));
  res.json({ reviews: page, nextBefore: hasMore ? page[page.length - 1].createdAt : null });
}));

apiRouter.get('/reviews/user/:username', optionalAuth, wrap(async (req, res) => {
  const rows = await DB.getReviewsByUser(req.params.username);
  res.json(rows.map(r => presentReview(r, req.user)));
}));

apiRouter.get('/reviews/album/:albumId', optionalAuth, wrap(async (req, res) => {
  const rows = await DB.getReviewsByAlbum(req.params.albumId);
  res.json(rows.map(r => presentReview(r, req.user)));
}));

apiRouter.get('/reviews/:contentType/:contentId', optionalAuth, wrap(async (req, res) => {
  const { contentType, contentId } = req.params;
  if (!CONTENT_TYPES.has(contentType)) return res.status(400).json({ msg: 'Unknown content type' });
  const rows = await DB.getReviewsByContent(contentId, contentType);
  res.json(rows.map(r => presentReview(r, req.user)));
}));

apiRouter.get('/reviews/:id', optionalAuth, wrap(async (req, res) => {
  const review = await DB.getReview(req.params.id);
  if (!review) return res.status(404).json({ msg: 'Review not found' });
  res.json(presentReview(review, req.user));
}));

function validateReviewBody(body) {
  if (!isValidRating(body.rating)) return 'rating must be 0.5-5 in half steps';
  if (typeof body.reviewText !== 'string' || !body.reviewText.trim()) return 'reviewText is required';
  if (body.reviewText.length > LIMITS.reviewText) return `reviewText must be under ${LIMITS.reviewText} characters`;
  return null;
}

apiRouter.post('/reviews', requireAuth, wrap(async (req, res) => {
  const body = req.body || {};
  const contentId = body.contentId ?? body.albumId;
  const contentType = body.contentType || 'album';
  const contentName = body.contentName || body.albumName;
  const contentCover = body.contentCover || body.albumCover;

  if (!contentId || !contentName) return res.status(400).json({ msg: 'Missing required fields' });
  if (!CONTENT_TYPES.has(contentType)) return res.status(400).json({ msg: 'Unknown content type' });
  const problem = validateReviewBody(body);
  if (problem) return res.status(400).json({ msg: problem });

  const review = {
    id: uuid(),
    // Legacy album fields kept so older documents and readers keep working.
    albumId: contentId,
    albumName: contentName,
    artistName: String(body.artistName || '').slice(0, 200),
    albumCover: contentCover,
    contentId,
    contentType,
    contentName: String(contentName).slice(0, 200),
    contentCover,
    rating: body.rating,
    reviewText: body.reviewText.trim(),
    reviewerName: req.user.username, // always the authenticated user
    createdAt: new Date().toISOString(),
    updatedAt: null,
    likes: 0,
    likedBy: [],
    comments: [],
  };
  await DB.addReview(review);

  broadcast({ type: 'newReview', userName: req.user.username, albumName: review.contentName, rating: review.rating }, req.user.token);

  res.status(201).json(presentReview(review, req.user));
}));

apiRouter.put('/reviews/:id', requireAuth, wrap(async (req, res) => {
  const review = await DB.getReview(req.params.id);
  if (!review) return res.status(404).json({ msg: 'Review not found' });
  if (review.reviewerName !== req.user.username) return res.status(403).json({ msg: 'You can only edit your own reviews' });
  const problem = validateReviewBody(req.body || {});
  if (problem) return res.status(400).json({ msg: problem });

  const fields = { rating: req.body.rating, reviewText: req.body.reviewText.trim(), updatedAt: new Date().toISOString() };
  await DB.updateReview(review.id, fields);
  res.json(presentReview({ ...review, ...fields }, req.user));
}));

apiRouter.delete('/reviews/:id', requireAuth, wrap(async (req, res) => {
  const review = await DB.getReview(req.params.id);
  if (!review) return res.status(404).json({ msg: 'Review not found' });
  if (review.reviewerName !== req.user.username) return res.status(403).json({ msg: 'You can only delete your own reviews' });
  await DB.deleteReview(review.id);
  res.status(204).end();
}));

// ---- Likes ----

apiRouter.post('/reviews/:id/like', requireAuth, wrap(async (req, res) => {
  const review = await DB.toggleLike(req.params.id, req.user.username);
  if (!review) return res.status(404).json({ msg: 'Review not found' });
  res.json({ likes: review.likes, likedByMe: review.likedBy.includes(req.user.username) });
}));

// ---- Comments ----

apiRouter.post('/reviews/:id/comments', requireAuth, wrap(async (req, res) => {
  const review = await DB.getReview(req.params.id);
  if (!review) return res.status(404).json({ msg: 'Review not found' });
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ msg: 'Comment text is required' });
  if (text.length > LIMITS.commentText) return res.status(400).json({ msg: `Comment must be under ${LIMITS.commentText} characters` });

  const comment = { id: uuid(), username: req.user.username, text, createdAt: new Date().toISOString() };
  await DB.addComment(review.id, comment);
  res.status(201).json(comment);
}));

apiRouter.delete('/reviews/:id/comments/:commentId', requireAuth, wrap(async (req, res) => {
  const review = await DB.getReview(req.params.id);
  if (!review) return res.status(404).json({ msg: 'Review not found' });
  const comment = (review.comments || []).find(c => c.id === req.params.commentId);
  if (!comment) return res.status(404).json({ msg: 'Comment not found' });
  // Comment author or review owner may remove a comment.
  if (comment.username !== req.user.username && review.reviewerName !== req.user.username) {
    return res.status(403).json({ msg: 'Not allowed' });
  }
  await DB.deleteComment(review.id, comment.id);
  res.status(204).end();
}));

// ===================================
// Quick ratings
// ===================================

apiRouter.post('/ratings', requireAuth, wrap(async (req, res) => {
  const body = req.body || {};
  const id = body.contentId ?? body.albumId;
  const type = body.contentType || 'album';
  if (!id || !CONTENT_TYPES.has(type) || !isValidRating(body.rating)) {
    return res.status(400).json({ msg: 'contentId, contentType, and rating (0.5-5, half steps) are required' });
  }
  const meta = {};
  if (body.contentName) meta.contentName = String(body.contentName).slice(0, 200);
  if (body.artistName) meta.artistName = String(body.artistName).slice(0, 200);
  if (body.contentCover) meta.contentCover = String(body.contentCover).slice(0, 500);
  await DB.setRating(req.user.username, id, body.rating, type, meta);
  res.json({ contentId: id, contentType: type, rating: body.rating });
}));

// Batch averages: ?keys=album:123,track:456
apiRouter.get('/ratings/batch', wrap(async (req, res) => {
  const raw = typeof req.query.keys === 'string' ? req.query.keys.split(',') : [];
  const keys = raw.slice(0, 100).map(k => {
    const [contentType, contentId] = k.split(':');
    return CONTENT_TYPES.has(contentType) && contentId ? { contentType, contentId } : null;
  }).filter(Boolean);
  res.json(await DB.getRatingAverages(keys));
}));

apiRouter.get('/ratings/:contentType/:contentId', optionalAuth, wrap(async (req, res) => {
  if (!req.user) return res.json({ rating: null });
  const result = await DB.getRating(req.user.username, req.params.contentId, req.params.contentType);
  res.json({ rating: result ? result.rating : null });
}));

apiRouter.get('/ratings/:contentType/:contentId/average', wrap(async (req, res) => {
  const ratings = await DB.getRatingsByContent(req.params.contentId, req.params.contentType);
  if (ratings.length === 0) return res.json({ average: null, count: 0 });
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  res.json({ average: Math.round(avg * 10) / 10, count: ratings.length });
}));

// ===================================
// Music catalog (Deezer, no auth required)
// ===================================

const DEEZER = 'https://api.deezer.com';

async function deezer(path) {
  const response = await fetch(`${DEEZER}${path}`);
  if (!response.ok) throw new Error(`Deezer API failed with status ${response.status}`);
  return response.json();
}

function mapAlbumSummary(album) {
  return {
    id: album.id,
    name: album.title,
    artists: [{ name: album.artist.name, id: album.artist.id }],
    images: [{ url: album.cover_big }, { url: album.cover_medium }, { url: album.cover_small }],
    total_tracks: album.nb_tracks || 0,
  };
}

apiRouter.get('/search', wrap(async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ msg: 'Search query is required' });
  const encoded = encodeURIComponent(q);
  const [albumData, trackData, artistData] = await Promise.all([
    deezer(`/search/album?q=${encoded}&limit=5`),
    deezer(`/search/track?q=${encoded}&limit=5`),
    deezer(`/search/artist?q=${encoded}&limit=5`),
  ]);

  const albums = (albumData.data || []).map(mapAlbumSummary);
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
    explicit: track.explicit_lyrics,
  }));
  const artists = (artistData.data || []).map(artist => ({
    id: artist.id,
    name: artist.name,
    image: artist.picture_big || artist.picture_medium,
    fans: artist.nb_fan || 0,
  }));

  res.json({ albums, tracks, artists });
}));

apiRouter.get('/albums/search', wrap(async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ msg: 'Search query is required' });
  const data = await deezer(`/search/album?q=${encodeURIComponent(q)}&limit=20`);
  res.json({ items: (data.data || []).map(mapAlbumSummary) });
}));

apiRouter.get('/albums/:id', wrap(async (req, res) => {
  const data = await deezer(`/album/${encodeURIComponent(req.params.id)}`);
  res.json({
    id: data.id,
    name: data.title,
    artists: (data.contributors || [{ name: data.artist.name, id: data.artist.id }]).map(a => ({ name: a.name, id: a.id })),
    images: [{ url: data.cover_xl || data.cover_big }, { url: data.cover_big }, { url: data.cover_medium }],
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
        preview: track.preview,
      })),
    },
  });
}));

apiRouter.get('/track/:id', wrap(async (req, res) => {
  const data = await deezer(`/track/${encodeURIComponent(req.params.id)}`);
  res.json({
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
    releaseDate: data.release_date || '',
  });
}));

apiRouter.get('/artist/:id', wrap(async (req, res) => {
  const id = encodeURIComponent(req.params.id);
  const [artistData, topData, albumsData] = await Promise.all([
    deezer(`/artist/${id}`),
    deezer(`/artist/${id}/top?limit=10`),
    deezer(`/artist/${id}/albums?limit=20`),
  ]);
  res.json({
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
      explicit: track.explicit_lyrics,
    })),
    albums: (albumsData.data || []).map(album => ({
      id: album.id,
      name: album.title,
      image: album.cover_big || album.cover_medium,
      releaseDate: album.release_date || '',
      type: album.record_type,
    })),
  });
}));

// ===================================
// Fallbacks
// ===================================

apiRouter.use((_req, res) => res.status(404).json({ msg: 'Not found' }));

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ msg: 'Request body too large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ msg: 'Invalid JSON' });
  console.error(err.stack || err);
  res.status(500).json({ msg: 'Something went wrong' });
});

// ===================================
// WebSocket (live review notifications)
// ===================================

let wss = null;

function broadcast(message, senderToken) {
  if (!wss) return;
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client.userToken !== senderToken) client.send(payload);
  });
}

function attachWebSocket(server) {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (pathname !== '/ws') return socket.destroy();
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  });

  wss.on('connection', (ws, request) => {
    ws.isAlive = true;
    const cookies = Object.fromEntries((request.headers.cookie || '').split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }));
    ws.userToken = cookies.token || null;
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('error', err => console.error('WebSocket error:', err));
  });

  const interval = setInterval(() => {
    wss.clients.forEach(client => {
      if (client.isAlive === false) return client.terminate();
      client.isAlive = false;
      client.ping();
    });
  }, 30000);
  wss.on('close', () => clearInterval(interval));
  return wss;
}

module.exports = { app, attachWebSocket, LIMITS };
