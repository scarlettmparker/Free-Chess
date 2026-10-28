import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { usePageData } from '@sun/ssr/react';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@sun/components';
import LoginPanel from '~/components/auth/login-panel';
import MagicLinkSent from '~/components/auth/magic-link-sent';
import type { LoginOptions } from '~/utils/login-data';
import styles from './login.module.css';

/**
 * Login page.
 */
const Login = () => {
  const { t } = useTranslation('login');
  const [searchParams] = useSearchParams();
  const { data } = usePageData<LoginOptions>('loginOptions', 'loginOptions', {});
  const sent = searchParams.get('sent') === '1';
  const deactivated = searchParams.get('deactivated') === '1';
  let description = t('subtitle');
  if (sent) description = t('sent-subtitle');
  if (deactivated) description = t('deactivated');

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>{sent ? t('sent-title') : t('title')}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardBody>
          {sent ? <MagicLinkSent /> : <LoginPanel googleEnabled={data?.google ?? false} />}
        </CardBody>
      </Card>
    </div>
  );
};

export default Login;
