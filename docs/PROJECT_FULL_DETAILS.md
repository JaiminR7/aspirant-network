# Aspirant Network - Full Project Details

Last updated: 2026-03-23

## Table of Contents

1. Project Summary
2. Product Scope and Core Rules
3. Tech Stack
4. Repository Structure
5. Frontend Architecture
6. Backend Architecture
7. Data Models
8. API Surface
9. Key End-to-End Flows
10. Admin System
11. Seeding and Utility Scripts
12. Configuration and Environment
13. Development and Build Commands
14. Testing and Quality Status
15. Current Strengths
16. Current Gaps and Next Priorities

---

## 1. Project Summary

Aspirant Network is a MERN-based exam-focused social learning platform.

Primary capabilities:

- Ask and answer exam-specific questions
- Share resources (PDF, links, etc.)
- Publish stories (including anonymous mode)
- Browse a unified feed (question/resource/story)
- Interact with posts (like/dislike/comments)
- Join circles and post inside circles
- Use admin dashboard for moderation and analytics

The codebase is organized as:

- `client/` React + Vite frontend
- `server/` Express + MongoDB backend
- Root-level docs for architecture and testing notes

---

## 2. Product Scope and Core Rules

The project follows a domain rule: content should be exam-aware and scoped by user context where applicable.

Core behavior implemented in code and docs:

- User authentication with JWT
- Exam-oriented content taxonomy (subjects and topics)
- Separate content types (questions, resources, stories, posts, circle posts)
- User role checks for admin endpoints (`role === 'admin'`)

Important current behavior:

- Admin panel currently has a frontend demo unlock password gate in addition to backend admin role enforcement.
- Backend remains the true authorization layer for admin APIs.

---

## 3. Tech Stack

### Frontend

- React 19
- Vite 7
- React Router DOM 7
- Tailwind CSS
- shadcn/radix UI primitives
- Axios
- Recharts
- lucide-react icons

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- JSON Web Token (`jsonwebtoken`)
- bcrypt
- dotenv
- CORS
- nodemailer (OTP/reset mail)
- Cloudinary + multer + multer-storage-cloudinary
- Faker (`@faker-js/faker`) for seeding

---

## 4. Repository Structure

Top level:

- `ARCHITECTURE.md`
- `README.md`
- `TESTING_ASK_QUESTION.md`
- `client/`
- `server/`

Client major folders:

- `client/src/components/`
- `client/src/context/`
- `client/src/layouts/`
- `client/src/pages/`
- `client/src/router/`
- `client/src/services/`

Server major folders:

- `server/config/`
- `server/constants/`
- `server/controllers/`
- `server/middleware/`
- `server/models/`
- `server/routes/`
- `server/scripts/`
- `server/utils/`

---

## 5. Frontend Architecture

### 5.1 Routing and app shell

- `client/src/router/AppRouter.jsx` defines public/protected route behavior.
- `client/src/layouts/AppLayout.jsx` provides the main app layout and section rendering.
- Admin UI lives under `/admin` flow using:
  - `client/src/pages/Admin.jsx`
  - `client/src/pages/AdminLogin.jsx`
  - `client/src/pages/AdminDashboard.jsx`

### 5.2 Global state contexts

- `client/src/context/AuthContext.jsx`
  - Keeps `user`, `token`, auth loading state
  - Reads/writes localStorage keys for auth persistence
- `client/src/context/ExamContext.jsx`
  - Handles current exam selection and exam switching behavior

### 5.3 Service layer

`client/src/services/` includes API wrappers such as:

- `api.js` (axios instance, auth header injection, 401 handling)
- `authService.js`
- `postsService.js`
- `adminService.js`
- `questionService.js`
- `resourceService.js`
- `storyService.js`
- `searchService.js`
- `circleService.js`

### 5.4 Major pages

Key pages in `client/src/pages/`:

- Auth: `Login.jsx`, `Signup.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`
- Feed and content: `Home.jsx`, `Questions.jsx`, `QuestionDetail.jsx`, `Resources.jsx`, `ResourceDetail.jsx`, `Stories.jsx`, `StoryDetail.jsx`
- Create: `AskQuestion.jsx`, `AddResource.jsx`, `AddStory.jsx`, `CreateCircle.jsx`
- Community: `Circles.jsx`, `CircleDetail.jsx`, `Activity.jsx`, `Share.jsx`
- User and settings: `Profile.jsx`, `Settings.jsx`
- Admin: `Admin.jsx`, `AdminLogin.jsx`, `AdminDashboard.jsx`

