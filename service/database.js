const { MongoClient } = require('mongodb');

// Connection string comes from MONGO_URI (production / Docker / tests). Falls
// back to the local dbConfig.json for development.
function getMongoUrl() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const config = require('./dbConfig.json');
  return `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
}

const url = getMongoUrl();
const client = new MongoClient(url);
const db = client.db(process.env.MONGO_DB || 'polyrhythmd');
const userCollection = db.collection('user');
const reviewCollection = db.collection('review');
const ratingCollection = db.collection('rating');

// This will asynchronously test the connection and retry if it fails
(async function testConnection() {
  let retries = 5;
  while (retries > 0) {
    try {
      await db.command({ ping: 1 });
      console.log(`Connected to database`);
      await ensureIndexes();
      return;
    } catch (ex) {
      retries--;
      console.log(`Unable to connect to database because ${ex.message}`);
      if (retries > 0) {
        console.log(`Retrying in 5 seconds... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.log('Failed to connect to database after all retries');
})();

async function ensureIndexes() {
  await Promise.all([
    userCollection.createIndex({ username: 1 }, { unique: true }),
    userCollection.createIndex({ token: 1 }),
    reviewCollection.createIndex({ createdAt: -1 }),
    reviewCollection.createIndex({ reviewerName: 1, createdAt: -1 }),
    reviewCollection.createIndex({ contentId: 1, contentType: 1 }),
    ratingCollection.createIndex({ username: 1, contentId: 1, contentType: 1 }),
  ]);
}

function ping() {
  return db.command({ ping: 1 });
}

function close() {
  return client.close();
}

// Matches both string and number forms of a Deezer id.
function idMatch(contentId) {
  const numId = Number(contentId);
  return Number.isNaN(numId) ? contentId : { $in: [String(contentId), numId] };
}

// ===================================
// User Functions
// ===================================

