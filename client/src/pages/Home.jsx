import { useState } from "react";
import { useExam } from "../contexts/ExamContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  BookOpen,
  MessageCircle,
  Users,
  Trophy,
  Clock,
  TrendingUp,
  FileText,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { ProfileDropdown } from "../components/ProfileDropdown";

// Mock data - replace with actual API calls
const generateMockData = (exam) => ({
  doubts: [
    {
      id: 1,
      title: `Help with ${exam} Quantitative Aptitude`,
      content:
        "I'm struggling with profit and loss problems. Can someone explain the basic concepts?",
      author: "student123",
      upvotes: 12,
      answers: 3,
      timeAgo: "2 hours ago",
      tags: ["Quantitative Aptitude", "Profit & Loss"],
    },
    {
      id: 2,
      title: `${exam} Reading Comprehension Tips`,
      content: "What are some effective strategies for RC passages?",
      author: "aspirant_2024",
      upvotes: 8,
      answers: 5,
      timeAgo: "4 hours ago",
      tags: ["Verbal Ability", "Reading Comprehension"],
    },
  ],
  questions: [
    {
      id: 1,
      title: "If a train travels at 60 kmph for 2 hours...",
      difficulty: "Medium",
      subject: "Quantitative Aptitude",
      timeAgo: "1 hour ago",
      attempts: 145,
      accuracy: "68%",
    },
    {
      id: 2,
      title: "Choose the word most similar in meaning to 'Eloquent'",
      difficulty: "Easy",
      subject: "Verbal Ability",
      timeAgo: "3 hours ago",
      attempts: 203,
      accuracy: "82%",
    },
  ],
  resources: [
    {
      id: 1,
      title: `Complete ${exam} Study Guide 2024`,
      type: "PDF",
      rating: 4.8,
      downloads: 1200,
      uploadedBy: "prep_master",
      timeAgo: "1 day ago",
    },
    {
      id: 2,
      title: `${exam} Mock Test Series`,
      type: "Test Series",
      rating: 4.6,
      downloads: 890,
      uploadedBy: "test_guru",
      timeAgo: "2 days ago",
    },
  ],
  stories: [
    {
      id: 1,
      title: "How I cracked CAT 2023 with 99.8 percentile",
      author: "success_story",
      readTime: "5 min",
      likes: 234,
      timeAgo: "1 week ago",
    },
  ],
});

function FeedCard({ children, className = "" }) {
  return (
    <Card className={`mb-4 hover:shadow-md transition-shadow ${className}`}>
      {children}
    </Card>
  );
}

function DoubtCard({ doubt }) {
  return (
    <FeedCard>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{doubt.title}</CardTitle>
            <CardDescription className="mt-2">{doubt.content}</CardDescription>
          </div>
          <HelpCircle className="w-5 h-5 text-blue-500 ml-2 flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>by {doubt.author}</span>
            <span>{doubt.timeAgo}</span>
            <span>{doubt.upvotes} upvotes</span>
            <span>{doubt.answers} answers</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {doubt.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </FeedCard>
  );
}

function QuestionCard({ question }) {
  return (
    <FeedCard>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{question.title}</CardTitle>
            <div className="flex items-center space-x-3 mt-2">
              <Badge
                variant={
                  question.difficulty === "Easy"
                    ? "success"
                    : question.difficulty === "Medium"
                    ? "warning"
                    : "destructive"
                }
              >
                {question.difficulty}
              </Badge>
              <span className="text-sm text-gray-600">{question.subject}</span>
            </div>
          </div>
          <BookOpen className="w-5 h-5 text-green-500 ml-2 flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{question.timeAgo}</span>
          <div className="flex items-center space-x-4">
            <span>{question.attempts} attempts</span>
            <span className="text-green-600">{question.accuracy} accuracy</span>
          </div>
        </div>
      </CardContent>
    </FeedCard>
  );
}

function ResourceCard({ resource }) {
  return (
    <FeedCard>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{resource.title}</CardTitle>
            <div className="flex items-center space-x-3 mt-2">
              <Badge variant="outline">{resource.type}</Badge>
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">{resource.rating}</span>
              </div>
            </div>
          </div>
          <FileText className="w-5 h-5 text-purple-500 ml-2 flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>by {resource.uploadedBy}</span>
          <div className="flex items-center space-x-4">
            <span>{resource.downloads} downloads</span>
            <span>{resource.timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </FeedCard>
  );
}

export function Home() {
  const { user } = useExam();
  const [activeTab, setActiveTab] = useState("doubts");

  const mockData = generateMockData(user?.primaryExam);

  const tabs = [
    {
      id: "doubts",
      label: "Trending Doubts",
      icon: MessageCircle,
      count: mockData.doubts.length,
    },
    {
      id: "questions",
      label: "Recent Questions",
      icon: BookOpen,
      count: mockData.questions.length,
    },
    {
      id: "resources",
      label: "Top Resources",
      icon: FileText,
      count: mockData.resources.length,
    },
    {
      id: "stories",
      label: "Success Stories",
      icon: TrendingUp,
      count: mockData.stories.length,
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                Aspirant Network
              </h1>
              <Badge variant="default" className="">
                {user?.primaryExam}
              </Badge>
            </div>

            <ProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}!
            </h2>
            <p className="text-gray-600">
              Here's what's happening in the {user?.primaryExam} community
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-white text-primary shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feed Content */}
          <div className="space-y-4">
            {activeTab === "doubts" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Trending Doubts</h3>
                  <Button variant="outline" size="sm">
                    Ask Question
                  </Button>
                </div>
                {mockData.doubts.map((doubt) => (
                  <DoubtCard key={doubt.id} doubt={doubt} />
                ))}
              </div>
            )}

            {activeTab === "questions" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Questions</h3>
                  <Button variant="outline" size="sm">
                    Practice Now
                  </Button>
                </div>
                {mockData.questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            )}

            {activeTab === "resources" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Top Resources</h3>
                  <Button variant="outline" size="sm">
                    Upload Resource
                  </Button>
                </div>
                {mockData.resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}

            {activeTab === "stories" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Success Stories</h3>
                  <Button variant="outline" size="sm">
                    Share Story
                  </Button>
                </div>
                {mockData.stories.map((story) => (
                  <FeedCard key={story.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{story.title}</CardTitle>
                      <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                        <span>by {story.author}</span>
                        <div className="flex items-center space-x-4">
                          <span>{story.readTime} read</span>
                          <span>{story.likes} likes</span>
                          <span>{story.timeAgo}</span>
                        </div>
                      </div>
                    </CardHeader>
                  </FeedCard>
                ))}
              </div>
            )}

            {/* Load More Button */}
            <div className="text-center pt-6">
              <Button variant="outline">
                Load More
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
