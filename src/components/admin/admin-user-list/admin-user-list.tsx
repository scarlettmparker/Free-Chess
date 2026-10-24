import { Suspense, useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  SearchBar,
  Skeleton,
} from '@sun/components';
import CreateUserDialog from '~/components/admin/create-user-dialog';
import AdminUserListFooter from '~/components/admin/admin-user-list-footer';
import AdminUserListItems from '~/components/admin/admin-user-list-items';
import AdminUserListPagination from '~/components/admin/admin-user-list-pagination';
import type { CreateUserValues } from '~/utils/admin-user-types';
import RoleCheck from '~/utils/role-check';
import styles from './admin-user-list.module.css';

type AdminUserListProps = {
  /**
   * Committed search query.
   */
  search: string;
  /**
   * Zero-based page index.
   */
  page: number;
  /**
   * Called when the user submits a search.
   */
  onSearch: (value: string) => void;
  /**
   * Called when the user navigates to a new page.
   */
  onPageChange: (page: number) => void;
};

/**
 * Searchable, paginated list of accounts.
 */
const AdminUserList = (props: AdminUserListProps) => {
  const { search, page, onSearch, onPageChange } = props;
  const { t } = useTranslation('admin');
  const [searchInput, setSearchInput] = useState(search);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (values: CreateUserValues) => {
    await executeMutation('user/create', values);
    revalidatePageData([
      makeCacheKey('adminUsers', {
        page: String(page),
        search: search || undefined,
      }),
    ]);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('users-title')}</CardTitle>
          <CardDescription>{t('users-description')}</CardDescription>
        </CardHeader>
        <CardBody>
          <div className={styles.toolbar}>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={onSearch}
              placeholder={t('search-placeholder')}
            />
            <RoleCheck roles={['admin', 'user-admin']} match="any">
              <Button type="button" onClick={() => setCreateOpen(true)}>
                {t('create-user')}
              </Button>
            </RoleCheck>
          </div>
          <Suspense fallback={<Skeleton className={styles.skeleton} />}>
            <AdminUserListItems search={search} page={page} />
          </Suspense>
        </CardBody>
        <Suspense fallback={null}>
          <AdminUserListFooter search={search} page={page} />
        </Suspense>
      </Card>
      <Suspense fallback={null}>
        <AdminUserListPagination search={search} page={page} onPageChange={onPageChange} />
      </Suspense>
      {createOpen && (
        <CreateUserDialog open onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />
      )}
    </>
  );
};

export default AdminUserList;
