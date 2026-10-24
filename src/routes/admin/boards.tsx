import { Suspense } from 'react';
import BoardEditor from '~/components/board-editor/board-editor';
import AdminPageSkeleton from '~/components/admin/admin-page-skeleton';

/**
 * Board layouts administration page.
 */
const Boards = () => (
  <Suspense fallback={<AdminPageSkeleton />}>
    <BoardEditor />
  </Suspense>
);

export default Boards;
