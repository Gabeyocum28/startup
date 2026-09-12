const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod, request, app, DB;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.MONGO_DB = 'polyrhythmd_test';
  process.env.NODE_ENV = 'test';
  ({ app } = require('../app'));
  DB = require('../database');
  request = require('supertest');
  await DB.ping();
});

after(async () => {
  await DB.close();
  await mongod.stop();
});

// Registers a user and returns a supertest agent that holds its cookie.
async function signUp(username, password = 'correct-horse-1') {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ username, password });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return agent;
}

async function postReview(agent, overrides = {}) {
  const res = await agent.post('/api/reviews').send({
    contentId: 123, contentType: 'album', contentName: 'OK Computer',
    artistName: 'Radiohead', contentCover: 'http://x/y.jpg',
    rating: 4.5, reviewText: 'Good record.', ...overrides,
  });
  return res;
}

describe('auth', () => {
  test('rejects weak credentials', async () => {
    const r1 = await request(app).post('/api/auth/register').send({ username: 'ab', password: 'longenough1' });
    assert.equal(r1.status, 400);
    const r2 = await request(app).post('/api/auth/register').send({ username: 'validname', password: 'short' });
    assert.equal(r2.status, 400);
    const r3 = await request(app).post('/api/auth/register').send({ username: 'bad name!', password: 'longenough1' });
    assert.equal(r3.status, 400);
  });

  test('register sets an httpOnly cookie and does not leak the token', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'alice', password: 'correct-horse-1' });
    assert.equal(res.status, 201);
    assert.equal(res.body.token, undefined);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /token=/);
    assert.match(cookie, /HttpOnly/);
  });

  test('duplicate username is a 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'alice', password: 'correct-horse-1' });
    assert.equal(res.status, 409);
  });

  test('login, /user, logout', async () => {
    const agent = request.agent(app);
    const bad = await agent.post('/api/auth/login').send({ username: 'alice', password: 'wrong-password' });
    assert.equal(bad.status, 401);
    const ok = await agent.post('/api/auth/login').send({ username: 'alice', password: 'correct-horse-1' });
    assert.equal(ok.status, 200);
    const me = await agent.get('/api/user');
    assert.equal(me.status, 200);
    assert.equal(me.body.username, 'alice');
    assert.deepEqual(me.body.lists, { listened: [], wantToListen: [] });
    const out = await agent.delete('/api/auth/logout');
    assert.equal(out.status, 204);
    const after = await agent.get('/api/user');
    assert.equal(after.status, 401);
  });

  test('change password invalidates session and old password', async () => {
    const agent = await signUp('pwchanger');
    const wrong = await agent.put('/api/user/password').send({ currentPassword: 'nope-nope-nope', newPassword: 'new-password-9' });
    assert.equal(wrong.status, 401);
    const ok = await agent.put('/api/user/password').send({ currentPassword: 'correct-horse-1', newPassword: 'new-password-9' });
    assert.equal(ok.status, 204);
    assert.equal((await agent.get('/api/user')).status, 401);
    const old = await request(app).post('/api/auth/login').send({ username: 'pwchanger', password: 'correct-horse-1' });
    assert.equal(old.status, 401);
    const fresh = await request(app).post('/api/auth/login').send({ username: 'pwchanger', password: 'new-password-9' });
    assert.equal(fresh.status, 200);
  });

  test('delete account requires password and removes reviews', async () => {
    const agent = await signUp('deleteme');
    await postReview(agent);
    const bad = await agent.delete('/api/user').send({ password: 'wrong-password' });
    assert.equal(bad.status, 401);
    const ok = await agent.delete('/api/user').send({ password: 'correct-horse-1' });
    assert.equal(ok.status, 204);
    assert.equal((await request(app).get('/api/user/deleteme')).status, 404);
    const reviews = await request(app).get('/api/reviews/user/deleteme');
    assert.deepEqual(reviews.body, []);
  });
});

