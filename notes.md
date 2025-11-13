# CS 260 Notes - Polyrhythmd Project

[My startup - Polyrhythmd](https://polyrhythmd.com)

## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

---

## AWS Deployment

**My Server Info:**
- Elastic IP: 44.196.180.132
- Domain: https://polyrhythmd.com/

**SSH Commands:**
```bash
# SSH into server
ssh -i /Users/gabrielyocum/Desktop/School/Fall2025/CS260/Server-Key/production.pem ubuntu@polyrhythmd.com

# Deploy frontend
./deployFiles.sh -k /Users/gabrielyocum/Desktop/School/Fall2025/CS260/Server-Key/production.pem -h polyrhythmd.com -s startup

# Deploy backend service
./deployService.sh -k /Users/gabrielyocum/Desktop/School/Fall2025/CS260/Server-Key/production.pem -h polyrhythmd.com -s startup
```

**Tips:**
- Always test locally before deploying
- Keep your .pem key file secure and in .gitignore
- Use deployment scripts from Simon examples
- Check Caddy logs if site isn't working: `sudo journalctl -u caddy`

---

## HTML Deliverable

**What I Learned:**
- Use proper semantic HTML: `<header>`, `<footer>`, `<main>`, `<nav>`, `<section>`
- Structure pages with clear hierarchy
- Links use `<a>` tags with proper hrefs
- Forms use `<form>`, `<input>`, `<button>` elements

**Tips:**
- Code duplication in headers/footers is OK - React will fix this later
- Plan placeholder text for DB data and API calls
- Use meaningful IDs and classes for later CSS/JS work

**Basic HTML Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <header>
    <h1>App Name</h1>
    <nav>
      <a href="index.html">Home</a>
      <a href="about.html">About</a>
    </nav>
  </header>

  <main>
    <!-- Your content here -->
  </main>

  <footer>
    <p>&copy; 2025 My App</p>
  </footer>
</body>
</html>
```

---

## CSS Deliverable

**What I Learned:**
- CSS Grid and Flexbox are essential for layouts
- Mobile-first responsive design using media queries
- Custom CSS variables for theming
- Bootstrap helps but can be opinionated

**My Approach:**
- Dark theme with gradient branding (orange-pink)
- Responsive layouts that work on mobile and desktop
- Custom star rating displays
- Smooth transitions and hover effects

**Tips:**
- Use CSS variables for colors/spacing:
```css
:root {
  --primary-color: #ff6b35;
  --bg-dark: #1a1a1a;
  --text-color: #e0e0e0;
}
```

- Responsive grid pattern:
```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
```

- Mobile-first media query:
```css
/* Mobile styles first */
.sidebar { display: none; }

/* Desktop */
@media (min-width: 768px) {
  .sidebar { display: block; }
}
```

---

## React Part 1: Routing

**What I Learned:**
- Vite is the modern React build tool (faster than Create React App)
- React Router handles navigation without page reloads
- Component-based architecture makes code reusable

**Setup Steps:**
1. `npm create vite@latest` - choose React
2. `npm install react-router-dom`
3. `npm install bootstrap react-bootstrap`

**Router Skeleton:**
```jsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <header>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Tips:**
- Use `NavLink` instead of `Link` for active styling
- Always include a `*` route for 404 pages
- Pass props to routes: `element={<Profile userName={user} />}`

---

## React Part 2: Reactivity

**What I Learned:**
- `useState` manages component state
- `useEffect` runs side effects (API calls, subscriptions)
- Props flow down, events flow up
- Don't manipulate DOM directly - use state!

**State Management Patterns:**

**Simple State:**
```jsx
const [count, setCount] = useState(0);

// Update state
setCount(count + 1);
```

**Array State:**
```jsx
const [items, setItems] = useState([]);

// Add item
setItems([...items, newItem]);

// Remove item
setItems(items.filter(item => item.id !== removeId));
```

**Object State:**
```jsx
const [user, setUser] = useState({ name: '', email: '' });

// Update property
setUser({ ...user, name: 'John' });
```

**useEffect for API Calls:**
```jsx
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch('/api/data');
    const data = await response.json();
    setData(data);
  };

  fetchData();
}, []); // Empty array = run once on mount
```

**Tips:**
- Always use the setter function from useState
- Use `[]` dependency array in useEffect to run once
- Clean up in useEffect with return function:
```jsx
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer); // Cleanup
}, []);
```

---

## Service Deliverable

**What I Learned:**
- Express makes backend APIs easy
- Middleware pattern for request processing
- Environment variables for secrets
- Proxy setup for Vite dev server

**Express Server Skeleton:**
```javascript
const express = require('express');
const app = express();
const port = process.argv[2] || 4000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve frontend
app.set('trust proxy', true);

// API Router
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Endpoints
apiRouter.get('/data', (req, res) => {
  res.json({ message: 'Hello' });
});

apiRouter.post('/data', (req, res) => {
  const { name } = req.body;
  res.status(201).json({ name });
});

// Default to index.html for SPA
app.use((_req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

**Third-Party API Pattern:**
```javascript
// Spotify API example
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}
```

**Vite Proxy Setup (vite.config.js):**
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

**Tips:**
- Use environment variables for API keys (never commit them!)
- Test with Postman or curl before hooking up frontend
- Use try-catch for async operations
- Return proper HTTP status codes (200, 201, 400, 401, 500)

---

## DB/Login Deliverable

**What I Learned:**
- MongoDB Atlas for cloud database
- bcrypt for password hashing (NEVER store plain passwords!)
- Token-based authentication with cookies
- Separate database module for clean architecture

**MongoDB Connection Module (database.js):**
```javascript
const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('myapp');

