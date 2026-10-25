import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import AdminUserDetail from '~/components/admin/admin-user-detail';
import AdminCardSkeleton from '~/components/admin/admin-card-skeleton';

/**
 * Detail page for one account.
 */
const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <Suspense fallback={<AdminCardSkeleton />}>
      <AdminUserDetail userId={id} />
    </Suspense>
  );
};

export default UserDetailPage;
