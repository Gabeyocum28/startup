const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('polyrhythmd');
const userCollection = db.collection('user');
const reviewCollection = db.collection('review');

// This will asynchronously test the connection and exit the process if it fails
(async function testConnection() {
  try {
    await db.command({ ping: 1 });
    console.log(`Connected to database`);
  } catch (ex) {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
  }
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
  const query = { albumId: albumId };
  const options = {
    sort: { createdAt: -1 }
  };
  const cursor = reviewCollection.find(query, options);
  return cursor.toArray();
}

module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  addReview,
  getAllReviews,
  getReviewsByUser,
  getReviewsByAlbum,
};
