import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation
} from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard';
import { AdminGuard } from './guards/AdminGuard';
import { SuperAdminGuard } from './guards/SuperAdminGuard';
import { PlatformGuard } from './guards/PlatformGuard';
import { PublicLayout } from '@/layouts/PublicLayout';
import { TenantPublicLayout } from '@/layouts/TenantPublicLayout';
import { TenantAuthLayout } from '@/layouts/TenantAuthLayout';
import { AppLayout } from '@/layouts/AppLayout/AppLayout';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout/SuperAdminLayout';
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout/WorkspaceLayout';
import { authStorage } from '@/features/auth/storage';
import { useAuthStore } from '@/features/auth/auth.store';

// ─── Lazy pages ───────────────────────────────────────────────────────────────

// Public / Platform
const LandingPage = lazy(() => import('@/pages/public/LandingPage'));
const CoursesPage = lazy(() => import('@/pages/public/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/public/CourseDetailPage'));
const CreateSchoolPage = lazy(() => import('@/pages/public/CreateSchoolPage'));
const GlobalLoginPage = lazy(() => import('@/pages/platform/GlobalLoginPage'));

// Workspace (professor)
const WorkspacePage = lazy(() => import('@/pages/workspace/WorkspacePage'));
const WorkspaceCreateSchoolPage = lazy(
  () => import('@/pages/workspace/CreateSchoolPage')
);

// Platform
const ProfessorRegisterPage = lazy(
  () => import('@/pages/platform/ProfessorRegisterPage')
);

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));

// Student
const DashboardPage = lazy(() => import('@/pages/student/DashboardPage'));
const LessonPage = lazy(() => import('@/pages/student/LessonPage'));
const ActivityPlayerPage = lazy(
  () => import('@/pages/student/ActivityPlayerPage')
);
const ProgressPage = lazy(() => import('@/pages/student/ProgressPage'));
const CourseInteractivePage = lazy(
  () => import('@/pages/student/CourseInteractivePage')
);

const PracticeLabPage = lazy(() => import('@/pages/student/PracticeLabPage'));
const PracticeHistoryPage = lazy(
  () => import('@/pages/student/PracticeHistoryPage')
);

