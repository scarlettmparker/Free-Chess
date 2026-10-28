import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation } from '@sun/ssr';
import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import type { MeQuery } from '~/generated/graphql';
import ConfirmDeactivateDialog from '~/components/profile/confirm-deactivate-dialog';
import styles from './danger-zone.module.css';

/**
 * Account deactivation controls.
 */
const DangerZone = () => {
  const { t } = useTranslation('profile');
  const { data: user } = usePageData<MeQuery['gaiaQueries']['me'] | null>(
    'currentUser',
    'currentUser',
    {},
  );
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  /**
   * Deactivates the account and returns to login.
   */
  const handleDeactivate = async () => {
    try {
      await executeMutation('gaia/deactivateAccount', {});
      window.location.assign('/login?deactivated=1');
    } catch {
      setError(t('deactivate-failed'));
      setConfirming(false);
    }
  };

  return (
    <>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>{t('danger-zone-title')}</CardTitle>
        </CardHeader>
        <CardBody>
          <p className={styles.body}>{t('danger-zone-body')}</p>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </CardBody>
        <CardFooter className={styles.footer}>
          <Button type="button" variant="destructive" onClick={() => setConfirming(true)}>
            {t('deactivate-account')}
          </Button>
        </CardFooter>
      </Card>
      <ConfirmDeactivateDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleDeactivate}
        username={user.username}
      />
    </>
  );
};

export default DangerZone;
