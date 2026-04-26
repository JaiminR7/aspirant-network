# Aspirant Network

A comprehensive exam-focused social platform connecting aspirants preparing for competitive exams like CAT, UPSC, JEE, NEET, GATE, and more.

## Full Project Documentation

For a complete, code-aligned project inventory and architecture breakdown, see:

- [PROJECT_FULL_DETAILS.md](PROJECT_FULL_DETAILS.md)

## Features

### Core Functionality

- **Exam-Scoped Content**: All content automatically scoped to user's primary exam
- **Questions & Answers**: Ask doubts, get answers, vote, accept solutions
- **Resources**: Share and discover study materials (PDFs, videos, links, images)
- **Stories**: Share success stories and preparation journeys
- **Search**: Comprehensive search across questions, resources, and tags

### User Features

- User authentication with JWT
- Profile management with credibility scoring
- Tag-based content organization (max 3 user tags per post)
- Voting and rating system
- Save/bookmark functionality

### Security

- Exam context enforced at backend (middleware-based)
- Protected routes with authentication
- Input validation and sanitization
- Safe regex for search (ReDoS prevention)

## Tech Stack

### Frontend

- **React 19** with Vite
- **React Router v6** for routing
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- Context API for state management

### Backend

- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcrypt** for password hashing
- Middleware-based architecture

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
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
NODE_ENV=development
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

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Questions

- `POST /api/questions` - Create question
- `GET /api/questions` - Get all questions (exam-scoped)
- `GET /api/questions/:id` - Get single question
- `PATCH /api/questions/:id/vote` - Vote on question
- `PATCH /api/questions/:id/solve` - Mark question as solved

### Answers

- `POST /api/questions/:questionId/answers` - Create answer
- `PATCH /api/answers/:id/vote` - Vote on answer
- `PATCH /api/answers/:id/accept` - Accept answer
- `PATCH /api/answers/:id/unaccept` - Unaccept answer

### Resources

- `POST /api/resources` - Create resource
- `GET /api/resources` - Get all resources (exam-scoped)
- `GET /api/resources/:id` - Get single resource
- `PATCH /api/resources/:id/rate` - Rate resource
- `POST /api/resources/:id/save` - Save/unsave resource

### Search

- `GET /api/search` - Global search
- `GET /api/search/questions` - Search questions
- `GET /api/search/resources` - Search resources
- `GET /api/search/tags` - Search by tags
- `GET /api/search/autocomplete` - Autocomplete suggestions

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

- Backend models (User, Question, Answer, Resource)
- Authentication middleware
- Exam context middleware
- Input validators
- All API routes and controllers
- Tag validation utilities
- Frontend contexts (Auth, Exam)
- Router setup with protected routes
- Authentication pages

### 🚧 In Progress

- Frontend page components
- API integration
- Database configuration
- Seed data

### 📋 Planned

- Story model and APIs
- Chat system
- Report/moderation system
- Real-time notifications
- Email verification
- Password reset
- Advanced analytics

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