// Admin
const AdminCoursesPage = lazy(() => import('@/pages/admin/AdminCoursesPage'));
const AdminLessonsPage = lazy(() => import('@/pages/admin/AdminLessonsPage'));
const AdminQuestionsPage = lazy(() => import('@/pages/admin/AdminQuestionsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminLessonStepsPage = lazy(() => import('@/pages/admin/AdminLessonStepsPage'));
const AnnouncementsPage = lazy(() => import('@/pages/student/AnnouncementsPage'));
const SettingsPage = lazy(() => import('@/pages/student/SettingsPage'));
const AdminAnnouncementsPage = lazy(() => import('@/pages/admin/AdminAnnouncementsPage'));
const AdminPeriodsPage = lazy(() => import('@/pages/admin/AdminPeriodsPage'));
const AdminOffersPage = lazy(() => import('@/pages/admin/AdminOffersPage'));

// Payment
const PaymentSuccessPage = lazy(() => import('@/pages/payment/PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('@/pages/payment/PaymentCancelPage'));
const OnboardingPage = lazy(() => import('@/pages/workspace/OnboardingPage'));

// Super Admin
const SuperDashboardPage = lazy(() => import('@/pages/super/SuperDashboardPage'));
const SuperTenantsPage = lazy(() => import('@/pages/super/SuperTenantsPage'));
const SuperTenantEditPage = lazy(() => import('@/pages/super/SuperTenantEditPage'));
const SuperUsersPage = lazy(() => import('@/pages/super/SuperUsersPage'));

// ─── Loading fallback ────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// ─── Legacy redirect helper ──────────────────────────────────────────────────
/**
 * Redireciona paths legados (/login, /register, /app/*, /courses, …)
 * levando em conta o estado de autenticação e o último tenant visitado.
 * Fluxo:
 *  - Autenticado  + slug  → /t/:slug/app/dashboard   (ou /app/courses para paths de cursos)
 *  - Sem auth     + slug  → /t/:slug/login            (ou /register se o path era /register)
 *  - Sem slug             → /create-school
 */
function LegacyRedirect() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { pathname } = useLocation();
  const slug = authStorage.getLastTenantSlug();

  // loadSession() é síncrono (main.tsx), mas checamos por segurança
  if (isLoading) return null;

  if (!slug) return <Navigate to="/create-school" replace />;

  if (isAuthenticated) {
    // Preserva intenção de navegar para cursos
    if (pathname.startsWith('/courses')) {
      const rest = pathname.slice('/courses'.length); // '' | '/:id'
      return <Navigate to={`/t/${slug}/app/courses${rest}`} replace />;
    }
    return <Navigate to={`/t/${slug}/app/dashboard`} replace />;
  }

  // Não autenticado — preserva intenção de registro vs login
  if (pathname === '/register')
    return <Navigate to={`/t/${slug}/register`} replace />;
  if (pathname.startsWith('/courses')) {
    const rest = pathname.slice('/courses'.length);
    return <Navigate to={`/t/${slug}/courses${rest}`} replace />;
  }
  return <Navigate to={`/t/${slug}/login`} replace />;
}

// ─── Rotas tenant-scoped ─────────────────────────────────────────────────────

const tenantAppRoutes = [
  { path: 'dashboard', element: <DashboardPage /> },
  { path: 'courses', element: <CoursesPage /> },
  { path: 'courses/:courseId', element: <CourseDetailPage /> },
  { path: 'courses/:courseId/interactive', element: <CourseInteractivePage /> },
  { path: 'lessons/:lessonId', element: <LessonPage /> },
  {
    path: 'lessons/:lessonId/activities/:activityId',
    element: <ActivityPlayerPage />
  },
  { path: 'activity/:activityId', element: <ActivityPlayerPage /> },
  { path: 'lab', element: <PracticeLabPage /> },
  { path: 'lab/history', element: <PracticeHistoryPage /> },
  { path: 'progress', element: <ProgressPage /> },
  { path: 'announcements', element: <AnnouncementsPage /> },
  { path: 'settings', element: <SettingsPage /> }
];

const tenantAdminRoutes = [
  { path: 'courses', element: <AdminCoursesPage /> },
  { path: 'courses/:courseId/lessons', element: <AdminLessonsPage /> },
  { path: 'courses/:courseId/periods', element: <AdminPeriodsPage /> },
  {
    path: 'lessons/:lessonId/activities/:activityId/questions',
    element: <AdminQuestionsPage />
  },
  {
    path: 'courses/:courseId/lessons/:lessonId/steps',
    element: <AdminLessonStepsPage />
  },
  { path: 'users', element: <AdminUsersPage /> },
  { path: 'announcements', element: <AdminAnnouncementsPage /> },
  { path: 'offers', element: <AdminOffersPage /> }
];

// ─── Router ──────────────────────────────────────────────────────────────────

const router = createBrowserRouter(
  [
    // ── Global pages (sem tenant) ────────────────────────────────────────────
    {
      element: <PublicLayout />,
      children: [{ path: '/', element: <LandingPage /> }]
    },
    { path: '/create-school', element: <CreateSchoolPage /> },

    // ── Login global (2-step: professor + aluno) ─────────────────────────────
    { path: '/login', element: <GlobalLoginPage /> },

    // ── Workspace (professor autenticado) ────────────────────────────────────
    {
      element: <PlatformGuard />,
      children: [
        {
          path: '/workspace',
          element: <WorkspaceLayout />,
          children: [
            { index: true, element: <WorkspacePage /> },
            { path: 'create-school', element: <WorkspaceCreateSchoolPage /> },
            { path: 'onboarding', element: <OnboardingPage /> }
          ]
        }
      ]
    },

    // ── Registro de professor (conta da plataforma) ────────────────────────────
    { path: '/register', element: <ProfessorRegisterPage /> },

    // ── Payment result pages ──────────────────────────────────────────────
    { path: '/payment/success', element: <PaymentSuccessPage /> },
    { path: '/payment/cancel', element: <PaymentCancelPage /> },

    // ── Legacy routes — redireciona para tenant ──────────────────────────────
    { path: '/app/*', element: <LegacyRedirect /> },
    { path: '/admin/*', element: <LegacyRedirect /> },
    { path: '/courses', element: <LegacyRedirect /> },
    { path: '/courses/:courseId', element: <LegacyRedirect /> },

    // ── Tenant routes (/t/:tenantSlug/*) ─────────────────────────────────────
    {
      path: '/t/:tenantSlug',
      children: [
        // Public tenant pages
        {
          element: <TenantPublicLayout />,
          children: [
            { index: true, element: <CoursesPage /> },
            { path: 'courses', element: <CoursesPage /> },
            { path: 'courses/:courseId', element: <CourseDetailPage /> }
          ]
        },
        // Auth pages (login/register)
        {
          element: <TenantAuthLayout />,
          children: [
            { path: 'login', element: <LoginPage /> },
            { path: 'register', element: <RegisterPage /> }
          ]
        },
        // Authenticated student routes
        {
          element: <AuthGuard />,
          children: [
            {
              path: 'app',
              element: <AppLayout />,
              children: tenantAppRoutes
            }
          ]
        },
        // Admin routes (ADMIN + OWNER)
        {
          element: <AdminGuard />,
          children: [
            {
              path: 'admin',
              element: <AppLayout />,
              children: tenantAdminRoutes
            }
          ]
        }
      ]
    },

    // ── Super Admin routes (/super/*) ──────────────────────────────────────────
    {
      element: <SuperAdminGuard />,
      children: [
        {
          path: '/super',
          element: <SuperAdminLayout />,
          children: [
            {
              index: true,
              element: <Navigate to="/super/dashboard" replace />
            },
            { path: 'dashboard', element: <SuperDashboardPage /> },
            { path: 'tenants', element: <SuperTenantsPage /> },
            { path: 'tenants/:tenantId', element: <SuperTenantEditPage /> },
            { path: 'users', element: <SuperUsersPage /> }
          ]
        }
      ]
    },

    // ── Catch-all ────────────────────────────────────────────────────────────
    { path: '*', element: <Navigate to="/" /> }
  ],
  { basename: '/trivestia' }
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
