# Polyrhythmd - Music Review Platform

[My Notes](notes.md)

Polyrhythmd is a music review platform designed for the music critic in all of us. Users can discover, review, and share their thoughts on albums while connecting with other music enthusiasts in a community-driven environment.

## 🚀 Specification Deliverable

> [!NOTE]
>  Fill in this sections as the submission artifact for this deliverable. You can refer to this [example](https://github.com/webprogramming260/startup-example/blob/main/README.md) for inspiration.

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] Proper use of Markdown
- [x] A concise and compelling elevator pitch
- [x] Description of key features
- [x] Description of how you will use each technology
- [x] One or more rough sketches of your application. Images must be embedded in this file using Markdown image references.

### Elevator pitch

Music discovery shouldn't be limited to algorithmic recommendations. Polyrhythmd empowers music lovers to share honest reviews, discover albums through community recommendations, and connect with others who share their musical tastes. Users can search for albums, write detailed reviews with ratings, follow other critics, and build their own music discovery feed. Whether you're a casual listener or a serious music critic, Polyrhythmd provides the tools to explore, evaluate, and share your musical journey with a community that values authentic opinions over popularity metrics.

### Design

![Application Wireframes](IMG_1695.JPG)

The application features a clean, music-focused interface designed for easy navigation and content discovery:

**Authentication Flow**: Simple login and registration system with secure bcrypt password hashing stored in MongoDB.

**User Profiles**: User profiles displaying all reviews written by that user, with logout functionality.

**Album Search & Review**: Integrated Spotify API search for finding albums, with detailed review forms including 0.5-5 star ratings and written reviews stored in MongoDB.

**Social Feed**: Community-driven feed displaying all user reviews with album art, ratings, review text, and author information.

**Music Discovery**: Browse albums via Spotify search with full album details including tracklist, release date, label, and aggregate user review ratings.

### Key Features

- **Album Search & Discovery**: Search for albums using Spotify API with real-time results
- **Review System**: Write detailed reviews with 0.5-5 star ratings stored in MongoDB
- **User Profiles**: View user-specific review history with all reviews by that user
- **Social Feed**: Community feed displaying all reviews from all users
- **Rating Analytics**: View aggregate ratings calculated from all user reviews for each album
- **Authentication**: Secure user registration and login with bcrypt password hashing
- **Album Details**: Full album information including tracklist, release date, label, and genres from Spotify

### Technologies

The application uses the required technologies in the following ways:

- **HTML** - Single-page React application with proper HTML structure rendered via React components. The app uses semantic HTML elements throughout.

- **CSS** - Professional responsive design with a dark theme featuring orange-pink gradient branding. Custom CSS for album art displays, review cards, star rating components, and responsive layouts optimized for desktop and mobile viewing.

- **React** - Component-based architecture with:
  - Authentication components for login/registration with form validation
  - Album search component with Spotify API integration
  - Album detail pages showing full album information and reviews
  - Review creation forms with star rating input
  - User profile pages displaying review history
  - Social feed displaying all community reviews
  - React Router for navigation between pages

- **Service** - Node.js/Express backend service providing:
  - User authentication endpoints (register, login, logout)
  - Spotify API integration for album search and details
  - Review CRUD endpoints (create, read by user, read by album, read all)
  - Token-based authentication with cookies
  - Static file serving for React frontend

- **DB/Login** - MongoDB Atlas database storing:
  - User accounts with bcrypt-hashed passwords and auth tokens
  - User reviews with ratings, text, album info, and timestamps
  - Secure credential management and session handling

- **WebSocket** - Real-time WebSocket implementation providing:
  - Backend WebSocket server on `/ws` endpoint using ws library
  - Live activity notifications in sidebar when users post reviews
  - Real-time broadcasting to all connected clients except the sender
  - Automatic reconnection with exponential backoff
  - Ping/pong heartbeat for connection health monitoring

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Server deployed and accessible with custom domain name** - [My server link](https://polyrhythmd.com/).

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

I completed all of the HTML files needed and explicitly put down where I was going to put each part. I have a login, images, db data place holder, api place holder, and WebSocket place holder.

- [x] **HTML pages** - Made HTML Pages for all of the diferent aspects of my project
- [x] **Proper HTML element usage** - Used propper elements
- [x] **Links** - links to other pages
- [x] **Text** - data shown
- [x] **Images** - images for profiles
- [x] **Login placeholder** - yes
- [x] **DB data placeholder** - db of login data and reviews
- [x] **WebSocket placeholder** - when a friend posts

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Header, footer, and main content body** - propper header footer and main
- [x] **Navigation elements** - navigable website
- [x] **Responsive to window resizing** - responsive window 
- [x] **Application elements** - all elements acounted for
- [x] **Application text content** - shown text
- [x] **Application images** - images shown

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Bundled using Vite** - Vite bundles and working
- [x] **Components** - all components working
- [x] **Router** - router routes to all the propper pages

## 🚀 React part 2: Reactivity deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **All functionality implemented or mocked out** - YES!
- [x] **Hooks** - yes, I have a js endpoint filling feed with reviews and sends a notification to the sidebar on desktop mode

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Node.js/Express HTTP service** - completes
- [x] **Static middleware for frontend** - middleware implemented
- [x] **Calls to third party endpoints** - calls spotify API
- [x] **Backend service endpoints** - Login and Logout on the backend
- [x] **Frontend calls service endpoints** - yes
- [x] **Supports registration, login, logout, and restricted endpoint** - yes


## 🚀 DB deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Stores data in MongoDB** - done! reviews stored and retrieved from MongoDB
- [x] **Stores credentials in MongoDB** - done! user authentication with hashed passwords stored in MongoDB

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Backend listens for WebSocket connection** - WebSocket server implemented using ws library, listens on `/ws` endpoint with user token tracking
- [x] **Frontend makes WebSocket connection** - Custom WebSocketClient connects to backend, auto-reconnects with exponential backoff (5 attempts max)
- [x] **Data sent over WebSocket connection** - Review notifications broadcast to all connected clients except the sender
- [x] **WebSocket data displayed** - Live activity notifications appear in sidebar showing username, album name, and rating in real-time
- [x] **Application is fully functional** - Complete real-time notification system with ping/pong heartbeat for connection health
!


Here is my first edit!
edit in web consol