### 5.5 UI components

Important component groups:

- Feed components: card rendering and interaction surfaces
- Post components: header/content/actions/type badge utilities
- Generic UI primitives under `client/src/components/ui/`

---

## 6. Backend Architecture

### 6.1 Boot and app config

- `server/index.js` starts server and DB connection.
- `server/app.js` configures:
  - CORS
  - JSON/urlencoded parsers
  - request logging (dev)
  - global error handling

### 6.2 Route composition

Main route mount file: `server/routes/index.js`

Mounted API groups:

- `/api/auth`
- `/api/questions`
- `/api/answers`
- `/api/resources`
- `/api/search`
- `/api/users`
- `/api/stories`
- `/api/posts`
- `/api/comments`
- `/api/interactions`
- `/api/admin`
- `/api/circles`
- `/api/circle-posts`
- `/api/subjects`
- `/api/topics`
- `/api/activities`

Health endpoints:

- `GET /api/health`
- `GET /api/`

### 6.3 Middleware

Key middleware modules:

- `server/middleware/auth.js` (JWT verification, optional auth)
- `server/middleware/admin.js` (`requireAdmin` role guard)
- `server/middleware/examContext.js` (exam context enforcement)
- `server/middleware/upload.js` (file upload handling)

### 6.4 Controllers

Controllers are split by feature area in `server/controllers/`:

- `authController.js`
- `questionController.js`
- `answerController.js`
- `resourceController.js`
- `storyController.js`
- `postController.js`
- `commentController.js`
- `interactionController.js`
- `circleController.js`
- `circlePostController.js`
- `searchController.js`
- `userController.js`
- `activityController.js`
- `subjectController.js`
- `adminController.js`

---

## 7. Data Models

Models in `server/models/`:

- `User.js`
- `Exam.js`
- `Subject.js`
- `Topic.js`
- `Question.js`
- `Answer.js`
- `Resource.js`
- `Story.js`
- `Post.js`
- `Comment.js`
- `Interaction.js`
- `Circle.js`
- `CirclePost.js`
- `Activity.js`

High-level responsibilities:

- User identity, profile, role, exam preferences
- Taxonomy: exam, subject, topic
- Content: question/answer/resource/story and unified post feed records
- Engagement: comments and like/dislike interactions
- Community: circles and circle posts
- Activity logging for user actions

---

## 8. API Surface

### 8.1 Auth

Typical endpoints in `/api/auth`:

- send OTP
- verify OTP
- signup
- login
- forgot password
- reset password

### 8.2 Content and feed

- Questions CRUD + vote/solve
- Answers CRUD + vote + accept
- Resources CRUD
- Stories CRUD
- Unified posts feed endpoints (`/api/posts`)
- Comments endpoints (`/api/comments`)
- Interactions endpoints (`/api/interactions`)

### 8.3 Discovery and taxonomy

- Search endpoints (`/api/search`)
- Subjects and topics endpoints (`/api/subjects`, `/api/topics`)

### 8.4 Community

- Circles and circle-post endpoints (`/api/circles`, `/api/circle-posts`)

### 8.5 Admin

Admin API (`/api/admin`) is protected by both:

- `auth` middleware
- `requireAdmin` middleware

Available admin operations include:

- stats
- users list/ban/delete
- posts list/delete
- reports list (currently placeholder behavior)

---

## 9. Key End-to-End Flows

### 9.1 Authentication

1. User signs up/logs in from frontend.
2. Backend returns JWT and user payload.
3. Frontend stores token/user and sends token in API headers via axios interceptor.

### 9.2 Ask question flow

1. User opens Ask Question page.
2. Subjects and topics are fetched.
3. Form validates title/description/subject/topic.
4. POST to questions endpoint creates question.

### 9.3 Unified feed flow

1. Home page requests posts API.
2. Backend returns exam-aware personalized/explore content.
3. Frontend renders cards with interaction metadata.

### 9.4 Post interaction flow

1. Like/dislike/comment action sent to interaction/comment routes.
2. Backend updates interaction/comment records.
3. Frontend refreshes or optimistically updates counts.

