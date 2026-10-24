import { useParams } from 'react-router-dom';
import AdminUserDetail from '~/components/admin/admin-user-detail';

/**
 * Detail page for one account.
 */
const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return <AdminUserDetail userId={id} />;
};

export default UserDetailPage;