describe('reviews', () => {
  test('requires auth and validates input', async () => {
    const anon = await request(app).post('/api/reviews').send({ contentId: 1, contentName: 'x', rating: 3, reviewText: 'y' });
    assert.equal(anon.status, 401);
    const agent = await signUp('bob');
    assert.equal((await postReview(agent, { rating: 3.3 })).status, 400);
    assert.equal((await postReview(agent, { reviewText: '   ' })).status, 400);
    assert.equal((await postReview(agent, { reviewText: 'x'.repeat(5001) })).status, 400);
    assert.equal((await postReview(agent, { contentType: 'podcast' })).status, 400);
  });

  test('reviewerName always comes from the session, not the body', async () => {
    const agent = await signUp('honest');
    const res = await postReview(agent, { reviewerName: 'someone_else' });
    assert.equal(res.status, 201);
    assert.equal(res.body.reviewerName, 'honest');
    assert.equal(res.body.canEdit, true);
  });

  test('owner can edit and delete, others cannot', async () => {
    const owner = await signUp('owner');
    const other = await signUp('other');
    const created = await postReview(owner);
    const id = created.body.id;

    const forbiddenEdit = await other.put(`/api/reviews/${id}`).send({ rating: 1, reviewText: 'hijacked' });
    assert.equal(forbiddenEdit.status, 403);
    const edit = await owner.put(`/api/reviews/${id}`).send({ rating: 2, reviewText: 'Changed my mind.' });
    assert.equal(edit.status, 200);
    assert.equal(edit.body.rating, 2);
    assert.ok(edit.body.updatedAt);

    const single = await request(app).get(`/api/reviews/${id}`);
    assert.equal(single.body.reviewText, 'Changed my mind.');
    assert.equal(single.body.canEdit, false);

    assert.equal((await other.delete(`/api/reviews/${id}`)).status, 403);
    assert.equal((await owner.delete(`/api/reviews/${id}`)).status, 204);
    assert.equal((await request(app).get(`/api/reviews/${id}`)).status, 404);
  });

  test('likes toggle and comments work', async () => {
    const owner = await signUp('liker_owner');
    const fan = await signUp('fan');
    const { body: review } = await postReview(owner);

    let like = await fan.post(`/api/reviews/${review.id}/like`);
    assert.deepEqual(like.body, { likes: 1, likedByMe: true });
    like = await fan.post(`/api/reviews/${review.id}/like`);
    assert.deepEqual(like.body, { likes: 0, likedByMe: false });

    assert.equal((await fan.post(`/api/reviews/${review.id}/comments`).send({ text: '  ' })).status, 400);
    const c = await fan.post(`/api/reviews/${review.id}/comments`).send({ text: 'Agreed!' });
    assert.equal(c.status, 201);
    const fetched = await fan.get(`/api/reviews/${review.id}`);
    assert.equal(fetched.body.commentCount, 1);
    assert.equal(fetched.body.comments[0].username, 'fan');

    // Review owner may remove someone else's comment; a third party may not.
    const third = await signUp('third');
    assert.equal((await third.delete(`/api/reviews/${review.id}/comments/${c.body.id}`)).status, 403);
    assert.equal((await owner.delete(`/api/reviews/${review.id}/comments/${c.body.id}`)).status, 204);
  });

  test('feed paginates and supports following scope', async () => {
    const writer = await signUp('prolific');
    for (let i = 0; i < 25; i++) await postReview(writer, { reviewText: `review ${i}` });

    const page1 = await request(app).get('/api/reviews?limit=20');
    assert.equal(page1.body.reviews.length, 20);
    assert.ok(page1.body.nextBefore);
    const page2 = await request(app).get(`/api/reviews?limit=20&before=${encodeURIComponent(page1.body.nextBefore)}`);
    assert.ok(page2.body.reviews.length >= 5);
    const ids1 = new Set(page1.body.reviews.map(r => r.id));
    assert.ok(page2.body.reviews.every(r => !ids1.has(r.id)));

    const reader = await signUp('reader');
    let following = await reader.get('/api/reviews?scope=following');
    assert.equal(following.body.reviews.length, 0);
    assert.equal((await reader.post('/api/users/prolific/follow')).status, 200);
    assert.equal((await reader.post('/api/users/reader/follow')).status, 400);
    following = await reader.get('/api/reviews?scope=following&limit=5');
    assert.equal(following.body.reviews.length, 5);
    assert.ok(following.body.reviews.every(r => r.reviewerName === 'prolific'));

    const profile = await reader.get('/api/user/prolific');
    assert.equal(profile.body.followedByMe, true);
    assert.deepEqual(profile.body.followers, ['reader']);

    assert.equal((await request(app).get('/api/reviews?scope=following')).status, 401);
  });
});

describe('ratings and lists', () => {
  test('batch averages and user rating history', async () => {
    const a = await signUp('rater_a');
    const b = await signUp('rater_b');
    await a.post('/api/ratings').send({ contentId: 900, contentType: 'album', rating: 4, contentName: 'Kid A', artistName: 'Radiohead' });
    await b.post('/api/ratings').send({ contentId: 900, contentType: 'album', rating: 5 });
    await a.post('/api/ratings').send({ contentId: 77, contentType: 'track', rating: 2.5 });

    const batch = await request(app).get('/api/ratings/batch?keys=album:900,track:77,artist:1');
    assert.deepEqual(batch.body['album:900'], { average: 4.5, count: 2 });
    assert.deepEqual(batch.body['track:77'], { average: 2.5, count: 1 });
    assert.equal(batch.body['artist:1'], undefined);

    const history = await request(app).get('/api/user/rater_a/ratings');
    assert.equal(history.body.length, 2);
    assert.equal(history.body.find(r => r.contentId === 900).contentName, 'Kid A');
  });

  test('listened and want-to-listen lists', async () => {
    const agent = await signUp('lister');
    const item = { id: 555, type: 'album', name: 'Blue', artist: 'Joni Mitchell', image: 'http://x/blue.jpg' };
    assert.equal((await agent.put('/api/user/lists/bogus').send({ action: 'add', item })).status, 400);
    const add = await agent.put('/api/user/lists/wantToListen').send({ action: 'add', item });
    assert.equal(add.status, 200);
    assert.equal(add.body.wantToListen.length, 1);
    // Adding again does not duplicate.
    const again = await agent.put('/api/user/lists/wantToListen').send({ action: 'add', item });
    assert.equal(again.body.wantToListen.length, 1);
    const rm = await agent.put('/api/user/lists/wantToListen').send({ action: 'remove', item });
    assert.equal(rm.body.wantToListen.length, 0);
    const pub = await request(app).get('/api/user/lister');
    assert.deepEqual(pub.body.lists.wantToListen, []);
  });
});

describe('hardening', () => {
  test('oversized body is rejected', async () => {
    const agent = await signUp('bigmouth');
    const res = await agent.post('/api/reviews').send({ contentId: 1, contentName: 'x', rating: 3, reviewText: 'x'.repeat(200000) });
    assert.equal(res.status, 413);
  });

  test('unknown api route is JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    assert.equal(res.status, 404);
    assert.equal(res.body.msg, 'Not found');
  });
});
