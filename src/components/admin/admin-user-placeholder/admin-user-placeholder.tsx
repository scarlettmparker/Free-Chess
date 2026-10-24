import { useTranslation } from '@sun/i18n';
import { Card, CardBody } from '@sun/components';

/**
 * Placeholder shown until an account is selected.
 */
const AdminUserPlaceholder = () => {
  const { t } = useTranslation('admin');

  return (
    <Card>
      <CardBody>
        <p>{t('select-user')}</p>
      </CardBody>
    </Card>
  );
};

export default AdminUserPlaceholder;
