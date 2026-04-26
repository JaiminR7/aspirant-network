# Architecture Overview

## System Summary

**Aspirant Network** is an exam-centric preparation platform where all content, interactions, and communication are strictly scoped by exam context. The architecture enforces this scoping at the backend layer to ensure data integrity, security, and prevent unauthorized cross-exam access.

---

## Tech Stack

### Frontend

- **React 19** - Component-based UI
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Mongoose** - MongoDB ODM with schema validation
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Cloudinary** - File storage (images, PDFs)

### Database

- **MongoDB** - Document-based NoSQL database
- **Indexes** - Optimized for exam-scoped queries

---

## Core Architectural Principles

### 1. **Exam Context Enforcement (Backend-First)**

**Why Backend, Not Frontend?**

- **Security**: Frontend can be bypassed/manipulated by users
- **Data Integrity**: Backend controls database queries
- **Single Source of Truth**: Backend validates ALL requests
- **API Protection**: Direct API calls must respect exam scoping

**Implementation:**

```javascript
// Every content query includes exam filter
Question.find({ exam: user.primaryExam });
Resource.find({ exam: user.primaryExam });
Story.find({ exam: user.primaryExam });
```

**Middleware Layer:**

- Extract user's current exam from JWT token
- Inject exam context into all queries automatically
- Reject cross-exam data access attempts

---

### 2. **Separation of Concerns**

```
┌─────────────────────────────────────────────┐
│              CLIENT (React)                  │
│  - UI Components                             │
│  - State Management (Context API)            │
│  - Form Validation                           │
│  - User Interactions                         │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST API
                   │ (JWT in Headers)
┌──────────────────▼──────────────────────────┐
│            BACKEND (Express)                 │
│  ┌────────────────────────────────────────┐ │
│  │  Routes (API Endpoints)                │ │
│  └────────────┬───────────────────────────┘ │
│  ┌────────────▼───────────────────────────┐ │
│  │  Middleware                            │ │
│  │  - Auth (JWT verification)             │ │
│  │  - Exam Context Injection              │ │
│  │  - Validation                          │ │
│  │  - Error Handling                      │ │
│  └────────────┬───────────────────────────┘ │
│  ┌────────────▼───────────────────────────┐ │
│  │  Controllers (Business Logic)          │ │
│  │  - Exam scoping                        │ │
│  │  - Data processing                     │ │
│  │  - Authorization                       │ │
│  └────────────┬───────────────────────────┘ │
│  ┌────────────▼───────────────────────────┐ │
│  │  Models (Mongoose Schemas)             │ │
│  │  - Data validation                     │ │
│  │  - Business methods                    │ │
│  │  - Relationships                       │ │
│  └────────────┬───────────────────────────┘ │
└───────────────┼───────────────────────────┘
                │
┌───────────────▼───────────────────────────┐
│         DATABASE (MongoDB)                 │
│  - Collections (Users, Questions, etc.)    │
│  - Indexes (exam + subject + topic)        │
│  - Aggregations for analytics              │
└────────────────────────────────────────────┘
```

---

### 3. **Data Models**

#### Core Entities

1. **User** - Profile, exam context, credentials
2. **Question** - Exam-scoped Q&A with tags
3. **Answer** - Responses with voting
4. **Resource** - Files, links with ratings
5. **Story** - Experience sharing
6. **Tag** - System + user tags
7. **Chat** - Question-specific, request-based
8. **Report** - Content moderation

#### Relationships

```
User ──┬── (posts) ──> Question ──> (has many) ──> Answer
       │
       ├── (shares) ──> Resource
       │
       ├── (writes) ──> Story
       │
       └── (initiates) ──> Chat (linked to Question + Answer)
```

---

### 4. **Security Model**

#### Authentication

- **JWT tokens** stored in httpOnly cookies or localStorage
- Token contains: `userId`, `primaryExam`, `level`
- Token verified on every protected route

#### Authorization

- User can only access content from their current exam
- Chat requests validated against question ownership
- Report system prevents abuse

#### Data Protection

- Passwords hashed with bcrypt (10 rounds)
- Input validation on both frontend and backend
- XSS prevention (sanitized inputs)
- Rate limiting on APIs
- CORS configured for trusted origins

---

### 5. **Exam Scoping Strategy**

#### Database Level

```javascript
// All content models include exam field
{
  exam: {
    type: String,
    required: true,
    enum: EXAM_VALUES
  }
}

// Compound indexes for performance
questionSchema.index({ exam: 1, subject: 1, topic: 1 });
```

#### Middleware Level

```javascript
// Inject exam context into all queries
const examScopeMiddleware = (req, res, next) => {
  req.examContext = req.user.primaryExam;
  next();
};
```

#### Controller Level

