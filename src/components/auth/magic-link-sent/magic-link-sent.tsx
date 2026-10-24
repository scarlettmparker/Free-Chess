import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Button } from '@sun/components';
import styles from './magic-link-sent.module.css';

/**
 * Confirmation shown after a sign-in link is requested.
 */
const MagicLinkSent = () => {
  const { t } = useTranslation('login');
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '';
  const target = `/login?mode=magic&redirect=${encodeURIComponent(redirect)}`;

  return (
    <div className={styles.sent}>
      <p>{t('sent-body')}</p>
      <Link to={target} className={styles.link}>
        <Button type="button" variant="secondary">
          {t('back-to-password')}
        </Button>
      </Link>
    </div>
  );
};

export default MagicLinkSent;
