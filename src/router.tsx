import { lazy, Suspense } from 'react';
import { useRoutes, type RouteObject } from 'react-router-dom';

const ChessPage = lazy(() => import('~/routes/index'));
const LoginPage = lazy(() => import('~/routes/login'));
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
