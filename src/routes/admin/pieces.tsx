import { Suspense } from 'react';
import PiecesPage from '~/components/piece-editor/piece-editor';
import AdminPageSkeleton from '~/components/admin/admin-page-skeleton';

/**
 * Pieces administration page.
 */
const Pieces = () => (
  <Suspense fallback={<AdminPageSkeleton />}>
    <PiecesPage />
  </Suspense>
);

export default Pieces;
