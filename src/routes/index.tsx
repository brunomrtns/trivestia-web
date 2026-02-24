import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate
} from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard';
import { AdminGuard } from './guards/AdminGuard';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout/AppLayout';

// ─── Lazy pages ───────────────────────────────────────────────────────────────

// Public
const LandingPage = lazy(() => import('@/pages/public/LandingPage'));
const CoursesPage = lazy(() => import('@/pages/public/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/public/CourseDetailPage'));

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));

// Student
const DashboardPage = lazy(() => import('@/pages/student/DashboardPage'));
const ActivityPlayerPage = lazy(
  () => import('@/pages/student/ActivityPlayerPage')
);
const ProgressPage = lazy(() => import('@/pages/student/ProgressPage'));

// Admin
const AdminCoursesPage = lazy(() => import('@/pages/admin/AdminCoursesPage'));
const AdminLessonsPage = lazy(() => import('@/pages/admin/AdminLessonsPage'));
const AdminQuestionsPage = lazy(
  () => import('@/pages/admin/AdminQuestionsPage')
);

// ─── Loading fallback ────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/courses', element: <CoursesPage /> },
      { path: '/courses/:courseId', element: <CourseDetailPage /> }
    ]
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> }
    ]
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/app/dashboard', element: <DashboardPage /> },
          {
            path: '/app/lessons/:lessonId/activities/:activityId',
            element: <ActivityPlayerPage />
          },
          { path: '/app/progress', element: <ProgressPage /> }
        ]
      }
    ]
  },
  {
    element: <AdminGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/admin/courses', element: <AdminCoursesPage /> },
          {
            path: '/admin/courses/:courseId/lessons',
            element: <AdminLessonsPage />
          },
          {
            path: '/admin/lessons/:lessonId/activities/:activityId/questions',
            element: <AdminQuestionsPage />
          }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/" /> }
]);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
