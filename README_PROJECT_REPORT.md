# Aspirant Network - Project Report Master README

Last updated: 2026-04-26

This file is a complete, report-ready project summary for Aspirant Network. It is designed so you can give it to GPT (or include it directly in your college report) to generate a detailed submission document.

## 1. Project Identity

- Project Name: Aspirant Network
- Project Type: Full-stack web platform (MERN-style architecture)
- Core Domain: Exam-focused social learning and collaboration
- Primary Users: Competitive exam aspirants (CAT, UPSC, JEE, NEET, GATE, SSC-10 boards, HSC-12 boards)
- Repository Layout:
  - client: React + Vite frontend
  - server: Node.js + Express + MongoDB backend
  - docs: project documentation and implementation guides

## 2. Problem Statement

General social platforms are noisy and not exam-focused. Aspirants need relevant, context-specific content and interactions.

Aspirant Network addresses this by:

- Restricting content relevance using exam context
- Supporting core preparation workflows (questions, answers, resources, stories)
- Providing community features (circles, comments, reactions)
- Providing moderation/admin tooling

## 3. Project Goals and Scope

### In scope

- Auth system with OTP email verification and password reset OTP
- Exam-oriented content system
- Unified feed of question/resource/story posts
- Resource sharing with upload support
- User interactions (save, like/dislike, comments)
- Search and filters
- Circle/community modules
- Admin dashboard APIs and frontend

### Out of scope (current state)

- Fully integrated report moderation pipeline (placeholder API response currently)
- Comprehensive automated test suite
- Production-grade admin bypass removal (demo bypass still present)

## 4. Key Business Rules and Domain Constraints

1. Each user has one primary exam context.
2. Most content APIs are exam-scoped via auth + exam middleware patterns.
3. Questions/resources/stories are content-type-specific but also mirrored into a unified Post collection for feed behavior.
4. Tag constraints are enforced by schema:
   - Questions: max 3 user tags
   - Resources: max 3 user tags
   - Stories: max 5 tags
5. Some comments are intentionally constrained by approved comment text sets in selected modules.

## 5. Technology Stack

### Frontend

- React 19
- Vite 7
- React Router DOM 7
- Tailwind CSS + Radix/shadcn-style primitives
- Axios for API calls
- Recharts for admin analytics visualizations
- Framer Motion (dependency present)

### Backend

- Node.js
- Express 5
- Mongoose 9 (MongoDB ODM)
- JWT (jsonwebtoken)
- bcrypt
- multer + Cloudinary storage
- nodemailer (OTP email flows)

### Data and Infra

- MongoDB (local/Atlas)
- Cloudinary for media/file hosting
- Gmail-based SMTP integration for OTP emails

## 6. High-Level Architecture

### Request flow

1. Frontend sends request with Bearer token.
2. Backend auth middleware validates token and loads user.
3. Exam context is attached from user profile.
4. Route-level middleware and controller logic enforce access and business rules.
5. Mongoose models validate schema constraints and relations.
6. JSON response returned to frontend service layer.

### Layered backend structure

- Routes: endpoint mapping
- Middleware: auth, exam validation, admin checks, upload
- Controllers: business logic
- Models: schema, indexes, hooks, methods

## 7. Detailed Module Summary

## 7.1 Authentication and Account Management

Implemented endpoints include:

- send OTP
- verify OTP
- signup
- login
- login by OTP
- forgot password
- verify reset OTP
- reset password
- me
- logout

Important details:

- OTP is hashed before storage.
- OTP verification has expiry and attempt limits.
- Signup is gated behind successful email verification.
- JWT token issued on signup/login.

## 7.2 User and Profile Module

- Fetch current user profile
- Update profile and settings
- Change password
- Delete own account
- Fetch user activity
- Public profile by username
- Endpoint available to change primary exam

## 7.3 Question and Answer Module

- Create, list, retrieve, update, delete questions
- Mark solved
- Upvote/downvote question
- Nested answer endpoints under question
- Standalone answer endpoints for update/delete/accept/voting

Data behavior:

- Question stores exam, subject/topic references, denormalized names, votes, solve state.
- On question creation, a feed Post entry is also created.

## 7.4 Resource Module

- Upload file (Cloudinary flow)
- Create/list/get/update/delete resources
- Trending/top-rated listing
- Rate resource and fetch user rating
- Preview/download flow
- Upvote/downvote resource

Data behavior:

- Resource maintains rating aggregates and save counts.
- Owner data uses both user and createdBy (kept in sync for compatibility).
- Resource also mirrors into Post for feed rendering.

## 7.5 Story Module

- Create/list/get/update/delete stories
- Trending stories
- Upvote/downvote
- Save story
- Add/delete story comments

Data behavior:

- Supports anonymous story mode.
- Story creation also creates unified Post entry.

## 7.6 Unified Feed, Comments, and Interactions

Feed:

- Post collection stores normalized cross-type feed cards.
- Supports feed list, detail, save/unsave, saved list.

Engagement:

- Interactions endpoint supports like/dislike toggle behavior.
- Comment module supports post comments.
- Saved items are tracked in dedicated SavedItem collection.

## 7.7 Search and Discovery

- Global search endpoint
- Search by questions
- Search by resources

Search routes are protected and exam-aware via middleware usage.

## 7.8 Taxonomy: Exams, Subjects, Topics

- Exams are controlled constants in backend.
- Subjects and topics are modeled and scoped by exam.
- Topic validates subject linkage and exam consistency.