```javascript
// Every query filters by exam
const getQuestions = async (req, res) => {
  const questions = await Question.find({
    exam: req.examContext,
    subject: req.query.subject,
  });
};
```

---

### 6. **API Design**

#### RESTful Endpoints

```
Auth:
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

Questions:
GET    /api/questions          (exam-scoped)
POST   /api/questions          (exam from user context)
GET    /api/questions/:id      (exam validation)
PUT    /api/questions/:id      (ownership check)
DELETE /api/questions/:id      (ownership check)

Resources:
GET    /api/resources          (exam-scoped)
POST   /api/resources          (with file upload)
GET    /api/resources/:id

Chat:
POST   /api/chat/request       (from answer)
PUT    /api/chat/:id/accept
PUT    /api/chat/:id/close     (permanent)
POST   /api/chat/:id/message   (text-only)
```

---

### 7. **State Management**

#### Frontend Context

```javascript
// ExamContext - Global exam state
{
  primaryExam, // Current exam
    isOnboardingComplete,
    userLevel,
    updateExam(); // Change exam (settings only)
}
```

#### Backend Session

- User's exam stored in JWT
- Exam change requires re-authentication
- Ensures backend always has latest exam context

---

### 8. **Scalability Considerations**

#### Database

- **Indexes** on `exam`, `subject`, `topic` for fast filtering
- **Sharding** by exam type (future)
- **Connection pooling** for concurrent requests

#### API

- **Pagination** for large result sets
- **Caching** with Redis (future)
- **CDN** for static assets (Cloudinary)

#### Code

- **Modular structure** (easy to add new exams)
- **Reusable middleware** (auth, exam scoping)
- **Constants-driven** (exams, subjects, tags)

---

### 9. **File Upload Flow**

```
User uploads PDF/Image
      ↓
Frontend validates (size, type)
      ↓
FormData sent to /api/resources
      ↓
Multer middleware processes file
      ↓
Cloudinary upload
      ↓
URL + publicId stored in MongoDB
      ↓
Frontend displays resource
```

---

### 10. **Chat System Flow**

```
User A posts Question
      ↓
User B posts Answer
      ↓
User A requests chat (from answer)
      ↓
User B accepts/declines
      ↓
[If accepted] Chat active
      ↓
Either user stops chat
      ↓
Chat permanently closed (no reopen)
```

**Key Rules:**

- Chat linked to specific Question + Answer
- No generic DM system
- Text-only messages
- No media in chat
- Permanent closure enforced by backend

---

## Critical Design Decisions

### ✅ **Why Exam Scoping is Backend-Enforced**

1. **Security**: Frontend can be manipulated (DevTools, API tools)
2. **Data Leak Prevention**: Direct database queries must be filtered
3. **Consistent Behavior**: All API clients (web, mobile) get same data
4. **Audit Trail**: Backend logs all cross-exam access attempts
5. **Trust**: Never trust client-side filtering

### ✅ **Why No Global Feed**

1. **Focus**: Users see only relevant content
2. **Quality**: Reduces noise and irrelevant posts
3. **Performance**: Smaller query scopes = faster responses
4. **Mental Health**: Reduces FOMO and comparison

### ✅ **Why Chat is Request-Based**

1. **Harassment Prevention**: No unsolicited messages
2. **Context Preservation**: Chat always tied to a question
3. **Purposeful Interaction**: Reduces spam and off-topic chat
4. **Closure Control**: Either party can permanently end chat

---

## Deployment Strategy

### Development

```
Frontend: localhost:5173 (Vite)
Backend:  localhost:5000 (Express)
Database: MongoDB Atlas (Cloud) or Local
```

### Production

```
Frontend: Vercel / Netlify (Static hosting)
Backend:  AWS EC2 / DigitalOcean (Node.js server)
Database: MongoDB Atlas (Managed)
Storage:  Cloudinary (Images/PDFs)
```

---

## Monitoring & Analytics

- **Error Tracking**: Log all API errors
- **Usage Metrics**: Track popular subjects/topics per exam
- **Performance**: Monitor query times, API latency
- **Security**: Log failed auth attempts, suspicious queries

---

## Future Enhancements

- **Real-time Chat**: WebSockets for instant messaging
- **Push Notifications**: Exam reminders, answer alerts
- **AI Recommendations**: Personalized study plans
- **Mobile App**: React Native with same backend
- **Analytics Dashboard**: Admin insights per exam

---

## Summary

This architecture prioritizes:

1. **Exam context enforcement** at every layer
2. **Security** through backend validation
3. **Scalability** through modular design
4. **User experience** through focused content
5. **Data integrity** through controlled constants

The platform is built to support focused, exam-specific preparation without the noise of social media or cross-exam distractions.
