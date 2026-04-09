const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('polyrhythmd');
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
      return;
    } catch (ex) {
      retries--;
      console.log(`Unable to connect to database with ${url} because ${ex.message}`);
      if (retries > 0) {
        console.log(`Retrying in 5 seconds... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.log('Failed to connect to database after all retries');
})();

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

// ===================================
// Review Functions
// ===================================

async function addReview(review) {
  return reviewCollection.insertOne(review);
}

function getAllReviews() {
  // Sort by newest first
  const options = {
    sort: { createdAt: -1 }
  };
  const cursor = reviewCollection.find({}, options);
  return cursor.toArray();
}

function getReviewsByUser(username) {
  const query = { reviewerName: username };
  const options = {
    sort: { createdAt: -1 }
  };
  const cursor = reviewCollection.find(query, options);
  return cursor.toArray();
}

function getReviewsByAlbum(albumId) {
  // Match both string and number versions of albumId
  const numId = Number(albumId);
  const query = { albumId: { $in: [albumId, numId] } };
  const options = {
    sort: { createdAt: -1 }
  };
  const cursor = reviewCollection.find(query, options);
  return cursor.toArray();
}

// ===================================
// Rating Functions (quick star ratings)
// ===================================

async function setRating(username, contentId, rating, contentType = 'album') {
  const numId = Number(contentId);
  await ratingCollection.updateOne(
    { username, contentId: { $in: [contentId, numId] }, contentType },
    { $set: { username, contentId: numId, contentType, rating, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

function getRating(username, contentId, contentType = 'album') {
  const numId = Number(contentId);
  // Also match old docs that used albumId instead of contentId
  return ratingCollection.findOne({
    username,
    $or: [
      { contentId: { $in: [contentId, numId] }, contentType },
      { albumId: { $in: [contentId, numId] } }
    ]
  });
}

function getRatingsByContent(contentId, contentType = 'album') {
  const numId = Number(contentId);
  return ratingCollection.find({
    $or: [
      { contentId: { $in: [contentId, numId] }, contentType },
      { albumId: { $in: [contentId, numId] } }
    ]
  }).toArray();
}

function getRatingsByUser(username) {
  return ratingCollection.find({ username }).toArray();
}

function getReviewsByContent(contentId, contentType) {
  const numId = Number(contentId);
  const query = contentType === 'album'
    ? { $or: [{ albumId: { $in: [contentId, numId] } }, { contentId: { $in: [contentId, numId] }, contentType: 'album' }] }
    : { contentId: { $in: [contentId, numId] }, contentType };
  return reviewCollection.find(query, { sort: { createdAt: -1 } }).toArray();
}

module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  updateUserFavorites,
  addReview,
  getAllReviews,
  getReviewsByUser,
  getReviewsByAlbum,
  getReviewsByContent,
  setRating,
  getRating,
  getRatingsByContent,
  getRatingsByUser,
};
