import { Pagination } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import type { AdminUserPage } from '~/utils/admin-user-types';
import styles from './admin-user-list-pagination.module.css';

type AdminUserListPaginationProps = {
  /**
   * Zero-based page index.
   */
  page: number;
  /**
   * Committed search query.
   */
  search: string;
  /**
   * Called when the page changes.
   */
  onPageChange: (page: number) => void;
};

/**
 * Pagination for the admin user list.
 */
const AdminUserListPagination = (props: AdminUserListPaginationProps) => {
  const { page, search, onPageChange } = props;
  const { data } = usePageData<AdminUserPage>('adminUsers', 'adminUsers', {
    page: String(page),
    search: search || undefined,
  });

  if (!data || data.totalPages <= 1) {
    return null;
  }

  return (
    <Pagination
      className={styles.pagination}
      page={page + 1}
      totalPages={data.totalPages}
      onPageChange={(next: number) => onPageChange(next - 1)}
    />
  );
};

export default AdminUserListPagination;
