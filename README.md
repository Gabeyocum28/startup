# OfficeHoursAI - Intelligent TA Assistant

[My Notes](notes.md)

OfficeHoursAI revolutionizes office hours by providing students with instant, intelligent tutoring assistance while helping teachers manage virtual office hours efficiently. Students can join virtual offices, upload course materials, and chat with an AI teaching assistant that understands their specific coursework in a way that incentivises learning, not simply giving answers.

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

Imagine never waiting in long office hour lines again, while still getting personalized help with your coursework. OfficeHoursAI creates virtual office hours where students can instantly chat with an intelligent TA that has been trained on their specific course materials. Teachers upload their class materials such as their syllabus, lecture notes, and assignments, then share a simple join code with students. The AI provides immediate help to homework questions and explains concepts from uploaded materials. This AI would be trained to promote learning and focus on student development over quick answers. It's like having a teaching assistant available 24/7 who actually knows your specific class content.

### Design

![Application Wireframes](IMG_1695.JPG)

The application features a role-based interface with distinct experiences for teachers and students:

**Login/Registration Flow**: Secure authentication distinguishing between teacher and student accounts with encrypted password storage.

**Teacher Dashboard**: Comprehensive class management where teachers can create classes, upload course materials, monitor student interactions, and customize their AI assistant's behavior and knowledge base.

**Student Dashboard**: Simple interface showing enrolled classes with easy access to AI chat sessions and the ability to join new classes via teacher-provided codes.

**AI Chat Interface**: Interactive learning environment where students can chat with course-aware AI, take practice tests, get homework help, upload files for assistance, and receive personalized learning support that adapts to their individual needs.

- **Role-Based Authentication**: Secure login system distinguishing between teachers and students with encrypted credentials
- **Class Management**: Teachers create classes with unique join codes for easy student enrollment
- **Intelligent File Processing**: Teachers upload course materials (syllabi, notes, assignments) for AI context training
- **Adaptive AI Assistant**: AI that learns each student's preferences, knowledge level, and optimal learning style
- **Interactive Learning Tools**: Practice test generation, homework checking, and step-by-step problem solving assistance
- **Conversation Memory**: AI remembers past interactions to provide increasingly personalized help
- **File Upload Support**: Students can upload assignments or questions for AI analysis and feedback
- **Teacher Oversight**: Teachers can monitor AI interactions and customize assistant behavior for their specific course needs

### Technologies

I am going to use the required technologies in the following ways.

- **HTML** - Proper HTML structure for login/registration pages, teacher dashboard with expandable class sections, student dashboard with class listings, and interactive chat interface. Semantic elements for accessibility and clean navigation between all application views.

- **CSS** - Professional responsive design that works on desktop and mobile devices. Modern UI with chat bubbles, expandable class cards, file upload styling, loading animations, and consistent branding. Grid and flexbox layouts for dashboard organization.

- **React** - Component-based architecture with:
  - Authentication components for login/registration with role selection
  - Teacher dashboard with dynamic class expansion and file management
  - Student dashboard with class joining and chat access
  - Interactive chat interface with real-time messaging
  - File upload components with progress tracking
  - Routing between different user views and chat sessions

- **Service** - Backend service providing:
  - User registration, login, and logout with role-based authentication
  - Class creation and management with unique join codes
  - File upload processing and text extraction for AI training
  - AI integration with OpenAI API including conversation context and memory
  - Student progress tracking and learning preference storage
  - Third-party service integration for enhanced learning features (educational APIs)
  - Practice test generation and homework checking endpoints

- **DB/Login** - MongoDB storage for:
  - User accounts with encrypted passwords and role designation (teacher/student)
  - Class information with join codes and enrolled students
  - Uploaded course materials and extracted text content
  - Conversation history and student learning profiles
  - AI interaction logs and student progress tracking
  - Secure session management with authentication required for all features

- **WebSocket** - Real-time features including:
  - Live chat messaging between students and AI
  - Real-time notifications when students join classes or start chat sessions
  - Live updates of student activity for teacher monitoring
  - Instant delivery of AI responses and typing indicators
  - Real-time file upload progress and processing status updates

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Server deployed and accessible with custom domain name** - [My server link](https://polyrhythmd.com/).

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

I completed all of the HTML files needed and explicitly put down where I was going to put each part. I have a login, images, db data place holder, api place holder, and WebSocket place holder.

- [x] **HTML pages**
- [x] **Proper HTML element usage**
- [x] **Links**
- [x] **Text**
- [x] **Images** 
- [x] **Login placeholder**
- [x] **DB data placeholder**
- [x] **WebSocket placeholder**

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Header, footer, and main content body** - I did not complete this part of the deliverable.
- [ ] **Navigation elements** - I did not complete this part of the deliverable.
- [ ] **Responsive to window resizing** - I did not complete this part of the deliverable.
- [ ] **Application elements** - I did not complete this part of the deliverable.
- [ ] **Application text content** - I did not complete this part of the deliverable.
- [ ] **Application images** - I did not complete this part of the deliverable.

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Bundled using Vite** - I did not complete this part of the deliverable.
- [ ] **Components** - I did not complete this part of the deliverable.
- [ ] **Router** - I did not complete this part of the deliverable.

## 🚀 React part 2: Reactivity deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **All functionality implemented or mocked out** - I did not complete this part of the deliverable.
- [ ] **Hooks** - I did not complete this part of the deliverable.

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Node.js/Express HTTP service** - I did not complete this part of the deliverable.
- [ ] **Static middleware for frontend** - I did not complete this part of the deliverable.
- [ ] **Calls to third party endpoints** - I did not complete this part of the deliverable.
- [ ] **Backend service endpoints** - I did not complete this part of the deliverable.
- [ ] **Frontend calls service endpoints** - I did not complete this part of the deliverable.
- [ ] **Supports registration, login, logout, and restricted endpoint** - I did not complete this part of the deliverable.


## 🚀 DB deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Stores data in MongoDB** - I did not complete this part of the deliverable.
- [ ] **Stores credentials in MongoDB** - I did not complete this part of the deliverable.

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Backend listens for WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Frontend makes WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Data sent over WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **WebSocket data displayed** - I did not complete this part of the deliverable.
- [ ] **Application is fully functional** - I did not complete this part of the deliverable.


Here is my first edit!
edit in web consol