```
aspirant-network
├─ ARCHITECTURE.md
├─ client
│  ├─ components.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ jsconfig.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ PROJECT_RULES.md
│  ├─ public
│  │  ├─ vite.svg
│  │  └─ _redirects
│  ├─ README.md
│  ├─ src
│  │  ├─ assets
│  │  ├─ components
│  │  │  ├─ ActivityFeed.jsx
│  │  │  ├─ CirclePostCard.jsx
│  │  │  ├─ feed
│  │  │  │  ├─ Feed.jsx
│  │  │  │  ├─ FilterBar.jsx
│  │  │  │  └─ PostCard.jsx
│  │  │  ├─ FeedCardHeader.jsx
│  │  │  ├─ InteractionBar.jsx
│  │  │  ├─ landing
│  │  │  │  ├─ Community.jsx
│  │  │  │  ├─ CTASection.jsx
│  │  │  │  ├─ Features.jsx
│  │  │  │  ├─ Footer.jsx
│  │  │  │  ├─ Hero.jsx
│  │  │  │  ├─ Navbar.jsx
│  │  │  │  ├─ PlatformPreview.jsx
│  │  │  │  ├─ SocialProof.jsx
│  │  │  │  └─ WhyAspirant.jsx
│  │  │  ├─ post
│  │  │  │  ├─ PostActions.jsx
│  │  │  │  ├─ PostContent.jsx
│  │  │  │  ├─ PostHeader.jsx
│  │  │  │  ├─ PostTags.jsx
│  │  │  │  ├─ PostTypeBadge.jsx
│  │  │  │  └─ postTypeUtils.js
│  │  │  ├─ ThemeToggle.jsx
│  │  │  └─ ui
│  │  │     ├─ badge.jsx
│  │  │     ├─ button.jsx
│  │  │     ├─ card.jsx
│  │  │     ├─ dialog.jsx
│  │  │     ├─ input.jsx
│  │  │     ├─ label.jsx
│  │  │     ├─ select.jsx
│  │  │     ├─ Stepper.css
│  │  │     ├─ Stepper.jsx
│  │  │     ├─ textarea.jsx
│  │  │     └─ toast.jsx
│  │  ├─ constants
│  │  │  └─ allowedComments.js
│  │  ├─ context
│  │  │  ├─ AuthContext.jsx
│  │  │  ├─ ExamContext.jsx
│  │  │  └─ ThemeContext.jsx
│  │  ├─ index.css
│  │  ├─ layouts
│  │  │  ├─ AppLayout.jsx
│  │  │  └─ AuthLayout.jsx
│  │  ├─ lib
│  │  │  └─ utils.js
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ Activity.jsx
│  │  │  ├─ AddResource.jsx
│  │  │  ├─ AddStory.jsx
│  │  │  ├─ Admin.jsx
│  │  │  ├─ AdminDashboard.jsx
│  │  │  ├─ AdminLogin.jsx
│  │  │  ├─ AskQuestion.jsx
│  │  │  ├─ CircleDetail.jsx
│  │  │  ├─ Circles.jsx
│  │  │  ├─ CreateCircle.jsx
│  │  │  ├─ CreateCirclePost.jsx
│  │  │  ├─ ForgotPassword.jsx
│  │  │  ├─ Home.jsx
│  │  │  ├─ Landing.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ Onboarding.jsx
│  │  │  ├─ PostDetail.jsx
│  │  │  ├─ Profile.jsx
│  │  │  ├─ QuestionDetail.jsx
│  │  │  ├─ Questions.jsx
│  │  │  ├─ ResetPassword.jsx
│  │  │  ├─ ResourceDetail.jsx
│  │  │  ├─ resources
│  │  │  │  └─ ResourceViewer.jsx
│  │  │  ├─ Resources.jsx
│  │  │  ├─ Search.jsx
│  │  │  ├─ Settings.jsx
│  │  │  ├─ Share.jsx
│  │  │  ├─ Signup.jsx
│  │  │  ├─ Stories.jsx
│  │  │  └─ StoryDetail.jsx
│  │  ├─ router
│  │  │  └─ AppRouter.jsx
│  │  ├─ services
│  │  │  ├─ activityService.js
│  │  │  ├─ adminService.js
│  │  │  ├─ answerService.js
│  │  │  ├─ api.js
│  │  │  ├─ authService.js
│  │  │  ├─ circleService.js
│  │  │  ├─ index.js
│  │  │  ├─ postsService.js
│  │  │  ├─ questionService.js
│  │  │  ├─ resourceService.js
│  │  │  ├─ searchService.js
│  │  │  ├─ storyService.js
│  │  │  ├─ subjectService.js
│  │  │  └─ userService.js
│  │  └─ utils
│  │     ├─ circleEvents.js
│  │     └─ feedOptimistic.js
│  ├─ tailwind.config.js
│  └─ vite.config.js
├─ package-lock.json
├─ package.json
├─ PROJECT_FULL_DETAILS.md
├─ README.md
├─ server
│  ├─ API_QUICK_REFERENCE.md
│  ├─ app.js
│  ├─ config
│  │  └─ database.js
│  ├─ constants
│  │  ├─ allowedComments.js
│  │  ├─ exams.js
│  │  └─ levels.js
│  ├─ controllers
│  │  ├─ activityController.js
│  │  ├─ adminController.js
│  │  ├─ answerController.js
│  │  ├─ authController.js
│  │  ├─ circleController.js
│  │  ├─ circlePostController.js
│  │  ├─ commentController.js
│  │  ├─ interactionController.js
│  │  ├─ postController.js
│  │  ├─ questionController.js
│  │  ├─ resourceController.js
│  │  ├─ searchController.js
│  │  ├─ storyController.js
│  │  ├─ subjectController.js
│  │  └─ userController.js
│  ├─ index.js
│  ├─ middleware
│  │  ├─ admin.js
│  │  ├─ adminAuth.js
│  │  ├─ auth.js
│  │  ├─ examContext.js
│  │  └─ upload.js
│  ├─ models
│  │  ├─ Activity.js
│  │  ├─ Answer.js
│  │  ├─ Circle.js
│  │  ├─ CirclePost.js
│  │  ├─ Comment.js
│  │  ├─ Exam.js
│  │  ├─ Interaction.js
│  │  ├─ Post.js
│  │  ├─ Question.js
│  │  ├─ Resource.js
│  │  ├─ SavedItem.js
│  │  ├─ Story.js
│  │  ├─ Subject.js
│  │  ├─ Topic.js
│  │  └─ User.js
│  ├─ OTP_IMPLEMENTATION_GUIDE.md
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ REFACTORING_SUMMARY.md
│  ├─ REFACTOR_GUIDE.md
│  ├─ routes
│  │  ├─ activities.js
│  │  ├─ admin.js
│  │  ├─ answers.js
│  │  ├─ auth.js
│  │  ├─ circlePosts.js
│  │  ├─ circles.js
│  │  ├─ comments.js
│  │  ├─ index.js
│  │  ├─ interactions.js
│  │  ├─ posts.js
│  │  ├─ questions.js
│  │  ├─ resources.js
│  │  ├─ search.js
│  │  ├─ stories.js
│  │  ├─ subjects.js
│  │  ├─ topics.js
│  │  └─ users.js
│  ├─ scripts
│  │  ├─ checkSubjects.js
│  │  ├─ cleanup
│  │  │  ├─ cleanupInvalidResourceOwnership.js
│  │  │  ├─ cleanupNonWhitelistComments.mjs
│  │  │  └─ verifyWhitelistComments.mjs
│  │  ├─ clearResources.js
│  │  ├─ clearSubjects.js
│  │  ├─ fixCircleTopics.js
│  │  ├─ generateJwtSecret.js
│  │  ├─ migrateActualCreator.js
│  │  ├─ seed
│  │  │  ├─ checkPostsDistribution.mjs
│  │  │  ├─ checkSeededUserNames.mjs
│  │  │  ├─ config.mjs
│  │  │  ├─ runSeeder.mjs
│  │  │  ├─ seedComments.mjs
│  │  │  ├─ seedFeedContent.mjs
│  │  │  ├─ seedInteractions.mjs
│  │  │  ├─ seedPosts.mjs
│  │  │  ├─ seedUsers.mjs
│  │  │  └─ utils.mjs
│  │  └─ seedSubjectsTopics.js
│  └─ utils
│     ├─ dbInitializer.js
│     ├─ sendEmail.js
│     ├─ tagUtils.js
│     └─ validators.js
└─ TESTING_ASK_QUESTION.md

```