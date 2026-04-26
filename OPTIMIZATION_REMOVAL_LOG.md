# Optimization Removal Log

This file acts as a permanent audit trail of every deletion, removal, consolidation, and cleanup performed during the optimization of the `aspirant-network` repository.

---

## [2026-04-25] Documentation Consolidation
- **Relocated**: `ARCHITECTURE.md`, `TESTING_ASK_QUESTION.md`, `PROJECT_FULL_DETAILS.md` from root to `docs/`.
- **Relocated**: `client/PROJECT_RULES.md` to `docs/`.
- **Relocated**: `server/API_QUICK_REFERENCE.md`, `server/OTP_IMPLEMENTATION_GUIDE.md`, `server/REFACTORING_SUMMARY.md`, `server/REFACTOR_GUIDE.md` to `docs/`.
- **Reason**: Reduced root bloat and centralized developer documentation.


## [2026-04-25] Script Archiving
- **Archived**: server/scripts/clearResources.js, server/scripts/clearSubjects.js, server/scripts/fixCircleTopics.js, server/scripts/migrateActualCreator.js to server/scripts/archive/.
- **Reason**: These were one-time migration or cleanup scripts no longer needed in the active scripts directory.

## [2026-04-25] Component Removal
- **Deleted**: client/src/components/ActivityFeed.jsx
- **Reason**: Dead code. The activity feed functionality is implemented directly in the Activity.jsx page, and this component was not imported anywhere in the project.

## [2026-04-25] Constant Removal
- **Deleted**: client/src/constants/allowedComments.js
- **Reason**: Unused. The frontend transitioned to a free-text comment system and no longer uses this whitelist.

## [2026-04-25] Page Removal
- **Deleted**: client/src/pages/ResetPassword.jsx
- **Reason**: Dead/Legacy code. The password reset flow was modernized to an OTP-based system implemented entirely within `ForgotPassword.jsx`. This component expected a token-based link which is no longer generated or sent by the backend.

## [2026-04-25] Utility Consolidation
- **Consolidated**: `formatDate` and `formatRelativeTime` functions.
- **Affected Files**: `Profile.jsx`, `QuestionDetail.jsx`, `Search.jsx`, `Stories.jsx`, `StoryDetail.jsx`, `Circles.jsx`, `CirclePostCard.jsx`.
- **Action**: Created `client/src/utils/dateUtils.js` and replaced 8+ local re-definitions with centralized imports.
- **Reason**: Reduced bundle size and ensured consistent date formatting across the entire UI.
## [2026-04-25] Constant Centralization
- **Consolidated**: `EXAMS`, `LEVELS`, `STORY_TYPES`, `RESOURCE_TYPES`, and `SYSTEM_TAGS`.
- **Created**: `client/src/constants/appConstants.js`
- **Affected Files**: `Signup.jsx`, `Settings.jsx`, `Onboarding.jsx`, `Stories.jsx`, `AddStory.jsx`, `Resources.jsx`, `AddResource.jsx`.
- **Reason**: Removed massive duplicate arrays across multiple files to improve maintainability and ensure UI consistency (e.g., matching exam names across signup and settings).

## [2026-04-25] Component Consolidation & Removal
- **Deleted**: `client/src/components/InteractionBar.jsx`
- **Deleted**: `client/src/components/FeedCardHeader.jsx`
- **Action**: Consolidated `InteractionBar` logic into a more flexible `client/src/components/post/PostActions.jsx` with `size` and `showBorder` props.
- **Affected Files**: `ResourceDetail.jsx`, `Questions.jsx`.
- **Reason**: Reduced code duplication by merging two components that performed nearly identical interaction logic (Likes/Dislikes/Saves). `FeedCardHeader` was found to be truly unused.