## 7.9 Activity Module

- Fetch user activities
- Mark one activity as read
- Mark all activities as read

## 7.10 Circles and Circle Posts

Circles:

- Create circle
- List circles
- Get circle details
- Add message in circle

Circle posts:

- Create and list posts per circle
- Delete post
- Upvote/downvote
- Add comment

## 7.11 Admin Module

Backend admin API supports:

- Dashboard stats aggregation
- User list/ban/delete
- Post list/delete
- Resource force delete
- Reports endpoint (currently placeholder)

Current implementation notes:

- API authorization checks admin role.
- Demo bypass mechanism also exists via special header + localStorage flag.
- Frontend admin unlock currently uses hardcoded demo password.

## 8. Data Model Inventory

Core collections/models:

- User
- Exam
- Subject
- Topic
- Question
- Answer
- Resource
- ResourceRating
- Story
- Post
- Comment
- Interaction
- SavedItem
- Circle
- CirclePost
- Activity

Design pattern:

- Domain entities keep exam context and author references.
- Post acts as a feed hub for heterogeneous content types.
- Mongoose hooks enforce relational consistency (subject-topic-exam checks, owner syncing, etc.).

## 9. Frontend Architecture Summary

### App bootstrap

Main providers include:

- ThemeProvider
- AuthProvider
- ExamProvider
- ToastProvider

### Routing

- Public entry pages: landing/login/signup/forgot password
- Protected app shell: AppLayout
- In-app pages include home, questions, resources, stories, activity, profile, circles, admin pages, search, settings, and detail pages

### State and Services

- AuthContext handles token/user persistence and auth helpers.
- ExamContext handles current exam UX state.
- Service layer wraps API modules (auth, posts, questions, resources, stories, search, circles, admin, etc.).
- Axios interceptors inject auth headers and handle common error paths.

## 10. Security and Validation Overview

Implemented controls:

- JWT-based protected routes
- Role-based admin checks
- Schema-level validations in Mongoose
- OTP hashing and expiry checks
- Basic secure headers in Express app
- Input constraints on field lengths/types

Current risks/gaps to mention in report:

- Admin demo bypass is still present and should be removed before production.
- No explicit auth rate limiting for brute-force prevention yet.
- Frontend exam switching context and backend exam fields are not perfectly aligned in all places.

## 11. Scripts, Operations, and Setup

### Backend scripts

- dev/start
- seed
- seed reset
- cleanup scripts
- JWT secret generator
- subject checks and seeding utilities

### Environment variables (server)

Typical required keys:

- PORT
- NODE_ENV
- MONGODB_URI
- JWT_SECRET
- JWT_EXPIRE
- CLIENT_URL / FRONTEND_URL
- EMAIL_USER
- EMAIL_PASS
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

## 12. Current Status Snapshot (Report Friendly)

### Strongly implemented

- End-to-end auth with OTP and JWT
- Full CRUD flows for core content modules
- Unified feed architecture
- Interaction and save systems
- Admin analytics foundations
- Organized modular codebase

### Partially implemented or pending hardening

- Production-grade admin lock tightening
- Full moderation reports pipeline
- Automated testing and CI quality gates
- Additional security hardening (rate limits, stricter anti-abuse)

## 13. Known Documentation vs Implementation Notes

- Some high-level architecture docs mention broader conceptual features; actual route/module implementation is the source of truth.
- Exam-scoping is heavily present, but there are spots where profile-owner filters skip exam query filters for compatibility reasons.
- Admin flow currently includes demo unlock behavior on frontend and middleware bypass support for demo scena rios.

## 14. Suggested Report Chapters (For Submission)

Use this structure in your final college report:

1. Introduction and problem definition
2. Objectives and scope
3. Literature/market context (optional)
4. System architecture and design principles
5. Technology stack justification
6. Database design and schema discussion
7. Module-wise implementation
8. API design and workflow diagrams
9. Security and validation strategy
10. Testing approach and current quality status
11. Limitations and future enhancements
12. Conclusion

## 15. Ready-to-Use Prompt for GPT (Big Report Generation)

Copy this into GPT along with this README:

"Create a complete academic project report for my full-stack project Aspirant Network based on the provided project master README. Use formal engineering report style suitable for final-year submission. Include:

- Abstract
- Introduction
- Problem statement
- Objectives
- Scope
- Proposed architecture
- Detailed module explanations (auth, questions, answers, resources, stories, posts/feed, interactions, search, circles, admin)
- Database schema discussion
- API design explanation
- Security controls and limitations
- Implementation highlights
- Testing strategy and current status
- Challenges faced and solutions
- Future work
- Conclusion

Also generate:

1. Executive summary (1 page)
2. Viva-ready short notes
3. Suggested diagrams list (ER diagram, sequence diagrams, architecture diagram, deployment diagram)
4. 15 likely viva questions with strong answers"

## 16. Quick Viva Notes

- Unique value: exam-focused content relevance instead of generic social feed.
- Architectural pattern: modular Express backend with middleware-driven context enforcement.
- Data strategy: normalized domain collections + denormalized feed model for fast rendering.
- Security baseline: JWT auth, OTP verification, schema validations, role checks.
- Practical tradeoff: demo admin unlock accelerates development but must be removed for production.

---

If you need, this file can be converted into:

- IEEE paper format sections
- University-specific report chapter format
- PPT-ready 10-slide summary