// Collections
const userCollection = db.collection('user');
const dataCollection = db.collection('data');

// Test connection
(async function testConnection() {
  try {
    await db.command({ ping: 1 });
    console.log('Connected to database');
  } catch (ex) {
    console.log(`Unable to connect to database: ${ex.message}`);
    process.exit(1);
  }
})();

// User functions
function getUser(email) {
  return userCollection.findOne({ email: email });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

async function addUser(user) {
  await userCollection.insertOne(user);
}

async function updateUser(user) {
  await userCollection.updateOne({ email: user.email }, { $set: user });
}

// Data functions
async function addData(data) {
  return dataCollection.insertOne(data);
}

function getAllData() {
  return dataCollection.find({}).sort({ createdAt: -1 }).toArray();
}

module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  addData,
  getAllData,
};
```

**Registration Endpoint:**
```javascript
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const DB = require('./database.js');

apiRouter.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password required' });
  }

  // Check if user exists
  const existingUser = await DB.getUser(email);
  if (existingUser) {
    return res.status(409).json({ msg: 'User already exists' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user with token
  const token = uuid();
  const user = {
    id: uuid(),
    email,
    password: passwordHash,
    token: token,
    createdAt: new Date().toISOString()
  };

  await DB.addUser(user);

  // Set cookie
  res.cookie('token', token, {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  });

  res.status(201).json({ id: user.id, email: user.email });
});
```

**Login Endpoint:**
```javascript
apiRouter.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await DB.getUser(email);
  if (!user) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  // Generate new token
  const token = uuid();
  user.token = token;
  await DB.updateUser(user);

  res.cookie('token', token, {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  });

  res.json({ id: user.id, email: user.email });
});
```

**Protected Endpoint Pattern:**
```javascript
apiRouter.post('/data', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  const user = await DB.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  // User is authenticated, proceed with request
  const newData = { ...req.body, userId: user.id };
  await DB.addData(newData);

  res.status(201).json(newData);
});
```

**dbConfig.json (add to .gitignore!):**
```json
{
  "hostname": "cluster0.xxxxx.mongodb.net",
  "userName": "youruser",
  "password": "yourpassword"
}
```

**MongoDB Tips:**
- Create database in MongoDB Atlas (free tier is fine)
- Add your IP to whitelist in Atlas
- Use `findOne()` for single documents
- Use `find().toArray()` for multiple documents
- Use `insertOne()` to add documents
- Use `updateOne()` with `$set` to update
- Always add `dbConfig.json` to `.gitignore`!

**Security Reminders:**
- ✅ Hash passwords with bcrypt (10 rounds)
- ✅ Use UUIDs for tokens
- ✅ Never commit API keys or DB credentials
- ✅ Use httpOnly cookies in production
- ✅ Validate all user input
- ✅ Return generic error messages (don't reveal if email exists)

---

## WebSocket Deliverable (Upcoming)

**Plan:**
- Real-time notifications when users post reviews
- Live activity feed updates
- Use WebSocket for bidirectional communication

**Mock WebSocket (what I'm using now):**
```javascript
// Mock WebSocket that simulates real-time updates
const mockWebSocket = {
  listeners: [],

  addListener(callback) {
    this.listeners.push(callback);
  },

  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  },

  start() {
    // Simulate periodic updates
    this.interval = setInterval(() => {
      const notification = {
        id: Date.now(),
        userName: 'User',
        albumName: 'Album',
        rating: 4.5
      };
      this.listeners.forEach(l => l(notification));
    }, 30000);
  },

  stop() {
    clearInterval(this.interval);
  }
};
```

---

## Quick Reference

### Common Commands
```bash
# Install dependencies
npm install

# Run dev server (Vite)
npm run dev

# Build for production
npm run build

# Start backend
node index.js

# Deploy frontend
./deployFiles.sh -k <key> -h <domain> -s <service>

# Deploy backend
./deployService.sh -k <key> -h <domain> -s <service>
```

### File Structure
```
startup/
├── src/                 # React frontend
│   ├── components/
│   ├── app.jsx
│   └── index.jsx
├── service/             # Node backend
│   ├── index.js
│   ├── database.js
│   └── dbConfig.json    # In .gitignore!
├── public/              # Built frontend (after npm run build)
├── package.json
└── vite.config.js
```

### HTTP Status Codes to Remember
- 200 OK - Success
- 201 Created - Resource created
- 204 No Content - Success with no response body
- 400 Bad Request - Invalid input
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Authenticated but not allowed
- 404 Not Found - Resource doesn't exist
- 409 Conflict - Resource already exists
- 500 Internal Server Error - Server error

---

## Lessons Learned

1. **Always test locally first** - Don't deploy broken code
2. **Commit often** - Small, frequent commits are better than big ones
3. **Use meaningful commit messages** - "fix bug" is not helpful
4. **Read error messages carefully** - They usually tell you what's wrong
5. **Check the browser console** - Frontend errors show up there
6. **Check the server logs** - Backend errors show up there
7. **Use .gitignore properly** - Never commit secrets or node_modules
8. **Plan your data structure** - Think about what you need to store
9. **Mobile-first design** - Easier to expand than to shrink
10. **Ask for help** - Don't spend hours stuck on one thing

---

## Project-Specific Notes

**Polyrhythmd Features Implemented:**
- ✅ User authentication with MongoDB
- ✅ Album search via Spotify API
- ✅ Review creation and storage
- ✅ User profiles with review history
- ✅ Community feed
- ✅ Aggregate rating calculations
- ✅ Mock WebSocket for live updates

**Still To Do:**
- [ ] Real WebSocket implementation
- [ ] User following system
- [ ] Review likes/comments
- [ ] Better error handling
- [ ] Loading states
- [ ] Form validation improvements