### 9.5 Admin flow

1. User enters `/admin`.
2. Frontend unlock gate (`AdminLogin.jsx`) controls client-side access to dashboard page.
3. Dashboard fetches backend admin APIs.
4. Backend still enforces admin role at API level.

---

## 10. Admin System

Frontend files:

- `client/src/pages/Admin.jsx`
- `client/src/pages/AdminLogin.jsx`
- `client/src/pages/AdminDashboard.jsx`
- `client/src/services/adminService.js`

Backend files:

- `server/routes/admin.js`
- `server/controllers/adminController.js`
- `server/middleware/admin.js`

Current dashboard modules:

- Dashboard analytics (cards + charts)
- Users management (ban/delete)
- Posts management (filter/delete)
- Reports tab (API currently returns placeholder list)

Important current note:

- Frontend still uses a demo password unlock (`123456`) in `AdminLogin.jsx`.
- Backend is authoritative and can still return 403 if token user role is not admin.

---

## 11. Seeding and Utility Scripts

### 11.1 Seeder pipeline

Main entry:

- `server/scripts/seed/runSeeder.mjs`

Pipeline steps:

1. Load seed config
2. Connect MongoDB
3. Optional collection cleanup
4. Seed users
5. Seed posts
6. Seed comments
7. Seed interactions
8. Seed feed collections (questions/resources/stories)
9. Print totals and disconnect

Related seed modules:

- `server/scripts/seed/config.mjs`
- `server/scripts/seed/seedUsers.mjs`
- `server/scripts/seed/seedPosts.mjs`
- `server/scripts/seed/seedComments.mjs`
- `server/scripts/seed/seedInteractions.mjs`
- `server/scripts/seed/seedFeedContent.mjs`

### 11.2 Other server scripts

Examples in `server/scripts/`:

- `seedSubjectsTopics.js`
- `clearSubjects.js`
- `clearResources.js`
- `migrateActualCreator.js`
- `generateJwtSecret.js`
- `checkSubjects.js`

---

## 12. Configuration and Environment

Server environment file expected at `server/.env`.
Typical keys used by current code/docs:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `CLIENT_URL`
- `FRONTEND_URL`
- `EMAIL_USER`
- `EMAIL_PASS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Database connection is handled by:

- `server/config/database.js`

DB init helper:

- `server/utils/dbInitializer.js`

---

## 13. Development and Build Commands

### Root package

`package.json` at root currently has dependency declarations only (no scripts).

### Client commands (`client/package.json`)

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

### Server commands (`server/package.json`)

- `npm run start`
- `npm run dev`
- `npm run seed`
- `npm run seed:reset`
- `npm test` (currently placeholder)

---

## 14. Testing and Quality Status

Current state:

- No comprehensive automated test suite configured.
- `server/package.json` test script is placeholder.
- Manual testing documentation exists:
  - `TESTING_ASK_QUESTION.md`

Lint/build status observed in recent work:

- Frontend builds successfully (`vite build`).
- Key edited files have no active diagnostics in editor checks.

---

## 15. Current Strengths

- Full-stack feature coverage across Q/A, resources, stories, circles, and feed.
- Role-gated backend admin API.
- Real dashboard analytics endpoints integrated with charts.
- Seeder system with Faker-based content generation.
- Structured frontend service layer and modular page/component organization.

---

## 16. Current Gaps and Next Priorities

Top priorities for production hardening:

1. Replace frontend demo admin unlock with server-validated admin authentication flow.
2. Add auth endpoint rate limiting and brute-force protection.
3. Add automated tests (backend integration + frontend key flow tests).
4. Add CI workflows for lint/test/build on pull requests.
5. Implement real reports/moderation pipeline instead of placeholder reports response.
6. Add stronger observability (structured logs, deeper health checks).

Recommended sequencing:

- Security first
- Quality gates second
- Moderation and observability third
- UX polish after backend stability

---

## Appendix: Related Documentation Already Present

- `README.md` - concise overview and getting started
- `ARCHITECTURE.md` - architecture narrative
- `server/API_QUICK_REFERENCE.md` - backend API quick notes
- `TESTING_ASK_QUESTION.md` - manual test walkthrough for question creation

This file is intended to be the single full-detail project map for onboarding and planning.
