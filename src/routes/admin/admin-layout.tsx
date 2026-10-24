import { Outlet } from 'react-router-dom';
import AdminSubnav from '~/components/admin/admin-subnav';

/**
 * Shell for all /admin pages.
 */
const AdminLayout = () => (
  <>
    <AdminSubnav />
    <Outlet />
  </>
);

export default AdminLayout;
