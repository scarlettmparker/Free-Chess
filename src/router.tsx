import { lazy, Suspense } from 'react';
import { useRoutes, type RouteObject } from 'react-router-dom';
import AdminPageSkeleton from '~/components/admin/admin-page-skeleton';

const ChessPage = lazy(() => import('~/routes/index'));
const LoginPage = lazy(() => import('~/routes/login'));
const AdminLayout = lazy(() => import('~/routes/admin/admin-layout'));
const AdminPage = lazy(() => import('~/routes/admin'));
const NotFound = lazy(() => import('~/routes/not-found'));

/**
 * Application routes.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <Suspense fallback={null}>
        <ChessPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<AdminPageSkeleton />}>
        <AdminLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<AdminPageSkeleton />}>
            <AdminPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    ),
  },
];

export const Router = () => {
  return useRoutes(routes);
};
