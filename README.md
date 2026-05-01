# Aspirant Network

A comprehensive exam-focused social platform connecting aspirants preparing for competitive exams like CAT, UPSC, JEE, NEET, GATE, and more.

## Full Project Documentation

For a complete, code-aligned project inventory and architecture breakdown, see:

- [PROJECT_FULL_DETAILS.md](PROJECT_FULL_DETAILS.md)

## Features

### Core Functionality

- **Exam-Scoped Community**: Content automatically filtered by user's exam (CAT, GATE, UPSC)
- **Q&A System**: Ask questions, get answers, rate helpful answers, mark best solution
- **Resource Library**: Share and discover PDFs, images, links, study materials with star ratings
- **Story Sharing**: Share preparation journeys anonymously or publicly for peer motivation
- **Personalized Feed**: Smart feed combining questions, stories, resources filtered by exam + level
- **Smart Search**: Full-text search across questions, resources, topics

### User Features

- **Authentication**: Secure OAuth login with Clerk (Google, email/password)
- **User Profiles**: Detailed profiles with exam, level, bio, verified badge, contribution stats
- **Interaction System**: Like/dislike, bookmark, and rate content flexibly
- **Comments**: Threaded discussions on questions, answers, stories, resources
- **Profile Tabs**: View your contributions (questions, answers, resources, saved items)
- **Study Circles**: Form groups with other aspirants for collaborative learning

### Admin Features

- **Admin Dashboard**: View statistics (total users, posts, comments by exam/type)
- **User Management**: View all users, permanently delete user accounts with cascade cleanup
- **Post Management**: Delete inappropriate posts/comments
- **Analytics**: Charts showing post distribution, daily activity trends

### Security & User Experience

- **Exam Context Enforcement**: Backend enforces exam filtering (middleware-based)
- **Protected Routes**: Authentication required for sensitive operations
- **Input Validation**: Server-side validation for all user inputs
- **Cascade Delete**: Deleting user removes all owned content atomically
- **Dark/Light Mode**: Theme toggle with persistent user preference

## Tech Stack

### Frontend

- **React 19** with Vite (fast build, HMR)
- **React Router v6** for routing and navigation
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for accessible UI components
- **Context API** for state management (Auth, Theme, Exam)
- **Axios** for API requests
- **Recharts** for admin dashboard charts
- **Clerk** for OAuth authentication

### Backend

- **Node.js** with Express.js for REST API
- **MongoDB** with Mongoose ODM for database
- **Cloudinary** for image and PDF storage
- **Clerk SDK** for authentication integration
- **MongoDB Transactions** for atomic operations (cascade delete)
- **JWT/Session** for protected routes

## Project Structure

```
aspirant-network/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── app/           # App initialization
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React contexts (Auth, Exam)
│   │   ├── layouts/       # Layout components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
│
└── server/                # Backend Node.js application
    ├── config/            # Configuration files
    ├── controllers/       # Request handlers
    ├── middleware/        # Express middleware
    ├── models/            # Mongoose models
    ├── routes/            # API routes
    └── utils/             # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/aspirant-network.git
cd aspirant-network
```

2. Install backend dependencies

```bash
cd server
npm install
```

3. Install frontend dependencies

```bash
cd ../client
npm install
```

4. Set up environment variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aspirant-network
NODE_ENV=development
CLERK_SECRET_KEY=your-clerk-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

Create a `.env.local` file in the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

5. Start the development servers

Backend (from `server` directory):

```bash
npm run dev
```

Frontend (from `client` directory):

```bash
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Documentation

For detailed API reference, see [API_GUIDE.md](docs/API_QUICK_REFERENCE.md)

### Core API Categories

**Authentication**

- `POST /api/auth/sync` - Sync Clerk user with MongoDB
- `GET /api/auth/me` - Get current user

**Users**

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `DELETE /api/users/me` - Delete account with cascade cleanup
- `POST /api/users/:id/follow` - Follow user

**Feed**

- `GET /api/feed` - Get personalized exam-scoped feed
- `GET /api/feed?exam=CAT&level=Beginner` - Filtered feed

**Questions**

- `GET /api/questions` - Get questions (paginated, filterable)
- `POST /api/questions` - Create question
- `GET /api/questions/:id` - Get question details
- `PATCH /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

**Answers**

- `POST /api/answers` - Create answer
- `GET /api/answers` - Get answers
- `PATCH /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer

**Resources**

- `GET /api/resources` - Get resources (paginated)
- `POST /api/resources` - Create resource
- `GET /api/resources/:id` - Get resource details
- `PATCH /api/resources/:id/rate` - Rate resource (1-5)

**Stories**

- `GET /api/stories` - Get stories
- `POST /api/stories` - Create story
- `DELETE /api/stories/:id` - Delete story

**Interactions (Like/Dislike/Bookmark)**

- `POST /api/interactions/like` - Like a post
- `DELETE /api/interactions/like/:id` - Unlike
- `POST /api/interactions/bookmark` - Bookmark item
- `DELETE /api/interactions/bookmark/:id` - Remove bookmark

**Comments**

- `POST /api/comments` - Create comment
- `PATCH /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

**Admin**

- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Permanently delete user
- `DELETE /api/admin/posts/:id` - Delete post

## Exam Context Architecture

All content is automatically scoped to the user's primary exam:

1. User selects primary exam during signup
2. Backend middleware (`examContext`) extracts exam from user profile
3. All queries automatically filter by `req.examContext`
4. Frontend contexts are read-only (exam cannot be changed from client)

This ensures:

- Users only see content relevant to their exam
- No cross-exam content pollution
- Secure exam enforcement at API level

## Development Status

### ✅ Completed

**Core Features:**

- User authentication with Clerk (OAuth + email)
- User profiles with onboarding (exam/level selection)
- Question system (create, view, filter by exam/topic)
- Answer system (create, rate, accept best answer)
- Resource sharing (PDF, images, links with ratings)
- Story sharing (anonymous/public prep journeys)
- Personalized feed (exam + level filtered)
- Comments on questions, answers, stories, resources
- Like/dislike system (flexible Interaction model)
- Bookmark/save functionality
- User search and profile viewing
- Dark/Light theme support
- PDF and image upload via Cloudinary
- Admin dashboard (user/post management, statistics)
- User account deletion with cascade cleanup
- Study circles (groups for collaboration)

**Technical:**

- Full MERN stack (MongoDB, Express, React, Node.js)
- Database models (User, Question, Answer, Story, Resource, Comment, Interaction, Circle, etc.)
- REST API with proper error handling
- Authentication middleware and route protection
- Exam context enforcement
- MongoDB transactions for atomic operations
- Tag-based content organization

### 🚧 In Progress / Polish

- Advanced admin features
- Unban functionality
- Notification system
- Analytics dashboard

### 📋 Future Scope

- AI-powered recommendations
- Real-time chat system
- Push notifications
- Mock test platform
- Gamification (leaderboards, badges)
- Study group video calls
- Email notifications for interactions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

Project Link: [https://github.com/yourusername/aspirant-network](https://github.com/yourusername/aspirant-network)
