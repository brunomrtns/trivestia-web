// DTOs alinhados ao backend trademaster-api (Prisma schema + endpoints reais)

// ─── Re-exports sim-core ──────────────────────────────────────────────────────

import type {
  Candle,
  CandleConfig,
  ExecutionConfig,
  ScoringConfig,
  ScoreResult,
  SimulationResult,
  SimulationState,
  ScenarioPayload,
  ScenarioConfig,
  OrderRequest,
  OrderSide,
  OrderType,
  Fill,
  Position,
  SimEvent
} from '@trivestia/sim-core';

export type {
  Candle,
  CandleConfig,
  ExecutionConfig,
  ScoringConfig,
  ScoreResult,
  SimulationResult,
  SimulationState,
  ScenarioPayload,
  ScenarioConfig,
  OrderRequest,
  OrderSide,
  OrderType,
  Fill,
  Position,
  SimEvent
};

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'STUDENT';

export type ActivityType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'ORDERING'
  | 'TEXT_INPUT'
  | 'SCENARIO'
  | 'CHART_MARKUP'
  | 'RISK_CALCULATOR'
  | 'SIM_TRADING_CHALLENGE';

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type StepType =
  | 'CONTENT_TEXT'
  | 'CONTENT_VIDEO'
  | 'CONTENT_IMAGE'
  | 'ACTIVITY';

// ─── Tenant ───────────────────────────────────────────────────────────────────

export interface TenantPublicProfile {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  logoUrl: string | null;
  themeJson: Record<string, string> | null;
}

export interface CreateTenantPublicData {
  name: string;
  slug: string;
  bio?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface CreateTenantClaimData {
  name: string;
  slug: string;
  bio?: string;
}

export interface TenantCreatedResponse {
  tenant: { id: string; slug: string; name: string };
  user: User;
  token: string;
  refreshToken: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  lastLoginAt?: string | null;
}

// ─── Admin: User Management ───────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserDetail extends AdminUser {
  _count: { submissions: number; progress: number };
  progress: {
    score: number;
    status: ProgressStatus;
    completedAt: string | null;
    lesson: { id: string; title: string };
  }[];
}

export interface PaginatedUsers {
  data: AdminUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ListUsersParams {
  search?: string;
  role?: Role;
  page?: number;
  pageSize?: number;
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

// ─── Trade Activity Answers ───────────────────────────────────────────────────

export interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ChartMarkupZone extends BBox {
  type: 'SUPPORT' | 'RESISTANCE';
}

export type ChartMarkupAnswer = {
  chartMarkup: { zones: ChartMarkupZone[] };
};

export type RiskCalculatorAnswer = {
  riskCalc: { positionSize: number };
};

export type Answer =
  | SingleSelectAnswer
  | MultiSelectAnswer
  | OrderingAnswer
  | TextInputAnswer
  | ChartMarkupAnswer
  | RiskCalculatorAnswer;

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
    feedback?: Record<string, unknown>;
  }[];
}

// ─── Trade Activity Feedback Types ────────────────────────────────────────────

export type TradeGradeLabel = 'CORRECT' | 'PARTIAL' | 'WRONG';

export interface ChartMarkupFeedback {
  iou: number;
  scoreRatio: number; // 0..1, proporcional ao IoU
  label: TradeGradeLabel;
  expected: ChartMarkupZone;
  user: ChartMarkupZone | null;
  message: string | null;
}

export interface RiskCalculatorFeedback {
  label: TradeGradeLabel;
  scoreRatio: number; // 0..1, proporcional à proximidade
  expectedPositionSize: number;
  userPositionSize: number | null;
  diffPercent: number;
  message: string | null;
}

// ─── Trade Activity Metadata (for admin/renderer) ─────────────────────────────

export interface ChartMarkupMetadata {
  chartMarkup: {
    imageUrl: string;
    expected?: ChartMarkupZone; // stripped for student
    threshold?: number; // stripped for student
    feedback?: string;
  };
}

