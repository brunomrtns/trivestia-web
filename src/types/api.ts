// DTOs alinhados ao backend trademaster-api (Prisma schema + endpoints reais)

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'STUDENT';

export type ActivityType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'ORDERING'
  | 'TEXT_INPUT'
  | 'SCENARIO';

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

// ─── Course / Module / Lesson ─────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons?: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  title: string;
  order: number;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  moduleId: string;
  activities?: ActivitySummary[];
}

// ─── Activity / Question ──────────────────────────────────────────────────────

export interface ActivitySummary {
  id: string;
  title: string;
  order: number;
  type: ActivityType;
}

export interface Activity {
  id: string;
  title: string;
  order: number;
  lessonId: string;
  type: ActivityType;
  questions: Question[];
}

// Questão vista pelo STUDENT: sem isCorrect nas options
export interface Question {
  id: string;
  statement: string;
  difficulty: number;
  explanation: string;
  weight: number;
  order: number;
  options: QuestionOption[];
  metadata?: QuestionMetadata;
}

// Option sem isCorrect (view do aluno — nunca vazar gabarito)
export interface QuestionOption {
  id: string;
  text: string;
  order: number;
}

// Option com isCorrect (view do admin)
export interface AdminQuestionOption extends QuestionOption {
  isCorrect: boolean;
}

export interface QuestionMetadata {
  id: string;
  jsonData: Record<string, unknown>;
}

// ─── Answers (POST /submissions) ──────────────────────────────────────────────

export type SingleSelectAnswer = { selectedOptionId: string };
export type MultiSelectAnswer = { selectedOptionIds: string[] };
export type OrderingAnswer = { orderedOptionIds: string[] };
export type TextInputAnswer = { text: string };

export type Answer =
  | SingleSelectAnswer
  | MultiSelectAnswer
  | OrderingAnswer
  | TextInputAnswer;

export interface QuestionAnswer {
  questionId: string;
  answer: Answer;
}

export interface SubmitActivityRequest {
  activityId: string;
  responses: QuestionAnswer[];
}

// ─── Submission Result (POST /submissions → 201) ──────────────────────────────

export interface SubmissionResult {
  submissionId: string;
  score: number;
  maxScore: number;
  percentage: number;
  results: {
    questionId: string;
    isCorrect: boolean;
    earnedScore: number;
  }[];
}

// ─── Submission Review (GET /submissions/:activityId) ─────────────────────────

export interface SubmissionResponse {
  id: string;
  score: number;
  maxScore: number;
  completedAt: string;
  responses: {
    questionId: string;
    isCorrect: boolean;
    earnedScore: number;
    question: {
      statement: string;
      explanation: string;
      weight: number;
      options: QuestionOption[]; // student nunca recebe isCorrect aqui
    };
  }[];
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  score: number;
  status: ProgressStatus;
  completedAt: string | null;
  lesson?: LessonSummary;
}

// ─── Admin DTOs ───────────────────────────────────────────────────────────────

export interface CreateCourseDTO {
  title: string;
  description: string;
}

export interface UpdateCourseDTO {
  title?: string;
  description?: string;
}

export interface CreateModuleDTO {
  title: string;
  order: number;
}

export interface CreateLessonDTO {
  title: string;
  order: number;
}

export interface CreateActivityDTO {
  title: string;
  order: number;
  type: ActivityType;
}

export interface CreateQuestionDTO {
  statement: string;
  difficulty?: number;
  explanation?: string;
  weight?: number;
  order?: number;
  options: { text: string; isCorrect: boolean; order: number }[];
  metadata?: Record<string, unknown>;
}
