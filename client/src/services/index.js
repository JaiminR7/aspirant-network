// Central export for all services
// Import individual services and re-export them

import api from './api';
import authService from './authService';
import { questionService } from './questionService';
import { answerService } from './answerService';
import { resourceService } from './resourceService';
import { storyService } from './storyService';
import { userService } from './userService';
import { searchService } from './searchService';
import { subjectService, topicService } from './subjectService';
import { circleService, circlePostService } from './circleService';

// Export all services
export {
  api,
  authService,
  questionService,
  answerService,
  resourceService,
  storyService,
  userService,
  searchService,
  subjectService,
  topicService,
  circleService,
  circlePostService
};

// Default export with all services
export default {
  api,
  auth: authService,
  questions: questionService,
  answers: answerService,
  resources: resourceService,
  stories: storyService,
  users: userService,
  search: searchService,
  subjects: subjectService,
  topics: topicService,
  circles: circleService,
  circlePosts: circlePostService
};