function getUser(username) {
  return userCollection.findOne({ username: username });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

async function addUser(user) {
  await userCollection.insertOne(user);
}

async function updateUser(user) {
  await userCollection.updateOne({ username: user.username }, { $set: user });
}

async function updateUserFavorites(username, favoriteAlbums) {
  await userCollection.updateOne(
    { username: username },
    { $set: { favoriteAlbums: favoriteAlbums } }
  );
}

async function setUserPassword(username, passwordHash) {
  await userCollection.updateOne({ username }, { $set: { password: passwordHash, token: null } });
}

async function deleteUser(username) {
  await Promise.all([
    userCollection.deleteOne({ username }),
    reviewCollection.deleteMany({ reviewerName: username }),
    ratingCollection.deleteMany({ username }),
    reviewCollection.updateMany({ likedBy: username }, { $pull: { likedBy: username }, $inc: { likes: -1 } }),
    reviewCollection.updateMany({ 'comments.username': username }, { $pull: { comments: { username } } }),
    userCollection.updateMany({ following: username }, { $pull: { following: username } }),
  ]);
}

// ---- Following ----

async function follow(username, target) {
  await userCollection.updateOne({ username }, { $addToSet: { following: target } });
}

async function unfollow(username, target) {
  await userCollection.updateOne({ username }, { $pull: { following: target } });
}

function getFollowers(username) {
  return userCollection.find({ following: username }, { projection: { _id: 0, username: 1 } }).toArray();
}

// ---- Lists (listened / wantToListen) ----

async function addToList(username, list, item) {
  await userCollection.updateOne({ username }, { $pull: { [`lists.${list}`]: { id: item.id, type: item.type } } });
  await userCollection.updateOne({ username }, { $push: { [`lists.${list}`]: { $each: [item], $position: 0 } } });
}

async function removeFromList(username, list, id, type) {
  await userCollection.updateOne({ username }, { $pull: { [`lists.${list}`]: { id, type } } });
}

// ===================================
// Review Functions
// ===================================

async function addReview(review) {
  return reviewCollection.insertOne(review);
}

function getReview(id) {
  return reviewCollection.findOne({ id });
}

async function updateReview(id, fields) {
  await reviewCollection.updateOne({ id }, { $set: fields });
}

async function deleteReview(id) {
  await reviewCollection.deleteOne({ id });
}

// Paginated feed. `before` is an ISO createdAt cursor; `authors` restricts to
// a set of reviewer names (used for the following-only feed).
function getReviews({ limit = 20, before = null, authors = null } = {}) {
  const query = {};
  if (before) query.createdAt = { $lt: before };
  if (authors) query.reviewerName = { $in: authors };
  return reviewCollection.find(query, { sort: { createdAt: -1 }, limit }).toArray();
}

function getAllReviews() {
  return reviewCollection.find({}, { sort: { createdAt: -1 } }).toArray();
}

function getReviewsByUser(username) {
  return reviewCollection.find({ reviewerName: username }, { sort: { createdAt: -1 } }).toArray();
}

function getReviewsByAlbum(albumId) {
  return reviewCollection.find({ albumId: idMatch(albumId) }, { sort: { createdAt: -1 } }).toArray();
}

function getReviewsByContent(contentId, contentType) {
  const m = idMatch(contentId);
  const query = contentType === 'album'
    ? { $or: [{ albumId: m }, { contentId: m, contentType: 'album' }] }
    : { contentId: m, contentType };
  return reviewCollection.find(query, { sort: { createdAt: -1 } }).toArray();
}

// ---- Likes ----

// Toggles a like. Returns the updated review.
async function toggleLike(id, username) {
  const review = await getReview(id);
  if (!review) return null;
  const liked = (review.likedBy || []).includes(username);
  const update = liked
    ? { $pull: { likedBy: username }, $inc: { likes: -1 } }
    : { $addToSet: { likedBy: username }, $inc: { likes: 1 } };
  await reviewCollection.updateOne({ id }, update);
  return getReview(id);
}

// ---- Comments ----

async function addComment(reviewId, comment) {
  await reviewCollection.updateOne({ id: reviewId }, { $push: { comments: comment } });
}

async function deleteComment(reviewId, commentId) {
  await reviewCollection.updateOne({ id: reviewId }, { $pull: { comments: { id: commentId } } });
}

// ===================================
// Rating Functions (quick star ratings)
// ===================================

async function setRating(username, contentId, rating, contentType = 'album', meta = {}) {
  const numId = Number(contentId);
  await ratingCollection.updateOne(
    { username, contentId: idMatch(contentId), contentType },
    { $set: { username, contentId: numId, contentType, rating, ...meta, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

function getRating(username, contentId, contentType = 'album') {
  const m = idMatch(contentId);
  // Also match old docs that used albumId instead of contentId
  return ratingCollection.findOne({
    username,
    $or: [
      { contentId: m, contentType },
      { albumId: m }
    ]
  });
}

function getRatingsByContent(contentId, contentType = 'album') {
  const m = idMatch(contentId);
  return ratingCollection.find({
    $or: [
      { contentId: m, contentType },
      { albumId: m }
    ]
  }).toArray();
}

function getRatingsByUser(username) {
  return ratingCollection.find({ username }, { sort: { updatedAt: -1 } }).toArray();
}

// keys: [{contentId, contentType}] -> { "type:id": {average, count} }
async function getRatingAverages(keys) {
  if (keys.length === 0) return {};
  const or = keys.map(k => ({ contentId: idMatch(k.contentId), contentType: k.contentType }));
  const rows = await ratingCollection.aggregate([
    { $match: { $or: or } },
    { $group: { _id: { id: '$contentId', type: '$contentType' }, sum: { $sum: '$rating' }, count: { $sum: 1 } } }
  ]).toArray();
  const out = {};
  for (const r of rows) {
    out[`${r._id.type}:${r._id.id}`] = { average: Math.round((r.sum / r.count) * 10) / 10, count: r.count };
  }
  return out;
}

module.exports = {
  ping,
  close,
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  updateUserFavorites,
  setUserPassword,
  deleteUser,
  follow,
  unfollow,
  getFollowers,
  addToList,
  removeFromList,
  addReview,
  getReview,
  updateReview,
  deleteReview,
  getReviews,
  getAllReviews,
  getReviewsByUser,
  getReviewsByAlbum,
  getReviewsByContent,
  toggleLike,
  addComment,
  deleteComment,
  setRating,
  getRating,
  getRatingsByContent,
  getRatingsByUser,
  getRatingAverages,
};