export interface RiskCalculatorMetadata {
  riskCalc: {
    balance: number;
    riskPercent: number;
    entryPrice: number;
    stopPrice: number;
    contractValue?: number;
    rounding?: number;
    tolerancePercent?: number; // stripped for student
    feedback?: string; // stripped for student
  };
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

// ─── Lesson Steps (Timeline / Etapas) ─────────────────────────────────────────

export interface LessonStepDTO {
  id: string;
  type: StepType;
  title: string;
  content: Record<string, unknown>;
  order: number;
  isOptional: boolean;
  estimatedMinutes: number | null;
  isVirtual: boolean;
  isViewed: boolean;
}

export interface LessonTimelineDTO {
  lesson: {
    id: string;
    title: string;
    order: number;
    moduleId: string;
  };
  steps: LessonStepDTO[];
  progress: {
    viewed: number;
    total: number;
  };
}

export interface CreateStepDTO {
  type: StepType;
  title: string;
  content: Record<string, unknown>;
  order: number;
  isOptional?: boolean;
  estimatedMinutes?: number;
}

export interface UpdateStepDTO {
  type?: StepType;
  title?: string;
  content?: Record<string, unknown>;
  order?: number;
  isOptional?: boolean;
  estimatedMinutes?: number | null;
}

export interface ReorderStepsDTO {
  orders: { stepId: string; order: number }[];
}

// ─── Course Interactive (Curso Interativo) ────────────────────────────────────

export interface CourseInteractiveLessonProgress {
  status: ProgressStatus;
  percent: number;
  score: number | null;
  completedAt: string | null;
}

export interface CourseInteractiveTimelineSummary {
  totalSteps: number;
  viewedSteps: number;
  totalActivities: number;
  completedActivities: number;
}

export interface CourseInteractiveLesson {
  id: string;
  title: string;
  order: number;
  moduleId: string;
  progress: CourseInteractiveLessonProgress;
  timelineSummary: CourseInteractiveTimelineSummary;
}

export interface CourseInteractiveModule {
  id: string;
  title: string;
  order: number;
  progress: { percent: number; completedLessons: number; totalLessons: number };
  lessons: CourseInteractiveLesson[];
}

export interface CourseInteractiveNext {
  moduleId: string;
  lessonId: string;
  stepId?: string;
  activityId?: string;
  kind: 'STEP' | 'ACTIVITY';
}

export interface CourseInteractiveDTO {
  course: { id: string; title: string; description: string };
  progress: { percent: number; completedLessons: number; totalLessons: number };
  modules: CourseInteractiveModule[];
  next: CourseInteractiveNext | null;
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

// ─── Simulation / Challenge ───────────────────────────────────────────────────

export interface ChallengeBriefingData {
  activityId: string;
  title: string;
  description: string | null;
  objectives: {
    minPnlPercent: number;
    maxDrawdownPercent: number;
    minTradeCount: number;
  } | null;
  rules: {
    initialBalance: number;
    maxEvents: number;
    maxLeverage: number;
    allowShort: boolean;
    feeBps: number;
  };
  alreadyPassed: boolean;
  lastAttempt?: {
    score: number;
    passed: boolean;
    attemptCount: number;
  };
}

export interface ChallengeSubmitResponse {
  submissionId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  result: SimulationResult;
  scoreResult: ScoreResult | null;
  tamperDetected: boolean;
}

export interface PracticeScenarioRequest {
  numCandles?: number;
  timeframeMs?: number;
  volatility?: number;
  trend?: number;
  spreadBps?: number;
  initialBalance?: number;
}

export interface PracticeScenarioResponse {
  sessionId: string;
  candles: Candle[];
  executionConfig: ExecutionConfig;
  scenarioToken: string;
  maxEvents: number;
}

export interface PracticeSubmitResponse {
  sessionId: string;
  result: SimulationResult;
}

export interface PracticeHistoryItem {
  id: string;
  createdAt: string;
  hasResult: boolean;
  result: {
    totalPnlPercent: number;
    tradeCount: number;
    winRate: number;
    maxDrawdownPercent: number;
  } | null;
}

export interface PracticeHistoryResponse {
  sessions: PracticeHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Super Admin Types ────────────────────────────────────────────────────────

export interface SuperTenant {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  logoUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { users: number; courses: number };
}

export interface SuperTenantDetail extends SuperTenant {
  themeJson: Record<string, string> | null;
  users: { id: string; name: string; email: string; role: Role }[];
}

export interface PaginatedSuperTenants {
  data: SuperTenant[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTenantSuperData {
  name: string;
  slug: string;
  bio?: string;
  enabled?: boolean;
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
}

export interface UpdateTenantSuperData {
  name?: string;
  slug?: string;
  bio?: string | null;
  logoUrl?: string | null;
  enabled?: boolean;
}

export interface SuperUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  createdAt: string;
  lastLoginAt: string | null;
  tenant: { slug: string; name: string };
}

export interface PaginatedSuperUsers {
  data: SuperUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ListSuperUsersParams {
  search?: string;
  role?: Role;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListSuperTenantsParams {
  search?: string;
  enabled?: 'true' | 'false';
  page?: number;
  pageSize?: number;
}

export interface PlatformStats {
  tenants: { total: number; active: number };
  users: number;
  courses: number;
}

// ─── Platform Auth ────────────────────────────────────────────────────────────

export type PlatformRole = 'SUPER_ADMIN' | 'DOMAIN_ADMIN';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  tenantId?: string | null;
}

export interface PlatformAuthResponse {
  user: PlatformUser;
  token: string;
  refreshToken: string;
}

export interface ResolveEmailResponse {
  platformAccount: boolean;
  tenants: Array<{ slug: string; name: string }>;
}

export interface PlatformMeResponse {
  user: PlatformUser;
  hasSchool: boolean;
  tenantSlug: string | null;
  tenantName: string | null;
}

export interface CreatePlatformTenantData {
  name: string;
  slug: string;
  bio?: string;
}

export interface PlatformTenantCreatedResponse {
  tenant: { id: string; slug: string; name: string };
}
